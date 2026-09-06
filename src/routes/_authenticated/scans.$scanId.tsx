import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { StatusBadge, SeverityBadge } from "@/components/StatusBadge";
import { LABEL_FIELDS, fieldLabel } from "@/lib/compliance";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/scans/$scanId")({
  head: () => ({
    meta: [
      { title: "Scan result — Legal Metrology Compliance Checker" },
      {
        name: "description",
        content: "Extracted label declarations, compliance determination and violations found.",
      },
      { property: "og:title", content: "Scan result — Legal Metrology Compliance Checker" },
      {
        property: "og:description",
        content: "Extracted declarations, compliance determination and violations.",
      },
    ],
  }),
  component: ScanResult,
});

function ScanResult() {
  const { scanId } = Route.useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ["scan", scanId],
    queryFn: async () => {
      const [scanRes, fieldsRes, violationsRes, photosRes] = await Promise.all([
        supabase.from("scans").select("*").eq("id", scanId).single(),
        supabase.from("extracted_fields").select("*").eq("scan_id", scanId),
        supabase.from("violations").select("*").eq("scan_id", scanId),
        supabase
          .from("evidence_photos")
          .select("*")
          .eq("scan_id", scanId)
          .order("position", { ascending: true }),
      ]);
      if (scanRes.error) throw scanRes.error;

      const photos = photosRes.data ?? [];
      const signed = await Promise.all(
        photos.map(async (p) => {
          const { data } = await supabase.storage
            .from("evidence-photos")
            .createSignedUrl(p.storage_path, 3600);
          return { id: p.id, url: data?.signedUrl ?? null, name: p.file_name };
        }),
      );

      return {
        scan: scanRes.data,
        fields: fieldsRes.data ?? [],
        violations: violationsRes.data ?? [],
        photos: signed,
      };
    },
  });

  if (isLoading) {
    return (
      <AppShell title="Scan result">
        <p className="text-sm text-muted-foreground">Loading scan…</p>
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell title="Scan result">
        <p className="text-sm text-destructive">This scan could not be loaded.</p>
      </AppShell>
    );
  }

  const { scan, fields, violations, photos } = data;
  const valueOf = (key: string) => fields.find((f) => f.field_key === key)?.field_value ?? null;
  const criticals = violations.filter((v) => v.severity === "critical").length;

  return (
    <AppShell
      title={scan.product_name ?? "Unidentified commodity"}
      subtitle={`Scanned ${new Date(scan.created_at).toLocaleString()}`}
      actions={
        <Button asChild variant="outline" size="sm">
          <Link to="/history">
            <ArrowLeft className="mr-2 h-4 w-4" /> History
          </Link>
        </Button>
      }
    >
      <div className="gov-panel mb-6 flex flex-wrap items-center gap-6 p-5">
        <div>
          <p className="gov-label">Determination</p>
          <div className="mt-2">
            <StatusBadge status={scan.compliance_status} className="text-sm" />
          </div>
        </div>
        <div>
          <p className="gov-label">Violations</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{violations.length}</p>
        </div>
        <div>
          <p className="gov-label">Critical</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-destructive">{criticals}</p>
        </div>
        {scan.notes ? (
          <div className="min-w-52 flex-1">
            <p className="gov-label">Note</p>
            <p className="mt-1 text-sm text-muted-foreground">{scan.notes}</p>
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <section className="gov-panel overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Extracted declarations</h2>
          </div>
          <dl className="divide-y divide-border">
            {LABEL_FIELDS.map((f) => {
              const value = valueOf(f.key);
              return (
                <div key={f.key} className="grid grid-cols-2 gap-4 px-4 py-3">
                  <dt className="text-sm text-muted-foreground">{f.label}</dt>
                  <dd
                    className={
                      value ? "text-sm font-medium" : "text-sm italic text-destructive/80"
                    }
                  >
                    {value ?? "Not declared"}
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>

        <div className="space-y-6">
          <section className="gov-panel overflow-hidden">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">Violations</h2>
            </div>
            {violations.length === 0 ? (
              <p className="px-4 py-5 text-sm text-muted-foreground">
                No violations recorded for this label.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {violations.map((v) => (
                  <li key={v.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium">{v.title}</p>
                      <SeverityBadge severity={v.severity} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{v.description}</p>
                    <p className="mt-1.5 font-mono text-[11px] text-primary">{v.rule_reference}</p>
                    {v.field_key ? (
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Field: {fieldLabel(v.field_key)}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="gov-panel overflow-hidden">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">Evidence ({photos.length})</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4">
              {photos.map((p) =>
                p.url ? (
                  <a key={p.id} href={p.url} target="_blank" rel="noreferrer">
                    <img
                      src={p.url}
                      alt={p.name ?? "Label evidence"}
                      className="h-32 w-full rounded border object-cover"
                    />
                  </a>
                ) : null,
              )}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
