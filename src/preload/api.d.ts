import type {
  Course,
  CourseEvent,
  CourseEventInput,
  CourseInput,
  CoursePatch,
  FocusSession,
  FocusSessionInput,
  Goal,
  GoalPatch,
} from "../shared/types";

export interface NorthstarApi {
  appVersion: string;
  goals: {
    list: () => Promise<Goal[]>;
    add: (name: string) => Promise<Goal>;
    update: (id: string, patch: GoalPatch) => Promise<Goal>;
  };
  courses: {
    list: (goalId: string) => Promise<Course[]>;
    add: (input: CourseInput) => Promise<Course>;
    update: (id: number, patch: CoursePatch) => Promise<Course>;
    remove: (id: number) => Promise<void>;
  };
  sessions: {
    add: (input: FocusSessionInput) => Promise<FocusSession>;
    list: (since?: string) => Promise<FocusSession[]>;
  };
  events: {
    add: (input: CourseEventInput) => Promise<CourseEvent>;
    list: (since?: string) => Promise<CourseEvent[]>;
  };
}

declare global {
  interface Window {
    api: NorthstarApi;
  }
}
