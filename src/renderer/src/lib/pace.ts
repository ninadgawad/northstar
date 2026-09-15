// Pace math for the Goal Roadmap view: "am I on track to hit my target date?"
// Pure functions, `today` is injectable for testability. All date comparisons
// go through parseIsoDate/weeksBetween (lib/dates.ts) so they land on local
// midnight, matching how lastCompleted/targetDate/startedAt are stored.

import type { Course } from "@/types";
import { localDayKey, parseIsoDate, weeksBetween } from "@/lib/dates";

export type PaceStatus = "no-target" | "done" | "no-data" | "on-track" | "behind" | "overdue";

export interface PaceInput {
  courses: Course[];
  targetDate: string | null;
  startedAt: string | null;
  /** Injectable "today" for tests; defaults to `new Date()`. */
  today?: Date;
}

export interface PaceReport {
  total: number;
  completed: number;
  remaining: number;
  /** Resolved reference start date, "YYYY-MM-DD". */
  startDate: string;
  elapsedWeeks: number;
  /** Weeks until the target date; null without a target, negative when past due. */
  weeksLeft: number | null;
  /** remaining / weeksLeft; null without a target or when weeksLeft <= 0. */
  requiredPerWeek: number | null;
  /** completed / max(elapsedWeeks, 1). */
  actualPerWeek: number;
  /** Projected finish date "YYYY-MM-DD"; null when actualPerWeek is 0 and work remains. */
  projectedFinish: string | null;
  /** How many weeks behind the target the projected finish is; always >= 0. */
  behindByWeeks: number;
  status: PaceStatus;
}

/** Earliest `lastCompleted` among completed courses, or null if none/unset. */
function earliestCompletion(courses: Course[]): string | null {
  const dates = courses
    .filter((c) => c.status === "Completed" && c.lastCompleted)
    .map((c) => c.lastCompleted as string)
    .sort();
  return dates[0] ?? null;
}

/** Latest `lastCompleted` among completed courses, or null if none/unset. */
function latestCompletion(courses: Course[]): string | null {
  const dates = courses
    .filter((c) => c.status === "Completed" && c.lastCompleted)
    .map((c) => c.lastCompleted as string)
    .sort();
  return dates.length ? dates[dates.length - 1] : null;
}

export function computePace(input: PaceInput): PaceReport {
  const { courses, targetDate, startedAt } = input;
  const today = input.today ?? new Date();

  const total = courses.length;
  const completed = courses.filter((c) => c.status === "Completed").length;
  const remaining = total - completed;

  const startDate = startedAt ?? earliestCompletion(courses) ?? localDayKey(today);
  const startD = parseIsoDate(startDate);

  const elapsedWeeks = Math.max(weeksBetween(startD, today), 0);
  const actualPerWeek = completed === 0 ? 0 : completed / Math.max(elapsedWeeks, 1);

  const weeksLeft = targetDate ? weeksBetween(today, parseIsoDate(targetDate)) : null;
  const requiredPerWeek =
    weeksLeft !== null && weeksLeft > 0 ? remaining / weeksLeft : null;

  let projectedFinish: string | null = null;
  if (remaining === 0) {
    projectedFinish = latestCompletion(courses) ?? startDate;
  } else if (actualPerWeek > 0) {
    const weeksNeeded = remaining / actualPerWeek;
    const days = Math.ceil(weeksNeeded * 7);
    const finish = new Date(today);
    finish.setDate(finish.getDate() + days);
    projectedFinish = localDayKey(finish);
  }

  let behindByWeeks = 0;
  if (targetDate) {
    if (projectedFinish !== null) {
      behindByWeeks = Math.max(0, weeksBetween(parseIsoDate(targetDate), parseIsoDate(projectedFinish)));
    } else if (weeksLeft !== null && weeksLeft < 0) {
      behindByWeeks = -weeksLeft;
    }
  }

  let status: PaceStatus;
  if (total === 0) status = "no-data";
  else if (remaining === 0) status = "done";
  else if (!targetDate) status = "no-target";
  else if (weeksLeft !== null && weeksLeft < 0) status = "overdue";
  else if (actualPerWeek === 0) status = "no-data";
  else if (
    projectedFinish !== null &&
    parseIsoDate(projectedFinish).getTime() <= parseIsoDate(targetDate).getTime()
  )
    status = "on-track";
  else status = "behind";

  return {
    total,
    completed,
    remaining,
    startDate,
    elapsedWeeks,
    weeksLeft,
    requiredPerWeek,
    actualPerWeek,
    projectedFinish,
    behindByWeeks,
    status,
  };
}

export interface BurndownPoint {
  date: string;
  remaining: number;
}

export interface BurndownSeries {
  /** (start, total) → step down per completion → (today, remaining). */
  actual: BurndownPoint[];
  /** (start, total) → (target, 0); null without a target. */
  ideal: [BurndownPoint, BurndownPoint] | null;
  /** (projectedFinish, 0); null when there's no projection. */
  projected: BurndownPoint | null;
}

export function buildBurndown(input: PaceInput, report: PaceReport): BurndownSeries {
  const { courses, targetDate } = input;
  const today = input.today ?? new Date();
  const todayKey = localDayKey(today);

  const completions = courses
    .filter((c) => c.status === "Completed")
    .map((c) => c.lastCompleted ?? report.startDate)
    .sort();

  const actual: BurndownPoint[] = [{ date: report.startDate, remaining: report.total }];
  let remaining = report.total;
  for (const date of completions) {
    remaining -= 1;
    actual.push({ date, remaining });
  }
  const last = actual[actual.length - 1];
  if (last.date !== todayKey || last.remaining !== report.remaining) {
    actual.push({ date: todayKey, remaining: report.remaining });
  }

  const ideal: [BurndownPoint, BurndownPoint] | null = targetDate
    ? [
        { date: report.startDate, remaining: report.total },
        { date: targetDate, remaining: 0 },
      ]
    : null;

  const projected: BurndownPoint | null = report.projectedFinish
    ? { date: report.projectedFinish, remaining: 0 }
    : null;

  return { actual, ideal, projected };
}
