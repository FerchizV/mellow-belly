import { useMemo, useState } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { mascotSrc } from "./Mascot";
import type { Place } from "@/lib/types";

export const PLACE_TYPES = [
  "Café",
  "Fast Food",
  "Boba",
  "Pizza",
  "Ice Cream",
  "Asian",
  "Salad",
  "Healthy Casual",
  "Mediterranean",
] as const;

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  address: z.string().trim().min(3, "Address is required").max(200),
  neighborhood: z.string().trim().min(1, "Pick a neighborhood").max(80),
  type: z.enum(PLACE_TYPES),
  is_totally_vegan: z.boolean(),
});

async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  const q = encodeURIComponent(`${address}, San Francisco, CA`);
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

export function AddPlaceDialog({
  open,
  onOpenChange,
  neighborhoods,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  neighborhoods: string[];
}) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [customNeighborhood, setCustomNeighborhood] = useState("");
  const [type, setType] = useState<(typeof PLACE_TYPES)[number]>("Café");
  const [vegan, setVegan] = useState(false);
  const [saving, setSaving] = useState(false);

  const neighborhoodOptions = useMemo(
    () => [...neighborhoods, "__other__"],
    [neighborhoods],
  );

  const reset = () => {
    setName("");
    setAddress("");
    setNeighborhood("");
    setCustomNeighborhood("");
    setType("Café");
    setVegan(false);
  };

  const submit = async () => {
    const finalNeighborhood =
      neighborhood === "__other__" ? customNeighborhood.trim() : neighborhood;

    const parsed = schema.safeParse({
      name,
      address,
      neighborhood: finalNeighborhood,
      type,
      is_totally_vegan: vegan,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }

    setSaving(true);
    const coords = await geocode(parsed.data.address);
    if (!coords) {
      setSaving(false);
      toast.error(
        "Couldn't find that address on the map. Try adding more detail.",
      );
      return;
    }

    const { data, error } = await supabase
      .from("places")
      .insert({
        name: parsed.data.name,
        address: parsed.data.address,
        neighborhood: parsed.data.neighborhood,
        type: parsed.data.type,
        is_totally_vegan: parsed.data.is_totally_vegan,
        lat: coords.lat,
        lng: coords.lng,
      })
      .select()
      .single();
    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Spot added to the community guide!", {
      icon: <img src={mascotSrc} alt="" className="h-8 w-8 object-contain" />,
    });
    qc.invalidateQueries({ queryKey: ["places"] });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Add a new spot</DialogTitle>
          <DialogDescription>
            Share a dairy-free find with your future self.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Restaurant name</Label>
            <Input
              value={name}
              maxLength={120}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mellow Café"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label>Address</Label>
            <Input
              value={address}
              maxLength={200}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Valencia St"
              className="rounded-xl"
            />
            <p className="text-xs text-muted-foreground">
              Street address in San Francisco — we'll pin it on the map.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Neighborhood</Label>
            <Select value={neighborhood} onValueChange={setNeighborhood}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Pick a neighborhood" />
              </SelectTrigger>
              <SelectContent>
                {neighborhoodOptions.map((n) => (
                  <SelectItem key={n} value={n}>
                    {n === "__other__" ? "Other…" : n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {neighborhood === "__other__" && (
              <Input
                value={customNeighborhood}
                maxLength={80}
                onChange={(e) => setCustomNeighborhood(e.target.value)}
                placeholder="Neighborhood name"
                className="rounded-xl"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label>Food type</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as (typeof PLACE_TYPES)[number])}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLACE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-secondary/60 px-4 py-3">
            <div>
              <Label htmlFor="vegan-toggle" className="cursor-pointer">
                100% Vegan
              </Label>
              <p className="text-xs text-muted-foreground">
                Whole menu is plant-based.
              </p>
            </div>
            <Switch
              id="vegan-toggle"
              checked={vegan}
              onCheckedChange={setVegan}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={saving}
            className="rounded-full"
          >
            {saving ? "Adding..." : "Add spot"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}