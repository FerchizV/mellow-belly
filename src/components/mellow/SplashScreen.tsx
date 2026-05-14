import { useEffect, useState } from "react";
import logo from "@/assets/mellow-belly-logo.jpeg";

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
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-500 ${
        fadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{ backgroundColor: "#FFF9F5" }}
      aria-hidden={fadingOut}
    >
      <img
        src={logo}
        alt="Mellow Belly"
        className="w-64 max-w-[70vw] h-auto object-contain animate-squish"
      />
    </div>
  );
}
