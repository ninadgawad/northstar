import { useEffect, useState } from "react";
import { CheckCircle2, CircleDashed, Clock, ExternalLink, NotebookPen, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import StatusBadge from "@/components/StatusBadge";
import { cn } from "@/lib/utils";
import type { Course, CourseStatus } from "@/types";
import { formatDate } from "@/utils";

const STATUS_OPTIONS: { status: CourseStatus; icon: typeof CheckCircle2 }[] = [
  { status: "Not Started", icon: CircleDashed },
  { status: "In Progress", icon: Clock },
  { status: "Completed", icon: CheckCircle2 },
];

interface TaskDrawerProps {
  course: Course | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (courseId: number, status: CourseStatus) => void;
  onProgressChange: (courseId: number, progress: number) => void;
  onSaveNote: (courseId: number, note: string) => void;
}

export default function TaskDrawer({
  course,
  open,
  onOpenChange,
  onStatusChange,
  onProgressChange,
  onSaveNote,
}: TaskDrawerProps): JSX.Element {
  const [draftNote, setDraftNote] = useState(course?.userNote ?? "");
  const [justSaved, setJustSaved] = useState(false);
  const [draftProgress, setDraftProgress] = useState(course?.progress ?? 0);

  useEffect(() => {
    setDraftNote(course?.userNote ?? "");
    setJustSaved(false);
  }, [course?.id, course?.userNote]);

  useEffect(() => {
    setDraftProgress(course?.progress ?? 0);
  }, [course?.id, course?.progress]);

  if (!course) {
    return <></>;
  }

  const isDirty = draftNote !== course.userNote;

  const handleSave = (): void => {
    onSaveNote(course.id, draftNote);
    setJustSaved(true);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="p-0">
        <SheetHeader>
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {course.category}
          </span>
          <SheetTitle>{course.name}</SheetTitle>
          <SheetDescription>{course.platform}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Status
            </h3>
            <div className="mb-3">
              <StatusBadge status={course.status} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {STATUS_OPTIONS.map(({ status, icon: Icon }) => {
                const isActive = course.status === status;
                return (
                  <Button
                    key={status}
                    type="button"
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    className={cn("flex-col gap-1 h-auto py-2.5", isActive && "pointer-events-none")}
                    onClick={() => onStatusChange(course.id, status)}
                  >
                    <Icon className="size-4" />
                    <span className="text-[11px] font-medium leading-none">{status}</span>
                  </Button>
                );
              })}
            </div>
          </section>

          <section className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Progress
              </h3>
              <span className="text-sm font-semibold tabular-nums">{draftProgress}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={draftProgress}
              onChange={(e) => setDraftProgress(Number(e.target.value))}
              onMouseUp={(e) => onProgressChange(course.id, Number(e.currentTarget.value))}
              onTouchEnd={(e) => onProgressChange(course.id, Number(e.currentTarget.value))}
              onKeyUp={(e) => onProgressChange(course.id, Number(e.currentTarget.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
              aria-label="Progress percentage"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Reaches 100% on Completed and 0% on Not Started automatically.
            </p>
          </section>

          <section className="mt-6 grid grid-cols-2 gap-4 rounded-lg border border-border bg-secondary/40 p-4">
            <div>
              <div className="text-xs text-muted-foreground">Last completed</div>
              <div className="mt-0.5 text-sm font-medium">{formatDate(course.lastCompleted)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Time to complete</div>
              <div className="mt-0.5 text-sm font-medium">{course.timeToComplete}</div>
            </div>
          </section>

          <section className="mt-6">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              About
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{course.notes}</p>
          </section>

          <section className="mt-6">
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <NotebookPen className="size-3.5" />
              My notes
            </h3>
            <Textarea
              value={draftNote}
              onChange={(e) => {
                setDraftNote(e.target.value);
                setJustSaved(false);
              }}
              placeholder="Jot down thoughts, follow-ups, or takeaways…"
              rows={5}
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {justSaved ? "Saved" : isDirty ? "Unsaved changes" : ""}
              </span>
              <Button type="button" size="sm" onClick={handleSave} disabled={!isDirty}>
                <Save className="size-3.5" />
                Save note
              </Button>
            </div>
          </section>
        </div>

        <SheetFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button asChild size="sm">
            <a href={course.link} target="_blank" rel="noopener noreferrer">
              Open source
              <ExternalLink className="size-3.5" />
            </a>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
