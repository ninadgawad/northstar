import { useMemo, useState } from "react";
import { PartyPopper, Play, Timer as TimerIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Course, Goal } from "@/types";
import { formatCountdown } from "@/utils";

const DURATIONS = [15, 30, 45, 60] as const;

export type FocusPhase = "idle" | "running" | "done";

interface FocusTimerViewProps {
  goals: Goal[];
  courses: Course[];
  phase: FocusPhase;
  remainingMs: number;
  totalMs: number;
  taskId: number | null;
  message: string;
  onBegin: (taskId: number, minutes: number) => void;
  onCancel: () => void;
  onDismissDone: () => void;
}

export default function FocusTimerView({
  goals,
  courses,
  phase,
  remainingMs,
  totalMs,
  taskId,
  message,
  onBegin,
  onCancel,
  onDismissDone,
}: FocusTimerViewProps): JSX.Element {
  const [duration, setDuration] = useState<number>(30);
  const [showPicker, setShowPicker] = useState(false);
  const [pickedTaskId, setPickedTaskId] = useState<string>("");

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

  const activeTask = courses.find((c) => c.id === taskId) ?? null;

  const handleBeginClick = (): void => {
    const id = Number(pickedTaskId);
    if (!id) return;
    onBegin(id, duration);
    setShowPicker(false);
    setPickedTaskId("");
  };

  if (phase === "running") {
    const progress = totalMs > 0 ? 1 - remainingMs / totalMs : 0;
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-16 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Focusing on
        </p>
        <h2 className="text-lg font-semibold">{activeTask?.name ?? "Untitled task"}</h2>

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

  if (phase === "done") {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-success/15 text-success">
          <PartyPopper className="size-8" />
        </div>
        <h2 className="text-lg font-semibold">Focus session complete!</h2>
        {activeTask && (
          <p className="text-sm text-muted-foreground">
            You focused on <span className="font-medium text-foreground">{activeTask.name}</span>
          </p>
        )}
        <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
        <Button onClick={onDismissDone}>Start another session</Button>
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

      {!showPicker ? (
        <>
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
          <Button
            size="lg"
            className="w-full"
            disabled={selectableCourses.length === 0}
            onClick={() => setShowPicker(true)}
          >
            <Play className="size-4" />
            Start
          </Button>
          {selectableCourses.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No open tasks to focus on yet — add one from a goal's dashboard first.
            </p>
          )}
        </>
      ) : (
        <Card className="w-full">
          <CardContent className="flex flex-col gap-3 p-4">
            <p className="text-sm font-medium">
              What are you focusing on for {duration} minutes?
            </p>
            <select
              value={pickedTaskId}
              onChange={(e) => setPickedTaskId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              autoFocus
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
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowPicker(false)}>
                Back
              </Button>
              <Button className="flex-1" disabled={!pickedTaskId} onClick={handleBeginClick}>
                <Play className="size-3.5" />
                Begin focus session
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
