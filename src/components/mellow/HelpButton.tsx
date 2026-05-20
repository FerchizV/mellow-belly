import { useEffect, useState } from "react";
import { HelpCircle, X } from "lucide-react";
import { useLocation } from "@tanstack/react-router";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import logo from "@/assets/mellow-belly-logo.jpeg";
import { cn } from "@/lib/utils";

export function HelpButton() {
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const location = useLocation();

  // Hide the floating "?" whenever any Radix dialog/sheet is open so it
  // can't cover the modal's close button.
  useEffect(() => {
    const check = () => {
      const anyOpen = document.querySelectorAll(
        '[role="dialog"][data-state="open"]',
      ).length;
      // Exclude our own help modal from triggering hide (it sits above anyway).
      setDialogOpen(anyOpen > (open ? 1 : 0));
    };
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-state"],
      childList: true,
    });
    return () => obs.disconnect();
  }, [open]);

  if (location.pathname === "/login") return null;

  return (
    <>
      <button
        type="button"
        aria-label="Open help guide"
        onClick={() => setOpen(true)}
        className={cn(
          "fixed right-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-[1200]",
          "flex h-10 w-10 items-center justify-center rounded-full",
          "bg-primary/90 text-primary-foreground shadow-lg backdrop-blur",
          "border border-primary-foreground/20",
          "transition-transform duration-200 ease-out",
          "hover:scale-110 hover:bg-primary active:scale-95",
          "transition-opacity",
          dialogOpen && "pointer-events-none opacity-0",
        )}
      >
        <HelpCircle size={22} strokeWidth={2.25} />
      </button>

      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay
            className="fixed inset-0 z-[1300] bg-foreground/40 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          />
          <DialogPrimitive.Content
            className={cn(
              "fixed left-1/2 top-1/2 z-[1310] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2",
              "max-h-[85vh] overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl",
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            )}
          >
            <DialogPrimitive.Close
              className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Close"
            >
              <X size={18} />
            </DialogPrimitive.Close>

            <div className="flex flex-col items-center text-center">
              <img
                src={logo}
                alt="Mellow Belly logo"
                className="h-20 w-20 rounded-2xl object-cover shadow-md"
              />
              <DialogPrimitive.Title className="mt-3 font-display text-2xl font-bold tracking-tight">
                Welcome to Mellow Belly!
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">
                All the yum, none of the bloat.
              </DialogPrimitive.Description>
            </div>

            <Accordion
              type="single"
              collapsible
              defaultValue="mission"
              className="mt-5"
            >
              <AccordionItem value="mission">
                <AccordionTrigger className="text-left">Our Mission</AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  Mellow Belly isn't just a restaurant finder—it's a community-driven
                  playbook for precision eaters. We believe navigating San Francisco's
                  incredible food scene shouldn't come with the stress of hidden
                  ingredients or digestive discomfort. Whether you are avoiding dairy
                  for severe health reasons or tracking everyday wellness, this is
                  your safe space.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="how">
                <AccordionTrigger className="text-left">How to use Mellow Belly</AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                  <p>
                    <span className="font-semibold text-foreground">📍 Discover:</span>{" "}
                    Explore a map of San Francisco spots with reliable dairy-free
                    options. Click any card to check out community logs and your menu
                    item history.
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">🌮 Add a Bite:</span>{" "}
                    Pre-fill a location instantly from the map or list view to record
                    your latest meal. Log the exact menu item you ordered to build
                    your personal playbook.
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">🔒 Public vs. Private:</span>{" "}
                    By default, your specific ordered items and scores are shared to
                    help the collective community grow. Your deep personal notes stay
                    private unless you choose to share your tips!
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="scores">
                <AccordionTrigger className="text-left">The Scores Decoded</AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                  <div>
                    <p className="font-semibold text-foreground">
                      ⭐ Mellow Belly Rating
                    </p>
                    <p>
                      How delicious was the item? (Standard culinary flavor rating
                      out of 5 stars.)
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      🤢 ➔ 🤩 Digestive Comfort Score
                    </p>
                    <p>Tracks how your system physically felt after the meal:</p>
                    <ul className="mt-1 space-y-1 pl-1">
                      <li>
                        <span className="font-medium">🤩</span> = Completely safe,
                        clean label, zero gut issues.
                      </li>
                      <li>
                        <span className="font-medium">😐</span> = Heavy or greasy,
                        proceed with caution.
                      </li>
                      <li>
                        <span className="font-medium">🤢</span> = Hidden dairy
                        warning or intense bloating.
                      </li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
