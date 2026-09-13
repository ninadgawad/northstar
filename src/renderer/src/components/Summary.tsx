import { useMemo } from "react";
import type { Course } from "../types";
import { parseHours } from "../utils";

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
      { value: `${completed.length} / ${courses.length}`, label: "Courses completed" },
      { value: String(inProgress.length), label: "In progress" },
      { value: `${Math.round(completedHours)}h`, label: "Hours logged" },
      { value: `${Math.round(remainingHours)}h`, label: "Hours remaining" },
    ];
  }, [courses]);

  return (
    <section className="summary">
      {stats.map((stat) => (
        <div className="stat" key={stat.label}>
          <div className="value">{stat.value}</div>
          <div className="label">{stat.label}</div>
        </div>
      ))}
    </section>
  );
}
