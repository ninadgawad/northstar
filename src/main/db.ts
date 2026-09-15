import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { app } from "electron";
import initSqlJs, { type Database } from "sql.js";
import { FDE_COURSES, FDE_GOAL, INITIAL_COURSES, INITIAL_GOALS } from "../shared/seed";
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

let db: Database;
let dbPath: string;

function persist(): void {
  writeFileSync(dbPath, Buffer.from(db.export()));
}

function createSchema(): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      targetDate TEXT,
      startedAt TEXT
    );
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      goalId TEXT NOT NULL,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      platform TEXT NOT NULL,
      link TEXT NOT NULL,
      status TEXT NOT NULL,
      progress INTEGER NOT NULL DEFAULT 0,
      lastCompleted TEXT,
      timeToComplete TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      userNote TEXT NOT NULL DEFAULT '',
      sortOrder INTEGER NOT NULL DEFAULT 0,
      updatedAt TEXT,
      FOREIGN KEY (goalId) REFERENCES goals(id)
    );
    CREATE TABLE IF NOT EXISTS focus_sessions (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      goalId    TEXT    NOT NULL,
      courseId  INTEGER,
      task      TEXT    NOT NULL,
      minutes   INTEGER NOT NULL,
      startedAt TEXT    NOT NULL,
      endedAt   TEXT    NOT NULL,
      completed INTEGER NOT NULL DEFAULT 1
    );
    CREATE INDEX IF NOT EXISTS idx_focus_sessions_endedAt ON focus_sessions(endedAt);
    CREATE TABLE IF NOT EXISTS course_events (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      courseId     INTEGER NOT NULL,
      goalId       TEXT    NOT NULL,
      courseName   TEXT    NOT NULL,
      fromStatus   TEXT    NOT NULL,
      toStatus     TEXT    NOT NULL,
      fromProgress INTEGER NOT NULL,
      toProgress   INTEGER NOT NULL,
      at           TEXT    NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_course_events_at ON course_events(at);
  `);
}

function columnsOf(table: "courses" | "goals"): string[] {
  const info = db.exec(`PRAGMA table_info(${table})`);
  return info.length ? info[0].values.map((row) => row[1] as string) : [];
}

function migrateSchema(): void {
  let dirty = false;

  const courseCols = columnsOf("courses");
  if (!courseCols.includes("progress")) {
    db.run("ALTER TABLE courses ADD COLUMN progress INTEGER NOT NULL DEFAULT 0");
    db.run("UPDATE courses SET progress = 100 WHERE status = 'Completed'");
    dirty = true;
  }
  if (!courseCols.includes("sortOrder")) {
    db.run("ALTER TABLE courses ADD COLUMN sortOrder INTEGER NOT NULL DEFAULT 0");
    // Backfill 0..n-1 per goal in rowid order (done in JS; sql.js has no window functions).
    const rows = db.exec("SELECT id, goalId FROM courses ORDER BY goalId, rowid");
    const next: Record<string, number> = {};
    for (const [id, goalId] of rows[0]?.values ?? []) {
      const g = goalId as string;
      next[g] = next[g] ?? 0;
      db.run("UPDATE courses SET sortOrder = ? WHERE id = ?", [next[g]++, id as number]);
    }
    dirty = true;
  }
  if (!courseCols.includes("updatedAt")) {
    // SQLite forbids a non-constant DEFAULT on ADD COLUMN, so add nullable then backfill.
    db.run("ALTER TABLE courses ADD COLUMN updatedAt TEXT");
    db.run(
      "UPDATE courses SET updatedAt = COALESCE(lastCompleted || 'T00:00:00.000Z', ?) WHERE updatedAt IS NULL",
      [new Date().toISOString()]
    );
    dirty = true;
  }

  const goalCols = columnsOf("goals");
  if (!goalCols.includes("targetDate")) {
    db.run("ALTER TABLE goals ADD COLUMN targetDate TEXT");
    dirty = true;
  }
  if (!goalCols.includes("startedAt")) {
    db.run("ALTER TABLE goals ADD COLUMN startedAt TEXT");
    dirty = true;
  }

  if (dirty) persist();
}

function seedIfEmpty(): void {
  const result = db.exec("SELECT COUNT(*) AS count FROM goals");
  const count = (result[0]?.values[0]?.[0] as number) ?? 0;
  if (count > 0) return;

  for (const goal of INITIAL_GOALS) {
    db.run("INSERT INTO goals (id, name, targetDate, startedAt) VALUES (?, ?, ?, ?)", [
      goal.id,
      goal.name,
      goal.targetDate,
      goal.startedAt,
    ]);
  }
  for (const course of INITIAL_COURSES) {
    insertCourse(course);
  }
}

function seedFdeGoalIfMissing(): void {
  const existing = db.exec("SELECT 1 FROM goals WHERE id = ?", [FDE_GOAL.id]);
  if (existing.length > 0) return;

  db.run("INSERT INTO goals (id, name, targetDate, startedAt) VALUES (?, ?, ?, ?)", [
    FDE_GOAL.id,
    FDE_GOAL.name,
    FDE_GOAL.targetDate,
    FDE_GOAL.startedAt,
  ]);
  for (const course of FDE_COURSES) {
    insertCourse(course);
  }
  persist();
}

function nextSortOrder(goalId: string): number {
  const result = db.exec("SELECT COALESCE(MAX(sortOrder), -1) + 1 AS n FROM courses WHERE goalId = ?", [
    goalId,
  ]);
  return (result[0]?.values[0]?.[0] as number) ?? 0;
}

function insertCourse(input: CourseInput): number {
  const sortOrder = input.sortOrder ?? nextSortOrder(input.goalId);
  const updatedAt = input.updatedAt ?? new Date().toISOString();
  db.run(
    `INSERT INTO courses
      (goalId, category, name, platform, link, status, progress, lastCompleted, timeToComplete, notes, userNote, sortOrder, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.goalId,
      input.category,
      input.name,
      input.platform,
      input.link,
      input.status,
      input.progress,
      input.lastCompleted,
      input.timeToComplete,
      input.notes,
      input.userNote,
      sortOrder,
      updatedAt,
    ]
  );
  const result = db.exec("SELECT last_insert_rowid() AS id");
  return result[0].values[0][0] as number;
}

