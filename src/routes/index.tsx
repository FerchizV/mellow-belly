import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Leaf, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapView } from "@/components/mellow/MapView";
import { PlaceCard } from "@/components/mellow/PlaceCard";
import { ReviewDialog } from "@/components/mellow/ReviewDialog";
import { AddPlaceDialog } from "@/components/mellow/AddPlaceDialog";
import { PlacePreview } from "@/components/mellow/PlacePreview";
import { SplashScreen } from "@/components/mellow/SplashScreen";
import { Button } from "@/components/ui/button";
import type { Place, Review } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Discover · Mellow Belly" },
      {
        name: "description",
        content:
          "All the yum, none of the bloat — find dairy-free spots across San Francisco.",
      },
    ],
  }),
  component: Discover,
});

function Discover() {
  const [q, setQ] = useState("");
  const [neighborhood, setNeighborhood] = useState("all");
  const [type, setType] = useState("all");
  const [veganOnly, setVeganOnly] = useState(false);
  const [picked, setPicked] = useState<Place | null>(null);
  const [open, setOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [neighborhoodOpen, setNeighborhoodOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [splashDone, setSplashDone] = useState(() => {
    if (typeof window === "undefined") return true;
    return sessionStorage.getItem("mellow-splash-shown") === "1";
  });

  const { data: places = [], isSuccess: placesLoaded } = useQuery({
    queryKey: ["places"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("places")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Place[];
    },
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_reviews_feed");
      if (error) throw error;
      return (data ?? []) as Review[];
    },
  });

  const neighborhoods = useMemo(
    () => Array.from(new Set(places.map((p) => p.neighborhood))).sort(),
    [places],
  );
  const types = useMemo(
    () => Array.from(new Set(places.map((p) => p.type))).sort(),
    [places],
  );

  const filtered = useMemo(() => {
    return places.filter((p) => {
      if (veganOnly && !p.is_totally_vegan) return false;
      if (neighborhood !== "all" && p.neighborhood !== neighborhood) return false;
      if (type !== "all" && p.type !== type) return false;
      if (q) {
        const s = q.toLowerCase();
        if (
          !p.name.toLowerCase().includes(s) &&
          !p.neighborhood.toLowerCase().includes(s) &&
          !p.type.toLowerCase().includes(s)
        )
          return false;
      }
      return true;
    });
  }, [places, q, neighborhood, type, veganOnly]);

  const onPick = (p: Place) => {
    setPicked(p);
    setPreviewOpen(true);
  };

  const onLogVisit = (p: Place) => {
    setPicked(p);
    setPreviewOpen(false);
    setOpen(true);
  };

  return (
    <>
      {!splashDone && (
        <SplashScreen
          ready={placesLoaded}
          onDone={() => {
            sessionStorage.setItem("mellow-splash-shown", "1");
            setSplashDone(true);
          }}
        />
      )}
    <div className="mx-auto max-w-2xl px-4 pt-8">
      <header className="mb-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">
              Mellow Belly
            </p>
            <h1 className="text-4xl font-bold mt-1">All the yum,</h1>
            <h1 className="text-4xl font-bold text-primary -mt-1">
              none of the bloat.
            </h1>
            <p className="text-muted-foreground mt-3 text-sm">
              Your dairy-free food guide for San Francisco.
            </p>
          </div>
          <Button
            onClick={() => setAddOpen(true)}
            className="rounded-full shadow-sm shrink-0"
            size="sm"
          >
            <Plus className="mr-1" size={16} /> Add spot
          </Button>
        </div>
      </header>

      {!(open || addOpen || previewOpen || neighborhoodOpen || typeOpen) && (
        <div className="mb-4">
          <MapView places={filtered} onPick={onPick} />
        </div>
      )}

      <div className="space-y-3 sticky top-0 z-30 bg-background/85 backdrop-blur py-3 -mx-4 px-4 border-b border-border/60">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search spots, neighborhoods, food..."
            className="pl-9 rounded-full bg-card"
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Select
            value={neighborhood}
            onValueChange={setNeighborhood}
            open={neighborhoodOpen}
            onOpenChange={setNeighborhoodOpen}
          >
            <SelectTrigger className="rounded-full h-9 w-auto px-4 bg-card">
              <SelectValue placeholder="Neighborhood" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All neighborhoods</SelectItem>
              {neighborhoods.map((n) => (
                <SelectItem key={n} value={n}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={type}
            onValueChange={setType}
            open={typeOpen}
            onOpenChange={setTypeOpen}
          >
            <SelectTrigger className="rounded-full h-9 w-auto px-4 bg-card">
              <SelectValue placeholder="Food type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All food types</SelectItem>
              {types.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 ml-auto rounded-full bg-card border border-border px-3 h-9">
            <Leaf size={14} className="text-vegan-foreground" />
            <Label htmlFor="vegan" className="text-xs cursor-pointer">
              Vegan only
            </Label>
            <Switch id="vegan" checked={veganOnly} onCheckedChange={setVeganOnly} />
          </div>
        </div>
      </div>

      <div className="space-y-3 mt-4">
        <p className="text-xs text-muted-foreground">
          {filtered.length} spot{filtered.length === 1 ? "" : "s"}
        </p>
        {filtered.map((p) => (
          <PlaceCard key={p.id} place={p} reviews={reviews} onAdd={onPick} />
        ))}
        {filtered.length === 0 && (
          <div className="rounded-3xl bg-card p-10 text-center text-muted-foreground">
            No spots match — try loosening your filters.
          </div>
        )}
      </div>

      <ReviewDialog open={open} onOpenChange={setOpen} place={picked} />
      <PlacePreview
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        place={picked}
        reviews={reviews}
        onLogVisit={onLogVisit}
      />
      <AddPlaceDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        neighborhoods={neighborhoods}
      />
    </div>
    </>
  );
}
