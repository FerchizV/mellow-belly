import { createFileRoute, Link } from "@tanstack/react-router";
import logo from "@/assets/mellow-belly-logo.jpeg";
import { Mascot } from "@/components/mellow/Mascot";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Welcome · Mellow Belly" },
      {
        name: "description",
        content:
          "Your personalized guide to a happy, dairy-free belly in San Francisco.",
      },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  const { user } = useAuth();
  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "friend";

  return (
    <div className="min-h-screen flex flex-col items-center justify-between px-6 pt-10 pb-32 max-w-md mx-auto text-center">
      <div className="flex flex-col items-center gap-4 w-full">
        <img
          src={logo}
          alt="Mellow Belly"
          className="h-32 w-auto"
        />
        <Mascot className="h-56 w-auto" />
        <p className="text-lg text-foreground/80 max-w-xs leading-snug font-medium">
          Your personalized guide to a happy, dairy-free belly.
        </p>
      </div>

      <div className="w-full flex flex-col gap-3 mt-10">
        <Button asChild size="lg" className="rounded-full h-12 text-base font-semibold shadow-sm">
          <Link to="/discover">Explore the Map</Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="lg"
          className="rounded-full h-12 text-base font-semibold bg-transparent border-primary/40 text-primary hover:bg-primary/10"
        >
          <Link to={user ? "/diary" : "/login"}>
            {user ? "My Diary" : "Sign In / My Diary"}
          </Link>
        </Button>
        {user && (
          <Link
            to="/diary"
            className="text-sm text-muted-foreground underline mt-2"
          >
            Welcome back, {displayName}! Go to Diary.
          </Link>
        )}
      </div>
    </div>
  );
}
