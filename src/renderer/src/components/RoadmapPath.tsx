import { Check } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { cn } from "@/lib/utils";
import type { Course } from "@/types";

interface RoadmapPathProps {
  courses: Course[];
  onTopicClick: (course: Course) => void;
}

/** Ordered vertical list of a goal's topics, in roadmap (sortOrder) order. */
export default function RoadmapPath({ courses, onTopicClick }: RoadmapPathProps): JSX.Element {
  const firstOpenId = courses.find((c) => c.status !== "Completed")?.id ?? null;

  return (
    <ol className="space-y-0">
      {courses.map((course, index) => {
        const isLast = index === courses.length - 1;
        const isUpNext = course.id === firstOpenId;
        return (
          <li key={course.id} className="relative flex gap-3 pb-4 last:pb-0">
            {!isLast && (
              <span
                className="absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-px bg-border"
                aria-hidden
              />
            )}
            <span
              className={cn(
                "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                course.status === "Completed" && "bg-success text-success-foreground",
                course.status === "In Progress" && "bg-warning text-warning-foreground",
                course.status === "Not Started" && "border border-border bg-card text-muted-foreground"
              )}
            >
              {course.status === "Completed" ? <Check className="size-4" /> : index + 1}
            </span>

            <button
              type="button"
              onClick={() => onTopicClick(course)}
              className={cn(
                "flex min-w-0 flex-1 items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:border-foreground/20",
                isUpNext && "border-primary/40 bg-primary/5"
              )}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{course.name}</span>
                  {isUpNext && (
                    <span className="shrink-0 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                      Up next
                    </span>
                  )}
                </div>
                <div className="mt-0.5 truncate text-xs text-muted-foreground">
                  {course.category} · {course.platform}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-xs tabular-nums text-muted-foreground">{course.progress}%</span>
                <StatusBadge status={course.status} />
              </div>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
