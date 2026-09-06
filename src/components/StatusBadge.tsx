import { CheckCircle2, AlertTriangle, ShieldOff, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const MAP: Record<string, { label: string; className: string; Icon: typeof CheckCircle2 }> = {
  compliant: {
    label: "Compliant",
    className: "bg-success/10 text-success border-success/30",
    Icon: CheckCircle2,
  },
  non_compliant: {
    label: "Non-compliant",
    className: "bg-destructive/10 text-destructive border-destructive/30",
    Icon: AlertTriangle,
  },
  exempt: {
    label: "Exempt",
    className: "bg-info/10 text-info border-info/30",
    Icon: ShieldOff,
  },
  pending: {
    label: "Pending",
    className: "bg-muted text-muted-foreground border-border",
    Icon: Clock,
  },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const entry = MAP[status] ?? MAP["pending"]!;
  const { Icon } = entry;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        entry.className,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {entry.label}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  const critical = severity === "critical";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        critical
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-warning/40 bg-warning/15 text-warning-foreground",
      )}
    >
      {critical ? "Critical" : "Minor"}
    </span>
  );
}
