import type { Course, CourseInput, CoursePatch, Goal } from "../shared/types";

export interface NorthstarApi {
  appVersion: string;
  goals: {
    list: () => Promise<Goal[]>;
    add: (name: string) => Promise<Goal>;
  };
  courses: {
    list: (goalId: string) => Promise<Course[]>;
    add: (input: CourseInput) => Promise<Course>;
    update: (id: number, patch: CoursePatch) => Promise<Course>;
    remove: (id: number) => Promise<void>;
  };
}

declare global {
  interface Window {
    api: NorthstarApi;
  }
}
