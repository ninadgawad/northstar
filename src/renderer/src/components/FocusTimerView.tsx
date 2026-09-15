import { useMemo, useState } from "react";
import { PartyPopper, Play, Timer as TimerIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import StatusBadge from "@/components/StatusBadge";
import { cn } from "@/lib/utils";
import { formatRelativeDays } from "@/lib/dates";
import type { NextUpItem } from "@/lib/nextUp";
import type { Course, Goal } from "@/types";
import { formatCountdown } from "@/utils";

const DURATIONS = [15, 30, 45, 60] as const;

export type FocusPhase = "idle" | "running" | "journal" | "done";

export interface BeginFocusInput {
  courseId: number | null;
  task: string;
}

interface FocusTimerViewProps {
  goals: Goal[];
  courses: Course[];
  phase: FocusPhase;
  remainingMs: number;
  totalMs: number;
  /** Bound course id, or null when focusing on free text. */
  courseId: number | null;
  /** Display name: the bound course's name, or the free-text task. */
  taskText: string;
  /** Ranked "what to work on" suggestions for the idle view. */
  nextUp: NextUpItem[];
  now: number;
  message: string;
  onBegin: (input: BeginFocusInput, minutes: number) => void;
  onCancel: () => void;
  onDismissDone: () => void;
}

export default function FocusTimerView({
  goals,
  courses,
  phase,
  remainingMs,
  totalMs,
  courseId,
  taskText,
  nextUp,
  now,
  message,
  onBegin,
  onCancel,
  onDismissDone,
}: FocusTimerViewProps): JSX.Element {
  const [duration, setDuration] = useState<number>(30);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [freeText, setFreeText] = useState("");
  const [showAltPicker, setShowAltPicker] = useState(false);

  const selectableCourses = useMemo(
    () => courses.filter((c) => c.status !== "Completed"),
    [courses]
  );

  const groupedByGoal = useMemo(() => {
    return goals
      .map((goal) => ({
        goal,
        courses: selectableCourses.filter((c) => c.goalId === goal.id),
      }))
      .filter((group) => group.courses.length > 0);
  }, [goals, selectableCourses]);

  const goalName = (goalId: string): string => goals.find((g) => g.id === goalId)?.name ?? goalId;

  const activeTask = courses.find((c) => c.id === courseId) ?? null;
  const displayName = activeTask?.name ?? taskText;

  const canStart = selectedCourseId !== null || freeText.trim().length > 0;

  const handleNextUpClick = (id: number): void => {
    setSelectedCourseId((prev) => (prev === id ? null : id));
    setFreeText("");
  };

  const handleFreeTextChange = (value: string): void => {
    setFreeText(value);
    if (value.trim().length > 0) setSelectedCourseId(null);
  };

  const handleAltSelect = (value: string): void => {
    const id = Number(value);
    if (!id) return;
    setSelectedCourseId(id);
    setFreeText("");
  };

  const handleStart = (): void => {
    if (!canStart) return;
    if (selectedCourseId !== null) {
      const course = courses.find((c) => c.id === selectedCourseId);
      onBegin({ courseId: selectedCourseId, task: course?.name ?? "Untitled task" }, duration);
    } else {
      onBegin({ courseId: null, task: freeText.trim() }, duration);
    }
    setSelectedCourseId(null);
    setFreeText("");
    setShowAltPicker(false);
  };

  if (phase === "running") {
    const progress = totalMs > 0 ? 1 - remainingMs / totalMs : 0;
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-16 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Focusing on
        </p>
        <h2 className="text-lg font-semibold">{displayName || "Untitled task"}</h2>

        <div
          className="relative flex size-56 items-center justify-center rounded-full transition-[background] duration-1000 ease-linear"
          style={{
            background: `conic-gradient(hsl(var(--primary)) ${progress * 360}deg, hsl(var(--secondary)) 0deg)`,
          }}
        >
          <div className="absolute inset-3 rounded-full bg-background" />
          <span className="relative text-4xl font-semibold tabular-nums">
            {formatCountdown(remainingMs)}
          </span>
        </div>

        <Button variant="outline" onClick={onCancel}>
          <X className="size-3.5" />
          Cancel session
        </Button>
      </div>
    );
  }

  if (phase === "done" || phase === "journal") {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-success/15 text-success">
          <PartyPopper className="size-8" />
        </div>
        <h2 className="text-lg font-semibold">Focus session complete!</h2>
        {displayName && (
          <p className="text-sm text-muted-foreground">
            You focused on <span className="font-medium text-foreground">{displayName}</span>
          </p>
        )}
        <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
        {phase === "done" && <Button onClick={onDismissDone}>Start another session</Button>}
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-16">
      <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <TimerIcon className="size-6" />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-semibold">Focus Timer</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a session length, choose a task, and go heads-down.
        </p>
      </div>

      <div className="grid w-full grid-cols-4 gap-2">
        {DURATIONS.map((mins) => (
          <button
            key={mins}
            type="button"
            onClick={() => setDuration(mins)}
            className={cn(
              "rounded-lg border px-3 py-3 text-sm font-medium transition-colors",
              duration === mins
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:bg-accent"
            )}
          >
            {mins}
            <span className="block text-[11px] font-normal opacity-80">min</span>
          </button>
        ))}
      </div>

      {nextUp.length > 0 && (
        <div className="w-full">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Next up
          </p>
          <div className="flex flex-col gap-1.5">
            {nextUp.map(({ course, lastTouchedAt }) => {
              const isSelected = selectedCourseId === course.id;
              return (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => handleNextUpClick(course.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors",
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:bg-accent"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{course.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {goalName(course.goalId)} · {course.progress}% ·{" "}
                      {formatRelativeDays(lastTouchedAt, now)}
                    </p>
                  </div>
                  <StatusBadge status={course.status} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="w-full">
        <Input
          value={freeText}
          onChange={(e) => handleFreeTextChange(e.target.value)}
          placeholder="Or type what you'll work on"
        />
      </div>

      {!showAltPicker ? (
        <button
          type="button"
          onClick={() => setShowAltPicker(true)}
          className="text-xs font-medium text-muted-foreground underline-offset-2 hover:underline"
        >
          Choose a different topic
        </button>
      ) : (
        <Card className="w-full">
          <CardContent className="flex flex-col gap-3 p-4">
            <select
              value={selectedCourseId !== null ? String(selectedCourseId) : ""}
              onChange={(e) => handleAltSelect(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="" disabled>
                Choose a task…
              </option>
              {groupedByGoal.map(({ goal, courses: goalCourses }) => (
                <optgroup key={goal.id} label={goal.name}>
                  {goalCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </CardContent>
        </Card>
      )}

      <Button size="lg" className="w-full" disabled={!canStart} onClick={handleStart}>
        <Play className="size-4" />
        Start
      </Button>
      {selectableCourses.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No open tasks to focus on yet — type what you're working on above, or add one from a
          goal's dashboard.
        </p>
      )}
    </div>
  );
}
