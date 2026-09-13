import { CheckCircle2, CircleDashed, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CourseStatus } from "@/types";

const STATUS_CONFIG: Record<
  CourseStatus,
  { icon: typeof CheckCircle2; variant: "success" | "warning" | "muted" }
> = {
  Completed: { icon: CheckCircle2, variant: "success" },
  "In Progress": { icon: Clock, variant: "warning" },
  "Not Started": { icon: CircleDashed, variant: "muted" },
};

export default function StatusBadge({ status }: { status: CourseStatus }): JSX.Element {
  const { icon: Icon, variant } = STATUS_CONFIG[status];
  return (
    <Badge variant={variant}>
      <Icon className="size-3.5" />
      {status}
    </Badge>
  );
}
