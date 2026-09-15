export type CourseStatus = "Completed" | "In Progress" | "Not Started";

export interface Goal {
  id: string;
  name: string;
  /** ISO date (YYYY-MM-DD), or null when no deadline is set. */
  targetDate: string | null;
  /** ISO date (YYYY-MM-DD), or null; pace falls back to the earliest completion. */
  startedAt: string | null;
}

export type GoalPatch = Partial<Pick<Goal, "name" | "targetDate" | "startedAt">>;

export interface Course {
  id: number;
  goalId: string;
  category: string;
  name: string;
  platform: string;
  link: string;
  status: CourseStatus;
  /** 0-100. Kept in sync with status: 100 on Completed, 0 on Not Started. */
  progress: number;
  lastCompleted: string | null;
  timeToComplete: string;
  notes: string;
  userNote: string;
  /** Position within its goal's roadmap; unique per goal, 0-based. */
  sortOrder: number;
  /** ISO timestamp of the last learning-relevant mutation (status/progress/note). */
  updatedAt: string | null;
}

export type CourseInput = Omit<Course, "id" | "sortOrder" | "updatedAt"> & {
  sortOrder?: number;
  updatedAt?: string;
};
export type CoursePatch = Partial<Omit<Course, "id" | "goalId">>;

export interface FocusSession {
  id: number;
  goalId: string;
  courseId: number | null;
  /** Snapshot of the course name (or free text) at the time of the session. */
  task: string;
  minutes: number;
  /** ISO timestamp (UTC). */
  startedAt: string;
  /** ISO timestamp (UTC). */
  endedAt: string;
  completed: boolean;
}

export type FocusSessionInput = Omit<FocusSession, "id">;

export interface CourseEvent {
  id: number;
  courseId: number;
  goalId: string;
  /** Snapshot of the course name for recap text, in case the course is later deleted/renamed. */
  courseName: string;
  fromStatus: CourseStatus;
  toStatus: CourseStatus;
  fromProgress: number;
  toProgress: number;
  /** ISO timestamp (UTC). */
  at: string;
}

export type CourseEventInput = Omit<CourseEvent, "id">;
