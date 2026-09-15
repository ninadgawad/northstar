import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Recap } from "@/lib/recap";

interface WeeklyRecapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recap: Recap;
}

export default function WeeklyRecapDialog({
  open,
  onOpenChange,
  recap,
}: WeeklyRecapDialogProps): JSX.Element {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{recap.title}</DialogTitle>
          <DialogDescription>
            {recap.empty ? "Last week at a glance." : "Here's what you got done last week."}
          </DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-2 text-sm text-foreground">
          {recap.lines.map((line, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-muted-foreground">•</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
        <DialogFooter>
          <Button size="sm" onClick={() => onOpenChange(false)}>
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