function rowsToObjects<T>(result: ReturnType<Database["exec"]>): T[] {
  if (result.length === 0) return [];
  const { columns, values } = result[0];
  return values.map((row) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj as T;
  });
}

function rowToSession(raw: Record<string, unknown>): FocusSession {
  return {
    id: raw.id as number,
    goalId: raw.goalId as string,
    courseId: raw.courseId === null || raw.courseId === undefined ? null : (raw.courseId as number),
    task: raw.task as string,
    minutes: raw.minutes as number,
    startedAt: raw.startedAt as string,
    endedAt: raw.endedAt as string,
    completed: raw.completed === 1,
  };
}

export async function initDatabase(): Promise<void> {
  const SQL = await initSqlJs();
  dbPath = join(app.getPath("userData"), "northstar.sqlite3");

  if (existsSync(dbPath)) {
    db = new SQL.Database(readFileSync(dbPath));
    createSchema();
    migrateSchema();
  } else {
    db = new SQL.Database();
    createSchema();
    seedIfEmpty();
    persist();
  }

  seedFdeGoalIfMissing();
}

export function listGoals(): Goal[] {
  return rowsToObjects<Goal>(
    db.exec("SELECT id, name, targetDate, startedAt FROM goals ORDER BY rowid ASC")
  );
}

export function addGoal(name: string): Goal {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  let id = base || `goal-${Date.now()}`;
  let suffix = 1;
  const existingIds = new Set(listGoals().map((g) => g.id));
  while (existingIds.has(id)) {
    id = `${base}-${suffix++}`;
  }
  const startedAt = new Date().toISOString().slice(0, 10);
  db.run("INSERT INTO goals (id, name, targetDate, startedAt) VALUES (?, ?, ?, ?)", [
    id,
    name.trim(),
    null,
    startedAt,
  ]);
  persist();
  return { id, name: name.trim(), targetDate: null, startedAt };
}

