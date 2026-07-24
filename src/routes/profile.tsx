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
import { Mascot } from "@/components/mellow/Mascot";
import type { Profile } from "@/lib/types";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile · Mellow Belly" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editingName, setEditingName] = useState(false);
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

  const { data: reviewCount = 0 } = useQuery({
    queryKey: ["review-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("reviews")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id);
      if (error) throw error;
      return count ?? 0;
    },
  });

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
    setEditingName(false);
    qc.invalidateQueries({ queryKey: ["profile", user.id] });
    qc.invalidateQueries({ queryKey: ["profiles"] });
  };

  const cancelEdit = () => {
    setName(profile?.display_name ?? "");
    setEditingName(false);
  };

  const mascotMessage =
    reviewCount > 0
      ? "Thank you for contributing to Mellow Belly!"
      : "Log your first bite to get started!";

  if (!user) return null;

  return (
    <div className="mx-auto max-w-md px-4 pt-10 pb-16">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">
          Profile
        </p>
        <h1 className="text-3xl font-bold mt-1">Your account</h1>
      </header>

      <div className="space-y-5 rounded-3xl border border-border bg-card p-6">
        {editingName ? (
          <div className="space-y-2">
            <Label>Display name</Label>
            <Input
              value={name}
              maxLength={40}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Shown to other users on your public reviews.
            </p>
            <div className="flex gap-2 pt-1">
              <Button
                onClick={save}
                disabled={saving}
                className="rounded-full flex-1"
              >
                {saving ? "Saving…" : "Save"}
              </Button>
              <Button
                variant="ghost"
                onClick={cancelEdit}
                disabled={saving}
                className="rounded-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-2xl font-bold truncate">
                {profile?.display_name || "…"}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5 truncate">
                {user.email}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full shrink-0"
              onClick={() => setEditingName(true)}
            >
              Change name
            </Button>
          </div>
        )}

        <div className="flex items-center gap-2 rounded-2xl bg-secondary/60 px-4 py-3">
          <span className="text-lg">🍴</span>
          <p className="text-sm">
            <span className="font-semibold">{reviewCount}</span> bite
            {reviewCount === 1 ? "" : "s"} logged
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 mt-6">
        <Mascot className="h-16 w-16 shrink-0" />
        <p className="max-w-[220px] rounded-2xl rounded-bl-sm bg-secondary px-4 py-3 text-sm text-secondary-foreground shadow-sm">
          {mascotMessage}
        </p>
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