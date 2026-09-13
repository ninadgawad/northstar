export type CourseStatus = "Completed" | "In Progress" | "Not Started";

export interface Course {
  category: string;
  name: string;
  platform: string;
  link: string;
  status: CourseStatus;
  lastCompleted: string | null;
  timeToComplete: string;
  notes: string;
}
