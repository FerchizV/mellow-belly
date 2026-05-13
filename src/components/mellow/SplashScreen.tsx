import { useEffect, useState } from "react";
import { Leaf } from "lucide-react";

interface SplashScreenProps {
  ready: boolean;
  onDone: () => void;
}

export function SplashScreen({ ready, onDone }: SplashScreenProps) {
  const [fadingOut, setFadingOut] = useState(false);
  const [shownAt] = useState(() => Date.now());

  useEffect(() => {
    if (!ready) return;
    // Ensure splash is visible for at least 600ms for branding feel
    const elapsed = Date.now() - shownAt;
    const wait = Math.max(0, 600 - elapsed);
    const t1 = setTimeout(() => setFadingOut(true), wait);
    const t2 = setTimeout(() => onDone(), wait + 600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [ready, shownAt, onDone]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-primary/15 via-background to-accent/20 transition-opacity duration-500 ${
        fadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      aria-hidden={fadingOut}
    >
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
          <Leaf className="h-8 w-8" />
        </div>
        <h1 className="font-[Fraunces,serif] text-4xl font-bold tracking-tight text-foreground">
          Mellow Belly
        </h1>
        <p className="text-sm text-muted-foreground">
          All the yum, none of the bloat.
        </p>
      </div>
    </div>
  );
}
