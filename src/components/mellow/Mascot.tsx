import mascot from "@/assets/mellow-belly-guy.png";
import { cn } from "@/lib/utils";

export function Mascot({
  className,
  alt = "Mellow Belly mascot",
}: {
  className?: string;
  alt?: string;
}) {
  return (
    <img
      src={mascot}
      alt={alt}
      className={cn("block select-none mix-blend-multiply", className)}
      draggable={false}
    />
  );
}

export const mascotSrc = mascot;
