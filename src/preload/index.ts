import { contextBridge, ipcRenderer } from "electron";
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

const api = {
  appVersion: process.env["npm_package_version"] ?? "0.0.0",
  goals: {
    list: (): Promise<Goal[]> => ipcRenderer.invoke("db:listGoals"),
    add: (name: string): Promise<Goal> => ipcRenderer.invoke("db:addGoal", name),
    update: (id: string, patch: GoalPatch): Promise<Goal> =>
      ipcRenderer.invoke("db:updateGoal", id, patch),
  },
  courses: {
    list: (goalId: string): Promise<Course[]> => ipcRenderer.invoke("db:listCourses", goalId),
    add: (input: CourseInput): Promise<Course> => ipcRenderer.invoke("db:addCourse", input),
    update: (id: number, patch: CoursePatch): Promise<Course> =>
      ipcRenderer.invoke("db:updateCourse", id, patch),
    remove: (id: number): Promise<void> => ipcRenderer.invoke("db:deleteCourse", id),
  },
  sessions: {
    add: (input: FocusSessionInput): Promise<FocusSession> =>
      ipcRenderer.invoke("db:addSession", input),
    list: (since?: string): Promise<FocusSession[]> => ipcRenderer.invoke("db:listSessions", since),
  },
  events: {
    add: (input: CourseEventInput): Promise<CourseEvent> =>
      ipcRenderer.invoke("db:addCourseEvent", input),
    list: (since?: string): Promise<CourseEvent[]> =>
      ipcRenderer.invoke("db:listCourseEvents", since),
  },
};

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld("api", api);
} else {
  window.api = api;
}
