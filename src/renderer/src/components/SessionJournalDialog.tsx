import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { bumpProgress } from "@/lib/journal";
import type { Course } from "@/types";

const BUMPS = [5, 10, 25] as const;
type Bump = 0 | 5 | 10 | 25 | "complete";

interface SessionJournalDialogProps {
  open: boolean;
  course: Course;
  minutes: number;
  endedAt: number;
  onSave: (result: { text: string; progress: number | null }) => Promise<void>;
  onSkip: () => void;
}

export default function SessionJournalDialog({
  open,
  course,
  minutes,
  onSave,
  onSkip,
}: SessionJournalDialogProps): JSX.Element {
  const [text, setText] = useState("");
  const [bump, setBump] = useState<Bump>(0);
  const [saving, setSaving] = useState(false);

  const fromProgress = course.progress;
  const toProgress = bump === 0 ? fromProgress : bumpProgress(fromProgress, bump);
  const canSave = text.trim().length > 0 || bump !== 0;

  const handleSave = async (): Promise<void> => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await onSave({
        text: text.trim(),
        progress: bump === 0 ? null : toProgress,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenChange = (next: boolean): void => {
    if (!next) onSkip();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Session complete: {course.name}</DialogTitle>
          <DialogDescription>
            You focused for {minutes} minute{minutes === 1 ? "" : "s"}. Log what you got done.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <Input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleSave();
            }}
            placeholder="What did you get done?"
          />

          <div className="flex flex-wrap gap-2">
            {BUMPS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setBump((b) => (b === n ? 0 : n))}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                  bump === n
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:bg-accent"
                )}
              >
                +{n}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setBump((b) => (b === "complete" ? 0 : "complete"))}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                bump === "complete"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-accent"
              )}
            >
              Mark completed
            </button>
          </div>

          {bump !== 0 && (
            <p className="text-xs text-muted-foreground">
              {fromProgress}% <span aria-hidden>→</span> {toProgress}%
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onSkip} disabled={saving}>
            Skip
          </Button>
          <Button onClick={() => void handleSave()} disabled={!canSave || saving}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
