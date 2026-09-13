import { CheckCircle2, CircleDashed, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CourseStatus } from "@/types";

const STATUS_CONFIG: Record<
  CourseStatus,
  { icon: typeof CheckCircle2; variant: "success" | "warning" | "muted" }
> = {
  Completed: { icon: CheckCircle2, variant: "success" },
  "In Progress": { icon: Clock, variant: "warning" },
  "Not Started": { icon: CircleDashed, variant: "muted" },
};

interface StatusBadgeProps {
  status: CourseStatus;
  active?: boolean;
  onClick?: (status: CourseStatus) => void;
}

export default function StatusBadge({ status, active, onClick }: StatusBadgeProps): JSX.Element {
  const { icon: Icon, variant } = STATUS_CONFIG[status];

  if (!onClick) {
    return (
      <Badge variant={variant}>
        <Icon className="size-3.5" />
        {status}
      </Badge>
    );
  }

  return (
    <button type="button" onClick={() => onClick(status)} className="rounded-full">
      <Badge
        variant={variant}
        className={cn(
          "cursor-pointer transition-transform hover:scale-105",
          active && "ring-2 ring-offset-1 ring-current"
        )}
      >
        <Icon className="size-3.5" />
        {status}
      </Badge>
    </button>
  );
}
