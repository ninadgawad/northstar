import { useMemo } from "react";
import { Compass } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import BurndownChart from "@/components/BurndownChart";
import RoadmapPath from "@/components/RoadmapPath";
import { buildBurndown, computePace, type PaceStatus } from "@/lib/pace";
import { cn } from "@/lib/utils";
import type { Course, Goal } from "@/types";

interface RoadmapViewProps {
  goal: Goal | undefined;
  courses: Course[];
  onTopicClick: (course: Course) => void;
  onGoToAdmin: () => void;
}

const STATUS_PILL: Record<PaceStatus, { label: (weeks: number) => string; classes: string }> = {
  "on-track": { label: () => "On track", classes: "bg-success/10 text-success" },
  behind: { label: (weeks) => `Behind by ${weeks.toFixed(1)} wk`, classes: "bg-warning/10 text-warning" },
  overdue: { label: () => "Overdue", classes: "bg-destructive/10 text-destructive" },
  done: { label: () => "Done", classes: "bg-success/10 text-success" },
  "no-target": { label: () => "No target date set", classes: "bg-muted text-muted-foreground" },
  "no-data": { label: () => "Not enough data yet", classes: "bg-muted text-muted-foreground" },
};

export default function RoadmapView({
  goal,
  courses,
  onTopicClick,
  onGoToAdmin,
}: RoadmapViewProps): JSX.Element {
  const today = new Date();

  const { report, burndown } = useMemo(() => {
    const paceInput = {
      courses,
      targetDate: goal?.targetDate ?? null,
      startedAt: goal?.startedAt ?? null,
      today,
    };
    const paceReport = computePace(paceInput);
    return { report: paceReport, burndown: buildBurndown(paceInput, paceReport) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courses, goal?.targetDate, goal?.startedAt]);

  if (courses.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm font-medium text-foreground">No topics yet for this goal.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add topics to <strong className="font-medium text-foreground">{goal?.name}</strong> to
          build out a roadmap.
        </p>
      </div>
    );
  }

  const pill = STATUS_PILL[report.status];

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label="Target"
          value={goal?.targetDate ?? "—"}
        />
        <StatTile
          label="Required pace"
          value={report.requiredPerWeek !== null ? `${report.requiredPerWeek.toFixed(1)} / wk` : "—"}
        />
        <StatTile label="Actual pace" value={`${report.actualPerWeek.toFixed(1)} / wk`} />
        <StatTile
          label="Projected finish"
          value={report.projectedFinish ?? "—"}
        />
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", pill.classes)}>
          {pill.label(report.behindByWeeks)}
        </span>
        {report.status === "no-target" && (
          <button
            type="button"
            onClick={onGoToAdmin}
            className="text-xs font-medium text-primary underline-offset-4 hover:underline"
          >
            Set a target date
          </button>
        )}
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium">
            <Compass className="size-4 text-muted-foreground" />
            Burn-down
          </div>
          <BurndownChart series={burndown} today={today} />
        </CardContent>
      </Card>

      <RoadmapPath courses={courses} onTopicClick={onTopicClick} />
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3">
      <div className="text-lg font-semibold tracking-tight tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
