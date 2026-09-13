import { useMemo } from "react";
import { CheckCircle2, CircleDashed, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Course, CourseStatus } from "@/types";

interface SummaryProps {
  courses: Course[];
  activeStatus: CourseStatus | null;
  onToggleStatus: (status: CourseStatus) => void;
}

const STATUS_CARDS: {
  status: CourseStatus;
  icon: typeof CheckCircle2;
  activeClasses: string;
  iconClasses: string;
}[] = [
  {
    status: "Completed",
    icon: CheckCircle2,
    activeClasses: "border-success/40 bg-success/10 ring-1 ring-success/40",
    iconClasses: "text-success",
  },
  {
    status: "In Progress",
    icon: Clock,
    activeClasses: "border-warning/40 bg-warning/10 ring-1 ring-warning/40",
    iconClasses: "text-warning",
  },
  {
    status: "Not Started",
    icon: CircleDashed,
    activeClasses: "border-muted-foreground/30 bg-muted ring-1 ring-muted-foreground/30",
    iconClasses: "text-muted-foreground",
  },
];

export default function Summary({ courses, activeStatus, onToggleStatus }: SummaryProps): JSX.Element {
  const counts = useMemo(() => {
    const map: Record<CourseStatus, number> = {
      Completed: 0,
      "In Progress": 0,
      "Not Started": 0,
    };
    for (const course of courses) map[course.status]++;
    return map;
  }, [courses]);

  return (
    <section className="mb-4 grid grid-cols-3 gap-3">
      {STATUS_CARDS.map(({ status, icon: Icon, activeClasses, iconClasses }) => {
        const isActive = activeStatus === status;
        return (
          <button
            key={status}
            type="button"
            aria-pressed={isActive}
            onClick={() => onToggleStatus(status)}
            className={cn(
              "flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-left transition-colors hover:border-foreground/20",
              isActive && activeClasses
            )}
          >
            <div>
              <div className="text-2xl font-semibold tracking-tight">{counts[status]}</div>
              <div className="text-xs text-muted-foreground">{status}</div>
            </div>
            <Icon className={cn("size-5 shrink-0", iconClasses)} />
          </button>
        );
      })}
    </section>
  );
}
