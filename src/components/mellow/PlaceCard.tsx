import { Sparkles, Leaf, MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Place, Review } from "@/lib/types";
import { COMFORT_FACES } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";

export function PlaceCard({
  place,
  reviews,
  onAdd,
}: {
  place: Place;
  reviews: Review[];
  onAdd: (p: Place) => void;
}) {
  const { user } = useAuth();
  const here = reviews.filter((r) => r.place_id === place.id);
  const mine = user ? here.filter((r) => r.user_id === user.id) : [];
  const others = user ? here.filter((r) => r.user_id !== user.id) : here;
  const visited = mine.length > 0;
  const avgFlavor =
    mine.reduce((s, r) => s + r.flavor_rating, 0) / (mine.length || 1);
  const avgComfort =
    mine.reduce((s, r) => s + r.comfort_score, 0) / (mine.length || 1);
  const commFlavor =
    others.reduce((s, r) => s + r.flavor_rating, 0) / (others.length || 1);

  return (
    <div className="group rounded-3xl bg-card border border-border p-5 transition-all hover:shadow-lg hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-semibold truncate">{place.name}</h3>
            {place.is_totally_vegan && (
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-vegan/30 text-vegan-foreground">
                <Leaf size={10} /> 100% Vegan
              </span>
            )}
            {!visited && (
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-warm text-foreground">
                <Sparkles size={10} /> New
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
            <MapPin size={12} /> {place.neighborhood} · {place.type}
          </p>
          <p className="text-xs text-muted-foreground/80 mt-0.5">{place.address}</p>
        </div>
        <Button
          size="icon"
          onClick={() => onAdd(place)}
          className="rounded-full shrink-0 shadow-sm"
          aria-label="Log a bite"
        >
          <Plus />
        </Button>
      </div>

      <div className="mt-4 flex items-center gap-4 text-sm">
        {visited ? (
          <>
            <div className="flex items-center gap-1">
              <span className="text-primary">★</span>
              <span className="font-medium">{avgFlavor.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">yours</span>
            </div>
            <div className="flex items-center gap-1">
              <span>{COMFORT_FACES[Math.round(avgComfort) - 1]}</span>
              <span className="font-medium">{avgComfort.toFixed(1)}</span>
            </div>
            {others.length > 0 && (
              <div className="flex items-center gap-1 ml-auto">
                <span className="text-primary">★</span>
                <span className="font-medium">{commFlavor.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">
                  community ({others.length})
                </span>
              </div>
            )}
          </>
        ) : others.length > 0 ? (
          <div className="flex items-center gap-1">
            <span className="text-primary">★</span>
            <span className="font-medium">{commFlavor.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">
              community ({others.length})
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">No reviews yet</span>
        )}
      </div>
    </div>
  );
}