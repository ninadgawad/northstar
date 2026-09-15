// Builds the plain-English "Weekly recap" lines shown in WeeklyRecapDialog.
import { formatMinutes, formatRangeLabel, inRange, type DateRange } from "@/lib/dates";
import type { CourseEvent, FocusSession, Goal } from "@/types";

export interface Recap {
  title: string;
  lines: string[];
  empty: boolean;
}

function goalName(goals: Goal[], goalId: string): string {
  return goals.find((g) => g.id === goalId)?.name ?? goalId;
}

export function buildRecap(
  sessions: FocusSession[],
  events: CourseEvent[],
  goals: Goal[],
  range: DateRange,
  streaks: { current: number; best: number }
): Recap {
  const title = `Week of ${formatRangeLabel(range)}`;
  const lines: string[] = [];

  const weekSessions = sessions.filter((s) => inRange(s.endedAt, range));
  const completedSessions = weekSessions.filter((s) => s.completed);
  const totalMinutes = weekSessions.reduce((sum, s) => sum + s.minutes, 0);

  if (completedSessions.length > 0) {
    const byGoal = new Map<string, number>();
    for (const s of completedSessions) {
      byGoal.set(s.goalId, (byGoal.get(s.goalId) ?? 0) + 1);
    }
    const breakdown = [...byGoal.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([goalId, count]) => `${count} on ${goalName(goals, goalId)}`)
      .join(", ");
    lines.push(
      `${completedSessions.length} focus session${completedSessions.length === 1 ? "" : "s"} (${formatMinutes(
        totalMinutes
      )}) — ${breakdown}`
    );
  }

  const weekEvents = events.filter((e) => inRange(e.at, range));
  const latestByCourse = new Map<number, CourseEvent>();
  for (const ev of weekEvents) {
    const prev = latestByCourse.get(ev.courseId);
    if (!prev || new Date(ev.at).getTime() >= new Date(prev.at).getTime()) {
      latestByCourse.set(ev.courseId, ev);
    }
  }
  const started: CourseEvent[] = [];
  const completed: CourseEvent[] = [];
  for (const ev of latestByCourse.values()) {
    if (ev.toStatus === "In Progress") started.push(ev);
    else if (ev.toStatus === "Completed") completed.push(ev);
  }
  if (started.length > 0 || completed.length > 0) {
    const parts: string[] = [];
    if (started.length > 0) {
      parts.push(`${started.length} topic${started.length === 1 ? "" : "s"} moved to In Progress`);
    }
    if (completed.length > 0) {
      const names = completed.map((e) => e.courseName).join(", ");
      parts.push(`${completed.length} completed: ${names}`);
    }
    lines.push(parts.join(", "));
  }

  if (streaks.current > 0 || streaks.best > 0) {
    lines.push(`Streak: ${streaks.current} day${streaks.current === 1 ? "" : "s"} (best ${streaks.best})`);
  }

  if (lines.length === 0) {
    return {
      title,
      lines: ["No sessions logged this week — pick a topic and start a focus session to get going."],
      empty: true,
    };
  }

  return { title, lines, empty: false };
}
