// Weekly momentum stats: focus time, topic movement, and daily streaks.
// All day/week bucketing goes through lib/dates.ts (local time) — see its
// module note for why toISOString() must never be used for this.
import { inRange, localDayKey, type DateRange } from "@/lib/dates";
import type { CourseEvent, CourseStatus, FocusSession } from "@/types";

export interface WeekStats {
  /** Completed + abandoned sessions with endedAt in range. */
  focusMinutes: number;
  /** Completed sessions only. */
  sessionCount: number;
  /** Distinct courseId with any forward event in range. */
  topicsAdvanced: number;
  /** Distinct courseId whose latest in-range event has toStatus "Completed". */
  topicsCompleted: number;
  /** Distinct courseId whose latest in-range event has toStatus "In Progress". */
  topicsStarted: number;
  currentStreak: number;
  bestStreak: number;
}

const STATUS_RANK: Record<CourseStatus, number> = {
  "Not Started": 0,
  "In Progress": 1,
  Completed: 2,
};

/** A "forward" event: status rank increased, or progress increased (regressions don't count). */
function isForwardEvent(ev: CourseEvent): boolean {
  return STATUS_RANK[ev.toStatus] > STATUS_RANK[ev.fromStatus] || ev.toProgress > ev.fromProgress;
}

export function computeWeekStats(
  sessions: FocusSession[],
  events: CourseEvent[],
  range: DateRange,
  goalId?: string
): WeekStats {
  const inRangeSessions = sessions.filter(
    (s) => inRange(s.endedAt, range) && (!goalId || s.goalId === goalId)
  );
  const focusMinutes = inRangeSessions.reduce((sum, s) => sum + s.minutes, 0);
  const sessionCount = inRangeSessions.filter((s) => s.completed).length;

  const inRangeEvents = events.filter(
    (e) => inRange(e.at, range) && (!goalId || e.goalId === goalId)
  );

  const advancedCourseIds = new Set(
    inRangeEvents.filter(isForwardEvent).map((e) => e.courseId)
  );

  // Latest in-range event per course, bucketed by its toStatus.
  const latestByCourse = new Map<number, CourseEvent>();
  for (const ev of inRangeEvents) {
    const prev = latestByCourse.get(ev.courseId);
    if (!prev || new Date(ev.at).getTime() >= new Date(prev.at).getTime()) {
      latestByCourse.set(ev.courseId, ev);
    }
  }
  let topicsCompleted = 0;
  let topicsStarted = 0;
  for (const ev of latestByCourse.values()) {
    if (ev.toStatus === "Completed") topicsCompleted++;
    else if (ev.toStatus === "In Progress") topicsStarted++;
  }

  const streaks = computeStreaks(sessions, new Date());

  return {
    focusMinutes,
    sessionCount,
    topicsAdvanced: advancedCourseIds.size,
    topicsCompleted,
    topicsStarted,
    currentStreak: streaks.current,
    bestStreak: streaks.best,
  };
}

export function computeStreaks(
  sessions: FocusSession[],
  now: Date
): { current: number; best: number } {
  const dayKeys = new Set(
    sessions.filter((s) => s.completed).map((s) => localDayKey(new Date(s.endedAt)))
  );

  if (dayKeys.size === 0) return { current: 0, best: 0 };

  // Current streak: start at today; if today has no session yet, step back one
  // day first (grace — not having trained *yet* today doesn't break the streak).
  let cursor = new Date(now);
  if (!dayKeys.has(localDayKey(cursor))) {
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() - 1);
  }
  let current = 0;
  while (dayKeys.has(localDayKey(cursor))) {
    current++;
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() - 1);
  }

  // Best streak: sort unique day keys and walk, tracking the longest run of
  // consecutive local days.
  const sortedKeys = [...dayKeys].sort();
  let best = 0;
  let run = 0;
  let prevTime: number | null = null;
  for (const key of sortedKeys) {
    const t = new Date(key + "T00:00:00").getTime();
    if (prevTime !== null && t - prevTime === 86_400_000) {
      run++;
    } else {
      run = 1;
    }
    best = Math.max(best, run);
    prevTime = t;
  }

  return { current, best };
}
