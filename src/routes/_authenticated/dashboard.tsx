import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ScanLine } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Legal Metrology Compliance Checker" },
      { name: "description", content: "Overview of label scans and compliance outcomes." },
      { property: "og:title", content: "Dashboard — Legal Metrology Compliance Checker" },
      { property: "og:description", content: "Overview of label scans and compliance outcomes." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-scans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scans")
        .select("id, product_name, manufacturer_name, compliance_status, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const scans = data ?? [];
  const count = (status: string) => scans.filter((s) => s.compliance_status === status).length;

  const stats = [
    { label: "Total scans", value: scans.length },
    { label: "Compliant", value: count("compliant") },
    { label: "Non-compliant", value: count("non_compliant") },
    { label: "Exempt", value: count("exempt") },
  ];

  return (
    <AppShell
      title="Dashboard"
      subtitle="Recent label verification activity"
      actions={
        <Button asChild size="sm">
          <Link to="/scan">
            <ScanLine className="mr-2 h-4 w-4" /> New scan
          </Link>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="gov-panel p-4">
            <p className="gov-label">{s.label}</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="gov-panel mt-6 overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Latest scans</h2>
        </div>
        {isLoading ? (
          <p className="p-4 text-sm text-muted-foreground">Loading…</p>
        ) : scans.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            No scans recorded yet. Start with a new scan.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {scans.slice(0, 8).map((s) => (
              <li key={s.id}>
                <Link
                  to="/scans/$scanId"
                  params={{ scanId: s.id }}
                  className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-secondary"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {s.product_name ?? "Unidentified commodity"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {s.manufacturer_name ?? "Manufacturer not declared"} ·{" "}
                      {new Date(s.created_at).toLocaleString()}
                    </p>
                  </div>
                  <StatusBadge status={s.compliance_status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
