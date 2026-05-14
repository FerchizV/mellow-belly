import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import logo from "@/assets/mellow-belly-logo.jpeg";
import { Mascot } from "@/components/mellow/Mascot";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Sign in · Mellow Belly" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [user, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (mode === "signup") {
      const name = displayName.trim() || email.split("@")[0];
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { display_name: name },
        },
      });
      setBusy(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Check your email to confirm your account");
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setBusy(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      navigate({ to: "/" });
    }
  };

  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: "#ece8dc" }}
    >
    <div className="mx-auto max-w-sm px-4 pt-12 pb-16">
      <Link to="/" className="block mx-auto mb-6 w-fit">
        <img
          src={logo}
          alt="Mellow Belly"
          className="h-24 w-auto mx-auto"
        />
      </Link>
      <Mascot className="h-28 w-auto mx-auto -mt-2 mb-2" />
      <h1 className="text-3xl font-bold text-center">
        {mode === "login" ? "Welcome back" : "Join the table"}
      </h1>
      <p className="text-muted-foreground mt-1 text-sm text-center">
        {mode === "login"
          ? "Sign in to log bites and see the community."
          : "Create an account to track your dairy-free finds."}
      </p>

      <form onSubmit={submit} className="space-y-4 mt-8">
        {mode === "signup" && (
          <div className="space-y-2">
            <Label>Display name</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={40}
              placeholder="What should others call you?"
              className="rounded-xl"
            />
          </div>
        )}
        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Password</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="rounded-xl"
          />
        </div>
        <Button
          type="submit"
          disabled={busy}
          className="w-full rounded-full h-12 text-base"
        >
          {busy
            ? "Please wait…"
            : mode === "login"
              ? "Sign in"
              : "Create account"}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => setMode(mode === "login" ? "signup" : "login")}
        className="text-sm text-muted-foreground mt-6 w-full text-center hover:text-foreground"
      >
        {mode === "login"
          ? "New here? Create an account"
          : "Already have an account? Sign in"}
      </button>
    </div>
    </div>
  );
}