export function updateGoal(id: string, patch: GoalPatch): Goal {
  const fields = Object.keys(patch) as (keyof GoalPatch)[];
  if (fields.length > 0) {
    const setClause = fields.map((field) => `${field} = ?`).join(", ");
    const values = fields.map((field) => patch[field] as string | null);
    db.run(`UPDATE goals SET ${setClause} WHERE id = ?`, [...values, id]);
    persist();
  }
  const result = rowsToObjects<Goal>(
    db.exec("SELECT id, name, targetDate, startedAt FROM goals WHERE id = ?", [id])
  );
  return result[0];
}

export function listCourses(goalId: string): Course[] {
  return rowsToObjects<Course>(
    db.exec("SELECT * FROM courses WHERE goalId = ? ORDER BY sortOrder ASC, rowid ASC", [goalId])
  );
}

export function addCourse(input: CourseInput): Course {
  const id = insertCourse(input);
  persist();
  const result = rowsToObjects<Course>(db.exec("SELECT * FROM courses WHERE id = ?", [id]));
  return result[0];
}

export function updateCourse(id: number, patch: CoursePatch): Course {
  const fields = Object.keys(patch) as (keyof CoursePatch)[];
  if (fields.length > 0) {
    const setClause = fields.map((field) => `${field} = ?`).join(", ");
    const values = fields.map((field) => patch[field] as string | number | null);
    db.run(`UPDATE courses SET ${setClause} WHERE id = ?`, [...values, id]);
    persist();
  }
  const result = rowsToObjects<Course>(db.exec("SELECT * FROM courses WHERE id = ?", [id]));
  return result[0];
}

export function deleteCourse(id: number): void {
  db.run("DELETE FROM courses WHERE id = ?", [id]);
  persist();
}

export function addSession(input: FocusSessionInput): FocusSession {
  db.run(
    `INSERT INTO focus_sessions (goalId, courseId, task, minutes, startedAt, endedAt, completed)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      input.goalId,
      input.courseId,
      input.task,
      input.minutes,
      input.startedAt,
      input.endedAt,
      input.completed ? 1 : 0,
    ]
  );
  const result = db.exec("SELECT last_insert_rowid() AS id");
  const id = result[0].values[0][0] as number;
  persist();
  const row = rowsToObjects<Record<string, unknown>>(
    db.exec("SELECT * FROM focus_sessions WHERE id = ?", [id])
  )[0];
  return rowToSession(row);
}

export function listSessions(since?: string): FocusSession[] {
  const rows = since
    ? rowsToObjects<Record<string, unknown>>(
        db.exec("SELECT * FROM focus_sessions WHERE endedAt >= ? ORDER BY endedAt ASC", [since])
      )
    : rowsToObjects<Record<string, unknown>>(
        db.exec("SELECT * FROM focus_sessions ORDER BY endedAt ASC")
      );
  return rows.map(rowToSession);
}

export function addCourseEvent(input: CourseEventInput): CourseEvent {
  db.run(
    `INSERT INTO course_events (courseId, goalId, courseName, fromStatus, toStatus, fromProgress, toProgress, at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.courseId,
      input.goalId,
      input.courseName,
      input.fromStatus,
      input.toStatus,
      input.fromProgress,
      input.toProgress,
      input.at,
    ]
  );
  const result = db.exec("SELECT last_insert_rowid() AS id");
  const id = result[0].values[0][0] as number;
  persist();
  return rowsToObjects<CourseEvent>(db.exec("SELECT * FROM course_events WHERE id = ?", [id]))[0];
}

export function listCourseEvents(since?: string): CourseEvent[] {
  return since
    ? rowsToObjects<CourseEvent>(
        db.exec("SELECT * FROM course_events WHERE at >= ? ORDER BY at ASC", [since])
      )
    : rowsToObjects<CourseEvent>(db.exec("SELECT * FROM course_events ORDER BY at ASC"));
}
