import { ExternalLink, MapPin, Leaf } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import type { Place, Review } from "@/lib/types";
import { COMFORT_FACES } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export function PlacePreview({
  open,
  onOpenChange,
  place,
  reviews,
  onLogVisit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  place: Place | null;
  reviews: Review[];
  onLogVisit: (p: Place) => void;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const placeReviews = useMemo(
    () => (place ? reviews.filter((r) => r.place_id === place.id) : []),
    [reviews, place],
  );

  const userIds = useMemo(
    () => Array.from(new Set(placeReviews.map((r) => r.user_id).filter(Boolean) as string[])),
    [placeReviews],
  );

  const { data: profileMap = {} } = useQuery({
    queryKey: ["profiles", userIds.sort().join(",")],
    enabled: userIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", userIds);
      if (error) throw error;
      return Object.fromEntries(
        (data ?? []).map((p) => [p.id, p.display_name]),
      ) as Record<string, string>;
    },
  });

  if (!place) return null;

  const mine = user ? placeReviews.filter((r) => r.user_id === user.id) : [];
  const others = user
    ? placeReviews.filter((r) => r.user_id !== user.id)
    : placeReviews;

  const avgFlavor =
    mine.reduce((s, r) => s + r.flavor_rating, 0) / (mine.length || 1);
  const avgComfort =
    mine.reduce((s, r) => s + r.comfort_score, 0) / (mine.length || 1);
  const commAvgFlavor =
    others.reduce((s, r) => s + r.flavor_rating, 0) / (others.length || 1);
  const commAvgComfort =
    others.reduce((s, r) => s + r.comfort_score, 0) / (others.length || 1);

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${place.name} ${place.address}`,
  )}`;

  const nameFor = (uid: string | null) =>
    !uid ? "Anonymous" : (profileMap[uid] ?? "A neighbor");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl max-h-[85vh] p-0 flex flex-col"
      >
        <div className="flex-1 overflow-y-auto px-6 pt-6 pb-6">
        <SheetHeader className="text-left space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            {place.is_totally_vegan && (
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-vegan/30 text-vegan-foreground">
                <Leaf size={10} /> 100% Vegan
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {place.neighborhood} · {place.type}
            </span>
          </div>
          <SheetTitle className="text-3xl font-bold leading-tight">
            {place.name}
          </SheetTitle>
          <SheetDescription asChild>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-primary hover:underline text-sm"
            >
              <MapPin size={14} />
              {place.address}
              <ExternalLink size={12} />
            </a>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-card border border-border p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Your Score
            </p>
            {mine.length > 0 ? (
              <p className="text-3xl font-bold mt-1">
                <span className="text-primary">★</span> {avgFlavor.toFixed(1)}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground mt-2">No score yet</p>
            )}
          </div>
          <div className="rounded-2xl bg-card border border-border p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Your Comfort
            </p>
            {mine.length > 0 ? (
              <p className="text-3xl font-bold mt-1 flex items-center gap-2">
                <span>{COMFORT_FACES[Math.round(avgComfort) - 1]}</span>
                <span className="text-2xl">{avgComfort.toFixed(1)}</span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground mt-2">No score yet</p>
            )}
          </div>
        </div>

        <div className="mt-5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
            Your history
          </p>
          {mine.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              No visits yet — your belly is curious.
            </p>
          ) : (
            <>
            <p className="text-sm text-foreground/80 mb-3">
              <span className="text-muted-foreground">Ordered: </span>
              {Array.from(new Set(mine.map((r) => r.item_ordered))).join(", ")}
            </p>
            <ul className="space-y-1.5">
              {mine.slice(0, 6).map((r) => (
                <li
                  key={r.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <span>{COMFORT_FACES[r.comfort_score - 1]}</span>
                  <span className="font-medium truncate">{r.item_ordered}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(r.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto shrink-0">
                    ★ {r.flavor_rating}
                  </span>
                </li>
              ))}
              {mine.length > 6 && (
                <li className="text-xs text-muted-foreground">
                  +{mine.length - 6} more
                </li>
              )}
            </ul>
            </>
          )}
        </div>

        <div className="mt-6 rounded-2xl bg-secondary/40 border border-border p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
            Community Rating
          </p>
          {others.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              No community reviews yet — be the first.
            </p>
          ) : (
            <div className="flex items-center gap-6">
              <div>
                <p className="text-2xl font-bold">
                  <span className="text-primary">★</span>{" "}
                  {commAvgFlavor.toFixed(1)}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Avg flavor
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold flex items-center gap-2">
                  <span>{COMFORT_FACES[Math.round(commAvgComfort) - 1]}</span>
                  <span className="text-xl">{commAvgComfort.toFixed(1)}</span>
                </p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Avg comfort
                </p>
              </div>
              <p className="ml-auto text-xs text-muted-foreground">
                {others.length} review{others.length === 1 ? "" : "s"}
              </p>
            </div>
          )}
        </div>

        {others.length > 0 && (
          <div className="mt-5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
              What others are saying
            </p>
            <ul className="space-y-2">
              {others.slice(0, 6).map((r) => (
                <li key={r.id} className="text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-base">
                      {COMFORT_FACES[r.comfort_score - 1]}
                    </span>
                    <span className="font-medium truncate">
                      <span className="text-muted-foreground">
                        {nameFor(r.user_id)} tried:
                      </span>{" "}
                      {r.item_ordered}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground shrink-0">
                      ★ {r.flavor_rating}
                    </span>
                  </div>
                  {r.notes && (
                    <p className="text-xs text-foreground/70 italic mt-0.5 ml-7">
                      "{r.notes}"
                    </p>
                  )}
                </li>
              ))}
              {others.length > 6 && (
                <li className="text-xs text-muted-foreground">
                  +{others.length - 6} more
                </li>
              )}
            </ul>
          </div>
        )}
        </div>

        <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t border-border px-6 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <Button
          onClick={() => {
            if (!user) {
              toast("Sign in to start your Mellow Belly diary!");
              navigate({ to: "/login" });
              return;
            }
            onLogVisit(place);
          }}
          className="w-full h-14 text-base font-bold rounded-2xl bg-primary text-primary-foreground shadow-[0_6px_0_color-mix(in_oklab,var(--primary)_55%,black)] hover:bg-primary/95 hover:-translate-y-0.5 hover:shadow-[0_8px_0_color-mix(in_oklab,var(--primary)_55%,black)] active:translate-y-1 active:shadow-[0_2px_0_color-mix(in_oklab,var(--primary)_55%,black)] transition-all duration-150"
          size="lg"
        >
          🍴 Add a Bite
        </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}