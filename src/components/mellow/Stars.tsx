import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stars({
  value,
  onChange,
  size = 18,
  readOnly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  readOnly?: boolean;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(n)}
          className={cn(
            "transition-transform",
            !readOnly && "hover:scale-125 cursor-pointer",
          )}
          aria-label={`${n} stars`}
        >
          <Star
            size={size}
            className={cn(
              "transition-colors",
              n <= value ? "fill-primary text-primary" : "text-muted-foreground/40",
            )}
          />
        </button>
      ))}
    </div>
  );
}

import { COMFORT_FACES, COMFORT_LABELS } from "@/lib/types";

export function ComfortPicker({
  value,
  onChange,
  readOnly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {COMFORT_FACES.map((face, i) => {
        const n = i + 1;
        const active = n === value;
        return (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(n)}
            title={COMFORT_LABELS[i]}
            className={cn(
              "h-10 w-10 rounded-full text-xl transition-all flex items-center justify-center",
              active
                ? "bg-accent scale-110 ring-2 ring-accent-foreground/20"
                : "bg-muted opacity-50 hover:opacity-100",
              !readOnly && "cursor-pointer hover:scale-110",
            )}
          >
            {face}
          </button>
        );
      })}
    </div>
  );
}