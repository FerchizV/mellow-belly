import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, BookHeart, ChevronDown } from "lucide-react";
import logo from "@/assets/mellow-belly-logo.jpeg";
import { Mascot } from "@/components/mellow/Mascot";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Stars } from "@/components/mellow/Stars";
import { ReviewDialog } from "@/components/mellow/ReviewDialog";
import type { Place, Review } from "@/lib/types";
import { COMFORT_FACES, COMFORT_LABELS } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/diary")({
  head: () => ({
    meta: [
      { title: "My Diary · Mellow Belly" },
      {
        name: "description",
        content: "Every dairy-free bite, logged. Flavor, comfort, and notes.",
      },
    ],
  }),
  component: Diary,
});

function Diary() {
  const qc = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const [editing, setEditing] = useState<Review | null>(null);
  const [editPlace, setEditPlace] = useState<Place | null>(null);
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Review | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const { data: reviews = [] } = useQuery({
    queryKey: ["my-reviews", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Review[];
    },
  });

  const { data: places = [] } = useQuery({
    queryKey: ["places"],
    queryFn: async () => {
      const { data, error } = await supabase.from("places").select("*");
      if (error) throw error;
      return data as Place[];
    },
  });

  const placeMap = useMemo(
    () => Object.fromEntries(places.map((p) => [p.id, p])),
    [places],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, Review[]>();
    for (const r of reviews) {
      if (!map.has(r.place_id)) map.set(r.place_id, []);
      map.get(r.place_id)!.push(r);
    }
    // sort each group's reviews by date desc (already ordered, but be safe)
    const groups = Array.from(map.entries()).map(([placeId, list]) => {
      const sorted = [...list].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      return { placeId, reviews: sorted };
    });
    // sort groups by most recent visit desc
    groups.sort(
      (a, b) =>
        new Date(b.reviews[0].created_at).getTime() -
        new Date(a.reviews[0].created_at).getTime(),
    );
    return groups;
  }, [reviews]);

  const onEdit = (r: Review) => {
    setEditing(r);
    setEditPlace(placeMap[r.place_id] ?? null);
    setOpen(true);
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", confirmDelete.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Entry removed");
      qc.invalidateQueries({ queryKey: ["my-reviews", user?.id] });
      qc.invalidateQueries({ queryKey: ["reviews"] });
    }
    setConfirmDelete(null);
  };

  if (!authLoading && !user) {
    return (
      <div className="mx-auto max-w-md px-4 pt-20 text-center">
        <Mascot className="h-40 w-auto mx-auto mb-4" />
        <h1 className="text-2xl font-bold">Your diary lives here</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Sign in to log bites and keep a food diary.
        </p>
        <Link
          to="/login"
          className="inline-flex mt-6 items-center justify-center rounded-full bg-primary text-primary-foreground px-6 h-11 text-sm font-medium"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pt-8">
      <header className="mb-6">
        <img
          src={logo}
          alt="Mellow Belly"
          className="h-10 w-auto -ml-1 mb-2"
        />
        <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">
          My Diary
        </p>
        <h1 className="text-4xl font-bold mt-1">Every bite, remembered.</h1>
        <p className="text-muted-foreground mt-3 text-sm">
          {grouped.length} spot{grouped.length === 1 ? "" : "s"} ·{" "}
          {reviews.length} bite{reviews.length === 1 ? "" : "s"}
        </p>
      </header>

      {grouped.length === 0 ? (
        <div className="rounded-3xl bg-card border border-border p-12 text-center">
          <Mascot className="h-36 w-auto mx-auto mb-3" />
          <p className="font-medium">No bites yet.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Head to Discover and tap the + on a spot to start logging.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {grouped.map(({ placeId, reviews: visits }) => {
            const place = placeMap[placeId];
            const avgFlavor =
              visits.reduce((s, r) => s + r.flavor_rating, 0) / visits.length;
            const latestComfort = visits[0].comfort_score;
            const items = Array.from(
              new Set(visits.map((v) => v.item_ordered)),
            );
            const isOpen = !!expanded[placeId];

            return (
              <article
                key={placeId}
                className="rounded-3xl bg-card border border-border overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpanded((e) => ({ ...e, [placeId]: !e[placeId] }))
                  }
                  className="w-full text-left p-5 hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-lg leading-tight">
                        {place?.name ?? "Unknown spot"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {place?.neighborhood ?? "—"} · {visits.length} visit
                        {visits.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <ChevronDown
                      size={20}
                      className={cn(
                        "shrink-0 text-muted-foreground transition-transform",
                        isOpen && "rotate-180",
                      )}
                    />
                  </div>

                  <p className="mt-3 text-sm text-foreground/80">
                    <span className="text-muted-foreground">Ordered: </span>
                    {items.join(", ")}
                  </p>

                  <div className="mt-3 flex items-center gap-4 flex-wrap">
                    <Stars value={Math.round(avgFlavor)} readOnly size={16} />
                    <span className="text-xs text-muted-foreground">
                      avg {avgFlavor.toFixed(1)}
                    </span>
                    <div className="flex items-center gap-1.5 text-sm ml-auto">
                      <span className="text-xl">
                        {COMFORT_FACES[latestComfort - 1]}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        latest · {COMFORT_LABELS[latestComfort - 1]}
                      </span>
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-border bg-background/40 px-5 py-4 space-y-3">
                    {visits.map((r) => (
                      <div
                        key={r.id}
                        className="rounded-2xl bg-card border border-border p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium">{r.item_ordered}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {new Date(r.created_at).toLocaleDateString(
                                undefined,
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="rounded-full h-8 w-8"
                              onClick={() => onEdit(r)}
                            >
                              <Pencil size={14} />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="rounded-full h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setConfirmDelete(r)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-3 flex-wrap">
                          <Stars value={r.flavor_rating} readOnly size={14} />
                          <div className="flex items-center gap-1 text-xs">
                            <span className="text-base">
                              {COMFORT_FACES[r.comfort_score - 1]}
                            </span>
                            <span className="text-muted-foreground">
                              {COMFORT_LABELS[r.comfort_score - 1]}
                            </span>
                          </div>
                        </div>
                        {r.notes && (
                          <p className="mt-2 text-sm text-foreground/80 italic">
                            "{r.notes}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <ReviewDialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setEditing(null);
        }}
        place={editPlace}
        existing={editing}
      />

      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This bite will be removed from your diary. Can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={doDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
