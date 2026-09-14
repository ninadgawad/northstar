# Database

Northstar uses SQLite (via sql.js) for persistent data storage. This document describes the schema, migrations, and how to work with the database.

## Overview

- **Database Engine**: SQLite (sql.js - WASM, no native bindings)
- **Storage**: File at `<userData>/northstar.sqlite3`
- **Update Strategy**: Full file persistence after each write
- **Migration**: Idempotent schema checks on every startup
- **Seed Data**: Loaded once on first run, can be added anytime via migrations

## Schema

### Goals Table

```sql
CREATE TABLE goals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);
```

**Purpose**: Store learning goals (e.g., "Become a CTO")

**Fields**:
- `id` - Unique slug identifier (lowercase, hyphens)
  - Generated from goal name, suffixed on collision
  - Example: `become-a-cto`, `become-a-cto-1`
- `name` - User-friendly goal name
  - Example: `"Become a CTO"`

**Constraints**:
- `id` is the primary key (must be unique)
- `name` is required but not unique (can have duplicate names)

### Courses Table

```sql
CREATE TABLE courses (
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
```

**Purpose**: Store courses, books, and learning resources

**Fields**:
- `id` - SQLite auto-increment ID (immutable)
- `goalId` - Foreign key to goals table (required)
- `category` - Type of learning (e.g., "Technical Leadership")
- `name` - Course/resource title
- `platform` - Where it's hosted (e.g., "Coursera", "O'Reilly")
- `link` - URL to the resource
- `status` - One of: "Not Started", "In Progress", "Completed"
- `progress` - Integer 0-100 (percentage)
  - Auto-synced: Completed=100, Not Started=0
- `lastCompleted` - ISO date string (YYYY-MM-DD) or NULL
  - Set when marked Completed
  - Cleared when marked Not Started
- `timeToComplete` - Human-readable duration (e.g., "4h 30m", "2h")
- `notes` - Reference notes from the course provider
- `userNote` - Personal notes and reflections (editable in Task Drawer)

**Constraints**:
- `goalId` references `goals.id` (foreign key constraint)
- `status` is required but NOT validated in the DB layer
- `progress` defaults to 0
- `notes` and `userNote` default to empty string

**Examples**:

```json
{
  "id": 1,
  "goalId": "become-a-cto",
  "category": "Technical Leadership",
  "name": "Engineering Leadership: From Manager to Director",
  "platform": "LinkedIn Learning",
  "link": "https://www.linkedin.com/learning/",
  "status": "Completed",
  "progress": 100,
  "lastCompleted": "2026-02-10",
  "timeToComplete": "4h 30m",
  "notes": "Good framework for scaling a team past ~30 engineers without losing technical depth.",
  "userNote": "Great insights on delegation and building culture."
}
```

## Indexes

Currently, no explicit indexes exist. Consider adding:

```sql
CREATE INDEX idx_courses_goalId ON courses(goalId);
```

This would speed up `listCourses(goalId)` queries, but is not critical for the current data volume.

## Migrations

Migrations are handled in `src/main/db.ts` with idempotent checks.

### Adding a Column

1. Write a migration in `migrateSchema()`:

```typescript
function migrateSchema(): void {
  const info = db.exec("PRAGMA table_info(courses)");
  const columns = info.length ? info[0].values.map((row) => row[1] as string) : [];
  
  // Add priority column if missing
  if (!columns.includes("priority")) {
    db.run("ALTER TABLE courses ADD COLUMN priority INTEGER NOT NULL DEFAULT 0");
    db.run("UPDATE courses SET priority = 1");
    persist();
  }
}
```

2. Update the `Course` type in `src/shared/types.ts`
3. Update the seed data if needed
4. Update the insert/update logic in `db.ts`
5. Test on a fresh install and an existing database

### Adding Seed Data

Use the pattern in `seedFdeGoalIfMissing()`:

```typescript
function seedNewGoalIfMissing(): void {
  const existing = db.exec("SELECT 1 FROM goals WHERE id = ?", ["new-goal-id"]);
  if (existing.length > 0) return; // Already exists
  
  db.run("INSERT INTO goals (id, name) VALUES (?, ?)", ["new-goal-id", "New Goal"]);
  // Insert courses...
  persist();
}
```

Call this at the end of `initDatabase()` so it runs on every startup (fast if nothing to do).

