import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Stars, ComfortPicker } from "./Stars";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Place, Review } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";

export function ReviewDialog({
  open,
  onOpenChange,
  place,
  existing,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  place: Place | null;
  existing?: Review | null;
}) {
  const qc = useQueryClient();
  const [item, setItem] = useState("");
  const [flavor, setFlavor] = useState(4);
  const [comfort, setComfort] = useState(4);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setItem(existing?.item_ordered ?? "");
      setFlavor(existing?.flavor_rating ?? 4);
      setComfort(existing?.comfort_score ?? 4);
      setNotes(existing?.notes ?? "");
    }
  }, [open, existing]);

  if (!place) return null;

  const save = async () => {
    if (!item.trim()) {
      toast.error("What did you order?");
      return;
    }
    setSaving(true);
    const payload = {
      place_id: place.id,
      item_ordered: item.trim(),
      flavor_rating: flavor,
      comfort_score: comfort,
      notes: notes.trim() || null,
    };
    const res = existing
      ? await supabase.from("reviews").update(payload).eq("id", existing.id)
      : await supabase.from("reviews").insert(payload);
    setSaving(false);
    if (res.error) {
      toast.error(res.error.message);
      return;
    }
    toast.success(existing ? "Diary entry updated" : "Added to your diary");
    qc.invalidateQueries({ queryKey: ["reviews"] });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {existing ? "Edit entry" : "Log a bite"}
          </DialogTitle>
          <DialogDescription>
            {place.name} · {place.neighborhood}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>What did you order?</Label>
            <Input
              value={item}
              onChange={(e) => setItem(e.target.value)}
              placeholder="Coconut latte, almond pizza..."
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label>Flavor</Label>
            <Stars value={flavor} onChange={setFlavor} size={26} />
          </div>
          <div className="space-y-2">
            <Label>Belly comfort</Label>
            <ComfortPicker value={comfort} onChange={setComfort} />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Soft serve was dreamy. Asked for oat milk."
              className="rounded-xl"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving} className="rounded-full">
            {saving ? "Saving..." : existing ? "Save changes" : "Save bite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}