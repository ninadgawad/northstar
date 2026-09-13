export type CourseStatus = "Completed" | "In Progress" | "Not Started";

export interface Goal {
  id: string;
  name: string;
}

export interface Course {
  goalId: string;
  category: string;
  name: string;
  platform: string;
  link: string;
  status: CourseStatus;
  lastCompleted: string | null;
  timeToComplete: string;
  notes: string;
}