## Working with the Database

### From TypeScript Code

Use the functions in `src/main/db.ts`:

```typescript
const goals = listGoals();
const courses = listCourses("become-a-cto");

const newGoal = addGoal("Become a Founder");
const newCourse = addCourse({
  goalId: "become-a-founder",
  category: "Business",
  name: "Lean Startup",
  platform: "O'Reilly",
  link: "https://...",
  status: "Not Started",
  progress: 0,
  lastCompleted: null,
  timeToComplete: "8h",
  notes: "...",
  userNote: "",
});

const updated = updateCourse(newCourse.id, { status: "Completed" });

deleteCourse(newCourse.id);
```

### From a SQLite Client

Download a SQLite browser (e.g., [DB Browser for SQLite](https://sqlitebrowser.org/)):

1. Open `C:\Users\[You]\AppData\Roaming\northstar\northstar.sqlite3`
2. Browse tables and data
3. Run SQL queries
4. Make direct edits (careful!)

**Important**: The app won't see changes made outside the app until restart.

### Connection String

There's no connection string — sql.js loads the entire database into memory. The file is persisted after each write via `persist()`.

## Data Integrity

### Foreign Keys

SQLite foreign key constraints are defined but not enforced by default. If you:
1. Delete a goal, its courses are orphaned (no cascading delete)
2. Use raw SQL to break the constraint, the app may crash

**Best Practice**: Always use the `db.*` functions. They maintain integrity.

### Transactions

There are no explicit transactions. Each operation (INSERT, UPDATE, DELETE, persist) is atomic from the user's perspective, but multiple operations are not wrapped in a transaction.

If you add transaction support:
```typescript
db.run("BEGIN TRANSACTION");
try {
  // multiple operations
  db.run("COMMIT");
} catch (e) {
  db.run("ROLLBACK");
  throw e;
}
```

### Cascading Deletes

Currently not implemented. If you delete a goal:
- Its courses remain in the database (orphaned)
- Queries for that goal return no courses (by `goalId` filter)
- Re-create the goal later and the courses reappear

To fix: either drop courses on delete, or add a trigger:
```sql
CREATE TRIGGER delete_courses_on_goal_delete
AFTER DELETE ON goals
FOR EACH ROW
BEGIN
  DELETE FROM courses WHERE goalId = OLD.id;
END;
```

## Backup and Recovery

### Manual Backup

Copy the database file from `%APPDATA%/northstar/northstar.sqlite3` to a safe location.

### Restore

1. Stop the app
2. Copy the backup file back to `%APPDATA%/northstar/northstar.sqlite3`
3. Restart the app

### Corrupt Database

If the `.sqlite3` file is corrupted:
1. Delete it (the app will recreate it with seed data on next launch)
2. Restart the app

All data will be lost, but the app will work again.

## Testing with the Database

### Fresh Database

Delete the `.sqlite3` file and restart:
```bash
del "%APPDATA%\northstar\northstar.sqlite3"
npm run dev
```

The app recreates the file with seed data.

### Existing Database

Run the app normally to use the existing database and any migrations.

### SQL Inspection

Before and after testing, inspect the database with a client:
```sql
SELECT COUNT(*) FROM goals;        -- Check goal count
SELECT COUNT(*) FROM courses;      -- Check course count
SELECT status, COUNT(*) FROM courses GROUP BY status;  -- Check status distribution
```

## Performance Notes

- **No explicit indexes** - Works fine for ~100 courses
- **Full-file persistence** - After each write, the entire DB is written to disk (fine for small datasets)
- **No caching** - Every read query hits SQLite (very fast in-memory)
- **Lazy loading** - Courses are fetched per-goal, not all at once

If you scale to thousands of courses:
1. Add indexes on `goalId`
2. Consider pagination (don't load all courses at once)
3. Consider incremental persistence (only write changed rows) — but sql.js doesn't support this well

## Future Improvements

1. **Timestamps** - Add `createdAt` and `updatedAt` to both tables
2. **Soft Delete** - Add `deletedAt` instead of hard deletes
3. **History** - Track changes to course status/progress
4. **Tags** - Allow tagging courses across goals
5. **Custom Fields** - User-defined metadata per course
6. **Export/Import** - SQL or CSV export/import for backup/sharing
