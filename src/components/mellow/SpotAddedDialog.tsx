import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mascot } from "./Mascot";
import type { Place } from "@/lib/types";

export function SpotAddedDialog({
  open,
  onOpenChange,
  place,
  onAddBite,
  onViewMap,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  place: Place | null;
  onAddBite: () => void;
  onViewMap: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-sm">
        <DialogHeader className="items-center text-center">
          <Mascot className="h-24 w-auto mx-auto -mb-2" />
          <DialogTitle className="text-2xl text-center">
            Spot Added Successfully!
          </DialogTitle>
          <DialogDescription className="text-center">
            {place ? (
              <>
                <span className="font-medium text-foreground">{place.name}</span>{" "}
                is now on the map in {place.neighborhood}.
                <br />
              </>
            ) : null}
            Would you like to log a bite for this place right now?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-col gap-2 sm:space-x-0">
          <Button onClick={onAddBite} className="rounded-full w-full">
            Yes, Add a Bite
          </Button>
          <Button
            onClick={onViewMap}
            variant="outline"
            className="rounded-full w-full"
          >
            No, just view map
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}