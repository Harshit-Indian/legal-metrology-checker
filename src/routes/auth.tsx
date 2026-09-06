import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Scale, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Legal Metrology Compliance Checker" },
      {
        name: "description",
        content:
          "Secure sign-in for inspectors, manufacturers and administrators using the Legal Metrology label compliance system.",
      },
      { property: "og:title", content: "Sign in — Legal Metrology Compliance Checker" },
      {
        property: "og:description",
        content: "Secure access for inspectors, manufacturers and administrators.",
      },
    ],
  }),
  component: AuthPage,
});

const ROLES = [
  { value: "inspector", label: "Inspector (enforcement officer)" },
  { value: "manufacturer", label: "Manufacturer / packer" },
  { value: "admin", label: "Administrator" },
];

function AuthPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [organization, setOrganization] = useState("");
  const [role, setRole] = useState("inspector");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/dashboard" });
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName, organization, role },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data.session) {
      toast.success("Account created. Check your email to confirm before signing in.");
      return;
    }
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-3">
          <Scale className="h-6 w-6 text-sidebar-primary" />
          <span className="font-semibold">Legal Metrology Compliance Checker</span>
        </div>
        <div className="max-w-md space-y-4">
          <h2 className="text-2xl font-semibold leading-snug">
            Verify packaged commodity declarations against the Legal Metrology (Packaged
            Commodities) Rules, 2011.
          </h2>
          <p className="text-sm text-sidebar-foreground/70">
            Capture label evidence, extract mandatory declarations, and record violations with rule
            references and severity for enforcement follow-up.
          </p>
        </div>
        <p className="text-xs text-sidebar-foreground/50">
          Restricted system. Activity is attributed to your account.
        </p>
      </div>

      <div className="flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            <Scale className="h-5 w-5 text-primary" />
            <span className="font-semibold">Legal Metrology Checker</span>
          </div>
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={signIn} className="gov-panel space-y-4 p-5">
                <div className="space-y-1.5">
                  <Label htmlFor="si-email">Official email</Label>
                  <Input
                    id="si-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="si-pass">Password</Label>
                  <Input
                    id="si-pass"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={signUp} className="gov-panel space-y-4 p-5">
                <div className="space-y-1.5">
                  <Label htmlFor="su-name">Full name</Label>
                  <Input
                    id="su-name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-org">Department / organisation</Label>
                  <Input
                    id="su-org"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-email">Official email</Label>
                  <Input
                    id="su-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-pass">Password</Label>
                  <Input
                    id="su-pass"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            <Link to="/" className="underline underline-offset-4">
              Back to overview
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
