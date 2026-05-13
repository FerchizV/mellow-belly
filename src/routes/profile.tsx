import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import type { Profile } from "@/lib/types";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile · Mellow Belly" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });

  useEffect(() => {
    if (profile) setName(profile.display_name);
  }, [profile]);

  const save = async () => {
    if (!user) return;
    if (!name.trim()) {
      toast.error("Display name can't be empty");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: name.trim() })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile updated");
    qc.invalidateQueries({ queryKey: ["profile", user.id] });
    qc.invalidateQueries({ queryKey: ["profiles"] });
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-md px-4 pt-10">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">
          Profile
        </p>
        <h1 className="text-3xl font-bold mt-1">Your account</h1>
      </header>
      <div className="space-y-4 rounded-3xl border border-border bg-card p-6">
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={user.email ?? ""} disabled className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label>Display name</Label>
          <Input
            value={name}
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl"
          />
          <p className="text-xs text-muted-foreground">
            Shown to other users on your public reviews.
          </p>
        </div>
        <Button
          onClick={save}
          disabled={saving}
          className="rounded-full w-full"
        >
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
      <Button
        variant="ghost"
        className="rounded-full w-full mt-6 text-muted-foreground"
        onClick={async () => {
          await signOut();
          navigate({ to: "/login" });
        }}
      >
        <LogOut size={16} className="mr-2" /> Sign out
      </Button>
    </div>
  );
}