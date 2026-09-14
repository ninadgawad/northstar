export type CourseStatus = "Completed" | "In Progress" | "Not Started";

export interface Goal {
  id: string;
  name: string;
}

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
}

export type CourseInput = Omit<Course, "id">;
export type CoursePatch = Partial<Omit<Course, "id" | "goalId">>;
