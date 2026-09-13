import { contextBridge, ipcRenderer } from "electron";
import type { Course, CourseInput, CoursePatch, Goal } from "../shared/types";

const api = {
  appVersion: process.env["npm_package_version"] ?? "0.0.0",
  goals: {
    list: (): Promise<Goal[]> => ipcRenderer.invoke("db:listGoals"),
    add: (name: string): Promise<Goal> => ipcRenderer.invoke("db:addGoal", name),
  },
  courses: {
    list: (goalId: string): Promise<Course[]> => ipcRenderer.invoke("db:listCourses", goalId),
    add: (input: CourseInput): Promise<Course> => ipcRenderer.invoke("db:addCourse", input),
    update: (id: number, patch: CoursePatch): Promise<Course> =>
      ipcRenderer.invoke("db:updateCourse", id, patch),
    remove: (id: number): Promise<void> => ipcRenderer.invoke("db:deleteCourse", id),
  },
};

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld("api", api);
} else {
  window.api = api;
}
