import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Scale, ScanLine, History, LayoutDashboard, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/scan", label: "New scan", Icon: ScanLine },
  { to: "/history", label: "Scan history", Icon: History },
] as const;

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex items-center gap-2.5 border-b border-sidebar-border px-5 py-4">
          <Scale className="h-5 w-5 text-sidebar-primary" />
          <div className="leading-tight">
            <div className="text-sm font-semibold">Legal Metrology</div>
            <div className="text-[11px] tracking-wide text-sidebar-foreground/60">
              Compliance Checker
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map(({ to, label, Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{
                className:
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium bg-sidebar-accent text-sidebar-accent-foreground",
              }}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-4 text-xs">
          <div className="truncate font-medium">{user?.email}</div>
          <div className="mt-0.5 uppercase tracking-wider text-sidebar-foreground/60">
            {role ?? "—"}
          </div>
          <button
            onClick={signOut}
            className="mt-3 inline-flex items-center gap-2 text-sidebar-foreground/70 transition-colors hover:text-sidebar-accent-foreground"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold">{title}</h1>
            {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>
          <div className="flex items-center gap-2">
            {actions}
            <Button variant="ghost" size="sm" className="md:hidden" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </header>
        <div className="flex gap-2 overflow-x-auto border-b border-border bg-card px-4 py-2 md:hidden">
          {NAV.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="rounded px-3 py-1.5 text-sm text-muted-foreground"
              activeProps={{ className: "rounded px-3 py-1.5 text-sm bg-secondary font-medium" }}
            >
              {label}
            </Link>
          ))}
        </div>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
