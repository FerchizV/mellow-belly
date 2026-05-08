import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, BookHeart } from "lucide-react";
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
  const [editing, setEditing] = useState<Review | null>(null);
  const [editPlace, setEditPlace] = useState<Place | null>(null);
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Review | null>(null);

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
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
      qc.invalidateQueries({ queryKey: ["reviews"] });
    }
    setConfirmDelete(null);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 pt-8">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">
          My Diary
        </p>
        <h1 className="text-4xl font-bold mt-1">Every bite, remembered.</h1>
        <p className="text-muted-foreground mt-3 text-sm">
          {reviews.length} entr{reviews.length === 1 ? "y" : "ies"}
        </p>
      </header>

      {reviews.length === 0 ? (
        <div className="rounded-3xl bg-card border border-border p-12 text-center">
          <BookHeart className="mx-auto mb-3 text-primary" size={36} />
          <p className="font-medium">No bites yet.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Head to Discover and tap the + on a spot to start logging.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => {
            const place = placeMap[r.place_id];
            return (
              <article
                key={r.id}
                className="rounded-3xl bg-card border border-border p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-lg">
                      {r.item_ordered}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {place?.name ?? "Unknown spot"}
                      {place && ` · ${place.neighborhood}`}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="rounded-full"
                      onClick={() => onEdit(r)}
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="rounded-full text-destructive hover:text-destructive"
                      onClick={() => setConfirmDelete(r)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-4 flex-wrap">
                  <Stars value={r.flavor_rating} readOnly size={16} />
                  <div className="flex items-center gap-1.5 text-sm">
                    <span className="text-xl">
                      {COMFORT_FACES[r.comfort_score - 1]}
                    </span>
                    <span className="text-muted-foreground">
                      {COMFORT_LABELS[r.comfort_score - 1]}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(r.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {r.notes && (
                  <p className="mt-3 text-sm text-foreground/80 italic">
                    "{r.notes}"
                  </p>
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
