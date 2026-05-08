import { useEffect, useState } from "react";
import type { Place } from "@/lib/types";

export function MapView({
  places,
  onPick,
}: {
  places: Place[];
  onPick: (p: Place) => void;
}) {
  const [mod, setMod] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([import("react-leaflet"), import("leaflet")]).then(
      ([rl, L]) => {
        if (mounted) setMod({ rl, L: L.default ?? L });
      },
    );
    return () => {
      mounted = false;
    };
  }, []);

  if (!mod) {
    return (
      <div className="h-[55vh] rounded-3xl bg-secondary/60 animate-pulse" />
    );
  }

  const { MapContainer, TileLayer, Marker, Popup } = mod.rl;
  const L = mod.L;

  return (
    <div className="h-[55vh] rounded-3xl overflow-hidden border border-border shadow-sm">
      <MapContainer
        center={[37.7749, -122.4294]}
        zoom={12.5}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {places.map((p) => {
          const icon = L.divIcon({
            className: "",
            html: `<div class="belly-pin${p.is_totally_vegan ? " vegan" : ""}"></div>`,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          });
          return (
            <Marker
              key={p.id}
              position={[p.lat, p.lng]}
              icon={icon}
              eventHandlers={{ click: () => onPick(p) }}
            >
              <Popup>
                <div className="font-semibold">{p.name}</div>
                <div className="text-xs opacity-70">{p.neighborhood}</div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}