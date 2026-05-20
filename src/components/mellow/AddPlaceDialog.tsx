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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Mascot, mascotSrc } from "./Mascot";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Place } from "@/lib/types";

export const DEFAULT_PLACE_TYPES = [
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
  type: z.string().trim().min(2, "Pick a food type").max(60),
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
  const [neighborhoodOpen, setNeighborhoodOpen] = useState(false);
  const [neighborhoodQuery, setNeighborhoodQuery] = useState("");
  const [type, setType] = useState<string>("Café");
  const [typeOpen, setTypeOpen] = useState(false);
  const [typeQuery, setTypeQuery] = useState("");
  const [vegan, setVegan] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: existingTypes = [] } = useQuery({
    queryKey: ["place-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("places")
        .select("type")
        .limit(1000);
      if (error) throw error;
      return Array.from(
        new Set((data ?? []).map((r) => (r.type ?? "").trim()).filter(Boolean)),
      );
    },
  });

  const allTypes = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of [...DEFAULT_PLACE_TYPES, ...existingTypes]) {
      const key = t.toLowerCase();
      if (!map.has(key)) map.set(key, t);
    }
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  }, [existingTypes]);

  const trimmedQuery = typeQuery.trim();
  const queryLower = trimmedQuery.toLowerCase();
  const existingMatch = allTypes.find((t) => t.toLowerCase() === queryLower);
  const showCreate = trimmedQuery.length >= 2 && !existingMatch;

  const { data: dbNeighborhoods = [] } = useQuery({
    queryKey: ["neighborhoods"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("places")
        .select("neighborhood")
        .limit(1000);
      if (error) throw error;
      return Array.from(
        new Set(
          (data ?? [])
            .map((r) => (r.neighborhood ?? "").trim())
            .filter(Boolean),
        ),
      );
    },
  });

  const allNeighborhoods = useMemo(() => {
    const map = new Map<string, string>();
    for (const n of [...neighborhoods, ...dbNeighborhoods]) {
      const key = n.toLowerCase();
      if (!map.has(key)) map.set(key, n);
    }
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  }, [neighborhoods, dbNeighborhoods]);

  const trimmedNbhd = neighborhoodQuery.trim();
  const nbhdLower = trimmedNbhd.toLowerCase();
  const nbhdMatch = allNeighborhoods.find((n) => n.toLowerCase() === nbhdLower);
  const showCreateNbhd = trimmedNbhd.length >= 2 && !nbhdMatch;

  const reset = () => {
    setName("");
    setAddress("");
    setNeighborhood("");
    setNeighborhoodQuery("");
    setType("Café");
    setTypeQuery("");
    setVegan(false);
  };

  const submit = async () => {
    // Case-insensitive dedupe: reuse existing canonical name if it matches.
    const typedNbhd = neighborhood.trim();
    const canonical = allNeighborhoods.find(
      (n) => n.toLowerCase() === typedNbhd.toLowerCase(),
    );
    const finalNeighborhood = canonical ?? typedNbhd;

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
    qc.invalidateQueries({ queryKey: ["place-types"] });
    qc.invalidateQueries({ queryKey: ["neighborhoods"] });
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
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <Popover open={neighborhoodOpen} onOpenChange={setNeighborhoodOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={neighborhoodOpen}
                      className="w-full justify-between rounded-xl font-normal"
                    >
                      {neighborhood || "Pick or add a neighborhood"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="p-0 w-[--radix-popover-trigger-width]"
                    align="start"
                    onWheel={(e) => e.stopPropagation()}
                    onTouchMove={(e) => e.stopPropagation()}
                  >
                    <Command
                      filter={(value, search) =>
                        value.toLowerCase().includes(search.toLowerCase())
                          ? 1
                          : 0
                      }
                    >
                      <CommandInput
                        placeholder="Search or add a neighborhood..."
                        value={neighborhoodQuery}
                        onValueChange={setNeighborhoodQuery}
                        maxLength={80}
                      />
                      <CommandList className="max-h-[260px] overflow-y-auto overscroll-contain">
                        <CommandEmpty>
                          {trimmedNbhd
                            ? "No matches — type to add a new one."
                            : "Start typing..."}
                        </CommandEmpty>
                        <CommandGroup>
                          {allNeighborhoods.map((n) => (
                            <CommandItem
                              key={n}
                              value={n}
                              onSelect={() => {
                                setNeighborhood(n);
                                setNeighborhoodQuery("");
                                setNeighborhoodOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  neighborhood.toLowerCase() === n.toLowerCase()
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              {n}
                            </CommandItem>
                          ))}
                          {showCreateNbhd && (
                            <CommandItem
                              value={`__add__${trimmedNbhd}`}
                              onSelect={() => {
                                setNeighborhood(trimmedNbhd);
                                setNeighborhoodQuery("");
                                setNeighborhoodOpen(false);
                                toast.success(
                                  `Added "${trimmedNbhd}" — it'll be saved with your spot.`,
                                );
                              }}
                              className="text-primary"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Add "{trimmedNbhd}"
                            </CommandItem>
                          )}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="relative shrink-0 hidden sm:block">
                <div className="absolute -top-2 right-full mr-2 w-44 rounded-2xl rounded-br-sm bg-secondary px-3 py-2 text-xs text-secondary-foreground shadow-sm">
                  Which SF block is this on?
                </div>
                <Mascot className="h-14 w-14" />
              </div>
            </div>
            <div className="flex items-start gap-2 sm:hidden">
              <Mascot className="h-10 w-10 shrink-0" />
              <p className="rounded-2xl bg-secondary px-3 py-2 text-xs text-secondary-foreground">
                Which SF block is this on?
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Food type</Label>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <Popover open={typeOpen} onOpenChange={setTypeOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={typeOpen}
                      className="w-full justify-between rounded-xl font-normal"
                    >
                      {type || "Pick or add a food type"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="p-0 w-[--radix-popover-trigger-width]"
                    align="start"
                    onWheel={(e) => e.stopPropagation()}
                    onTouchMove={(e) => e.stopPropagation()}
                  >
                    <Command
                      filter={(value, search) =>
                        value.toLowerCase().includes(search.toLowerCase())
                          ? 1
                          : 0
                      }
                    >
                      <CommandInput
                        placeholder="Search or add a type..."
                        value={typeQuery}
                        onValueChange={setTypeQuery}
                        maxLength={60}
                      />
                      <CommandList className="max-h-[260px] overflow-y-auto overscroll-contain">
                        <CommandEmpty>
                          {trimmedQuery
                            ? "No matches — type to add a new one."
                            : "Start typing..."}
                        </CommandEmpty>
                        <CommandGroup>
                          {allTypes.map((t) => (
                            <CommandItem
                              key={t}
                              value={t}
                              onSelect={() => {
                                setType(t);
                                setTypeQuery("");
                                setTypeOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  type.toLowerCase() === t.toLowerCase()
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              {t}
                            </CommandItem>
                          ))}
                          {showCreate && (
                            <CommandItem
                              value={`__add__${trimmedQuery}`}
                              onSelect={() => {
                                setType(trimmedQuery);
                                setTypeQuery("");
                                setTypeOpen(false);
                                toast.success(
                                  `Added "${trimmedQuery}" — it'll be saved with your spot.`,
                                );
                              }}
                              className="text-primary"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Add "{trimmedQuery}"
                            </CommandItem>
                          )}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="relative shrink-0 hidden sm:block">
                <div className="absolute -top-2 right-full mr-2 w-44 rounded-2xl rounded-br-sm bg-secondary px-3 py-2 text-xs text-secondary-foreground shadow-sm">
                  Oh, something new? Tell me what kind of food this is!
                </div>
                <Mascot className="h-14 w-14" />
              </div>
            </div>
            <div className="flex items-start gap-2 sm:hidden">
              <Mascot className="h-10 w-10 shrink-0" />
              <p className="rounded-2xl bg-secondary px-3 py-2 text-xs text-secondary-foreground">
                Oh, something new? Tell me what kind of food this is!
              </p>
            </div>
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