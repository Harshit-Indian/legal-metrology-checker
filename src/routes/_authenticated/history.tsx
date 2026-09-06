import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "Scan history — Legal Metrology Compliance Checker" },
      {
        name: "description",
        content: "Search past label scans by product, manufacturer, date and compliance status.",
      },
      { property: "og:title", content: "Scan history — Legal Metrology Compliance Checker" },
      {
        property: "og:description",
        content: "Search past label scans by product, manufacturer, date and status.",
      },
    ],
  }),
  component: History,
});

function History() {
  const [product, setProduct] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["scans-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scans")
        .select("id, product_name, manufacturer_name, compliance_status, created_at, notes")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data;
    },
  });

  const rows = useMemo(() => {
    return (data ?? []).filter((s) => {
      if (product && !(s.product_name ?? "").toLowerCase().includes(product.toLowerCase()))
        return false;
      if (
        manufacturer &&
        !(s.manufacturer_name ?? "").toLowerCase().includes(manufacturer.toLowerCase())
      )
        return false;
      if (status !== "all" && s.compliance_status !== status) return false;
      const created = new Date(s.created_at);
      if (from && created < new Date(from)) return false;
      if (to && created > new Date(`${to}T23:59:59`)) return false;
      return true;
    });
  }, [data, product, manufacturer, status, from, to]);

  function reset() {
    setProduct("");
    setManufacturer("");
    setFrom("");
    setTo("");
    setStatus("all");
  }

  return (
    <AppShell title="Scan history" subtitle={`${rows.length} record(s) matching your filters`}>
      <div className="gov-panel mb-5 grid gap-4 p-4 md:grid-cols-5">
        <div className="space-y-1.5">
          <Label htmlFor="f-product">Product name</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="f-product"
              className="pl-8"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              placeholder="Search"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="f-manufacturer">Manufacturer</Label>
          <Input
            id="f-manufacturer"
            value={manufacturer}
            onChange={(e) => setManufacturer(e.target.value)}
            placeholder="Search"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="f-from">From</Label>
          <Input id="f-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="f-to">To</Label>
          <Input id="f-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="compliant">Compliant</SelectItem>
              <SelectItem value="non_compliant">Non-compliant</SelectItem>
              <SelectItem value="exempt">Exempt</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-5">
          <Button variant="outline" size="sm" onClick={reset}>
            Clear filters
          </Button>
        </div>
      </div>

      <div className="gov-panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-secondary/60">
            <tr className="text-left">
              <th className="px-4 py-2.5 font-semibold">Commodity</th>
              <th className="px-4 py-2.5 font-semibold">Manufacturer</th>
              <th className="px-4 py-2.5 font-semibold">Scanned</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-muted-foreground">
                  No scans match these filters.
                </td>
              </tr>
            ) : (
              rows.map((s) => (
                <tr key={s.id} className="hover:bg-secondary/50">
                  <td className="px-4 py-3 font-medium">
                    {s.product_name ?? "Unidentified commodity"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {s.manufacturer_name ?? "—"}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">
                    {new Date(s.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.compliance_status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to="/scans/$scanId"
                      params={{ scanId: s.id }}
                      className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
