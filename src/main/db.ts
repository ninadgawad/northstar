import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { app } from "electron";
import initSqlJs, { type Database } from "sql.js";
import { FDE_COURSES, FDE_GOAL, INITIAL_COURSES, INITIAL_GOALS } from "../shared/seed";
import type { Course, CourseInput, CoursePatch, Goal } from "../shared/types";

let db: Database;
let dbPath: string;

function persist(): void {
  writeFileSync(dbPath, Buffer.from(db.export()));
}

function createSchema(): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL
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
      FOREIGN KEY (goalId) REFERENCES goals(id)
    );
  `);
}

function migrateSchema(): void {
  const info = db.exec("PRAGMA table_info(courses)");
  const columns = info.length ? info[0].values.map((row) => row[1] as string) : [];
  if (!columns.includes("progress")) {
    db.run("ALTER TABLE courses ADD COLUMN progress INTEGER NOT NULL DEFAULT 0");
    db.run("UPDATE courses SET progress = 100 WHERE status = 'Completed'");
    persist();
  }
}

function seedIfEmpty(): void {
  const result = db.exec("SELECT COUNT(*) AS count FROM goals");
  const count = (result[0]?.values[0]?.[0] as number) ?? 0;
  if (count > 0) return;

  for (const goal of INITIAL_GOALS) {
    db.run("INSERT INTO goals (id, name) VALUES (?, ?)", [goal.id, goal.name]);
  }
  for (const course of INITIAL_COURSES) {
    insertCourse(course);
  }
}

function seedFdeGoalIfMissing(): void {
  const existing = db.exec("SELECT 1 FROM goals WHERE id = ?", [FDE_GOAL.id]);
  if (existing.length > 0) return;

  db.run("INSERT INTO goals (id, name) VALUES (?, ?)", [FDE_GOAL.id, FDE_GOAL.name]);
  for (const course of FDE_COURSES) {
    insertCourse(course);
  }
  persist();
}

function insertCourse(input: CourseInput): number {
  db.run(
    `INSERT INTO courses
      (goalId, category, name, platform, link, status, progress, lastCompleted, timeToComplete, notes, userNote)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
  return rowsToObjects<Goal>(db.exec("SELECT id, name FROM goals ORDER BY rowid ASC"));
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
  db.run("INSERT INTO goals (id, name) VALUES (?, ?)", [id, name.trim()]);
  persist();
  return { id, name: name.trim() };
}

export function listCourses(goalId: string): Course[] {
  return rowsToObjects<Course>(
    db.exec("SELECT * FROM courses WHERE goalId = ? ORDER BY rowid ASC", [goalId])
  );
}

export function addCourse(input: CourseInput): Course {
  const id = insertCourse(input);
  persist();
  return { id, ...input };
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
