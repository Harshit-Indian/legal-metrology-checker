import { createFileRoute, Link } from "@tanstack/react-router";
import { Scale, ScanLine, FileCheck2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Legal Metrology Compliance Checker — LMPC Rules 2011" },
      {
        name: "description",
        content:
          "Scan packaged commodity labels and check mandatory declarations against India's Legal Metrology (Packaged Commodities) Rules, 2011.",
      },
      { property: "og:title", content: "Legal Metrology Compliance Checker" },
      {
        property: "og:description",
        content:
          "Label evidence capture, declaration extraction and violation reporting for LMPC Rules 2011.",
      },
    ],
  }),
  component: Landing,
});

const POINTS = [
  {
    Icon: ScanLine,
    title: "Multi-photo label capture",
    body: "Attach every panel of a pack to one scan record so declarations spread across faces are read together.",
  },
  {
    Icon: FileCheck2,
    title: "Declaration extraction",
    body: "Manufacturer details, country of origin, net quantity, dates, MRP, consumer care and unit sale price.",
  },
  {
    Icon: ShieldAlert,
    title: "Violation register",
    body: "Each finding is graded critical or minor and cited to the rule it contravenes.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Scale className="h-5 w-5 text-sidebar-primary" />
            <span className="text-sm font-semibold">Legal Metrology Compliance Checker</span>
          </div>
          <Button asChild size="sm" variant="secondary">
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16">
        <p className="gov-label">Packaged Commodities Rules, 2011</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight sm:text-4xl">
          Check packaged commodity labels for mandatory declarations and record violations
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          A working tool for inspectors, manufacturers and administrators: upload label
          photographs, review the extracted declarations, and get a compliance determination with
          the exact rules cited.
        </p>
        <div className="mt-8 flex gap-3">
          <Button asChild>
            <Link to="/auth">Sign in to start a scan</Link>
          </Button>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {POINTS.map(({ Icon, title, body }) => (
            <section key={title} className="gov-panel p-5">
              <Icon className="h-5 w-5 text-primary" />
              <h2 className="mt-3 text-sm font-semibold">{title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
