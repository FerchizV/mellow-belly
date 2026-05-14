import { Link, useLocation } from "@tanstack/react-router";
import { Compass, BookHeart, User as UserIcon, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

export function BottomNav() {
  const { user } = useAuth();
  const location = useLocation();
  if (location.pathname === "/login") return null;

  const items = [
    { to: "/discover", label: "Discover", icon: Compass },
    { to: "/diary", label: "Diary", icon: BookHeart },
    user
      ? { to: "/profile", label: "Profile", icon: UserIcon }
      : { to: "/login", label: "Sign in", icon: LogIn },
  ] as const;
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/90 backdrop-blur-lg pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-2xl grid grid-cols-3">
        {items.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: true }}
            className="flex flex-col items-center gap-0.5 py-3 text-muted-foreground data-[status=active]:text-primary transition-colors"
          >
            {({ isActive }) => (
              <>
                <div
                  className={cn(
                    "p-2 rounded-full transition-all",
                    isActive && "bg-secondary scale-110",
                  )}
                >
                  <Icon size={20} />
                </div>
                <span className="text-xs font-medium">{label}</span>
              </>
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
}