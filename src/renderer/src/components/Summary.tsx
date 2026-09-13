import { useMemo } from "react";
import { CheckCircle2, Clock, Hourglass, Timer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Course } from "@/types";
import { parseHours } from "@/utils";

interface SummaryProps {
  courses: Course[];
}

export default function Summary({ courses }: SummaryProps): JSX.Element {
  const stats = useMemo(() => {
    const completed = courses.filter((c) => c.status === "Completed");
    const inProgress = courses.filter((c) => c.status === "In Progress");
    const totalHours = courses.reduce((sum, c) => sum + parseHours(c.timeToComplete), 0);
    const completedHours = completed.reduce((sum, c) => sum + parseHours(c.timeToComplete), 0);
    const remainingHours = totalHours - completedHours;

    return [
      {
        icon: CheckCircle2,
        value: `${completed.length} / ${courses.length}`,
        label: "Courses completed",
      },
      { icon: Clock, value: String(inProgress.length), label: "In progress" },
      { icon: Timer, value: `${Math.round(completedHours)}h`, label: "Hours logged" },
      { icon: Hourglass, value: `${Math.round(remainingHours)}h`, label: "Hours remaining" },
    ];
  }, [courses]);

  return (
    <section className="mb-14 grid grid-cols-2 gap-3 md:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="flex flex-col gap-2 p-5">
            <stat.icon className="size-4 text-muted-foreground" />
            <div className="text-2xl font-semibold tracking-tight">{stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
