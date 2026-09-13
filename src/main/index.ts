import { app, shell, BrowserWindow, ipcMain } from "electron";
import { join } from "path";
import * as db from "./db";
import type { CourseInput, CoursePatch } from "../shared/types";

function registerIpcHandlers(): void {
  ipcMain.handle("db:listGoals", () => db.listGoals());
  ipcMain.handle("db:addGoal", (_event, name: string) => db.addGoal(name));
  ipcMain.handle("db:listCourses", (_event, goalId: string) => db.listCourses(goalId));
  ipcMain.handle("db:addCourse", (_event, input: CourseInput) => db.addCourse(input));
  ipcMain.handle("db:updateCourse", (_event, id: number, patch: CoursePatch) =>
    db.updateCourse(id, patch)
  );
  ipcMain.handle("db:deleteCourse", (_event, id: number) => db.deleteCourse(id));
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1100,
    height: 800,
    minWidth: 720,
    minHeight: 480,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: "#f7f7f5",
    titleBarStyle: "hiddenInset",
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  if (!app.isPackaged && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(async () => {
  await db.initDatabase();
  registerIpcHandlers();
  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
