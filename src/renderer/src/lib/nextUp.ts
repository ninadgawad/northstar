// Ranks courses for the Focus Timer's "Next Up" suggestions: what's most
// worth picking up right now, biased toward what's been sitting untouched.
import type { Course, FocusSession } from "@/types";
import { parseIsoDate } from "@/lib/dates";

export interface NextUpItem {
  course: Course;
  /** Epoch ms of the latest learning-relevant touch, or null if never touched. */
  lastTouchedAt: number | null;
}

/**
 * Latest of: `course.updatedAt`, `course.lastCompleted` (date-only, taken at
 * local midnight), and the `endedAt` of the course's last *completed* focus
 * session. Abandoned (cancelled) sessions don't count as a touch.
 */
export function lastTouchedAt(course: Course, sessions: FocusSession[]): number | null {
  const candidates: number[] = [];
  if (course.updatedAt) candidates.push(new Date(course.updatedAt).getTime());
  if (course.lastCompleted) candidates.push(parseIsoDate(course.lastCompleted).getTime());

  let lastSessionEnd: number | null = null;
  for (const s of sessions) {
    if (!s.completed || s.courseId !== course.id) continue;
    const t = new Date(s.endedAt).getTime();
    if (lastSessionEnd === null || t > lastSessionEnd) lastSessionEnd = t;
  }
  if (lastSessionEnd !== null) candidates.push(lastSessionEnd);

  return candidates.length ? Math.max(...candidates) : null;
}

export interface RankNextUpOptions {
  limit?: number;
  goalId?: string;
}

/**
 * Ranked "what to work on next" suggestions: Completed courses are dropped,
 * In Progress courses come first (oldest-touched first, untouched first,
 * then lowest progress), then Not Started courses (lowest progress first,
 * then oldest-touched, untouched first).
 */
export function rankNextUp(
  courses: Course[],
  sessions: FocusSession[],
  opts: RankNextUpOptions = {}
): NextUpItem[] {
  const limit = opts.limit ?? 5;
  const scoped = courses.filter(
    (c) => c.status !== "Completed" && (opts.goalId === undefined || c.goalId === opts.goalId)
  );

  const items: NextUpItem[] = scoped.map((course) => ({
    course,
    lastTouchedAt: lastTouchedAt(course, sessions),
  }));

  const inProgress = items
    .filter((i) => i.course.status === "In Progress")
    .sort((a, b) => {
      const at = a.lastTouchedAt ?? -Infinity;
      const bt = b.lastTouchedAt ?? -Infinity;
      if (at !== bt) return at - bt;
      if (a.course.progress !== b.course.progress) return a.course.progress - b.course.progress;
      return a.course.id - b.course.id;
    });

  const notStarted = items
    .filter((i) => i.course.status === "Not Started")
    .sort((a, b) => {
      if (a.course.progress !== b.course.progress) return a.course.progress - b.course.progress;
      const at = a.lastTouchedAt ?? -Infinity;
      const bt = b.lastTouchedAt ?? -Infinity;
      if (at !== bt) return at - bt;
      return a.course.id - b.course.id;
    });

  return [...inProgress, ...notStarted].slice(0, limit);
}
