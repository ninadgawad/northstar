# Implementation Plan: Momentum Features

Three features that close the loop **plan → focus → log → see momentum**:

1. **Streaks & Weekly Review**: focus sessions and topic changes are recorded; the dashboard shows a "This Week" panel and a Monday recap.
2. **Goal Roadmap with Target Date & Pace**: goals get a target date, topics get an order, and a Roadmap view answers "am I on track?"
3. **Smart Focus: Next Up + Session Journaling**: the timer suggests what to work on and, when it ends, logs what you did straight into the topic.

They share a foundation, so this plan is ordered as **Phase 0 (foundation)** then **Phases 1–3 (one feature each)**. Each phase ends with `npm run typecheck && npm run build` green and the app launching against an existing database.

---

## Decisions that cut across features

| Topic | Decision | Why |
|---|---|---|
| IPC channel naming | Flat camelCase, matching the existing `db:updateCourse`: `db:updateGoal`, `db:addSession`, `db:listSessions`, `db:addCourseEvent`, `db:listCourseEvents`. Renderer sees `window.api.goals.update`, `window.api.sessions.*`, `window.api.events.*`. | Consistency with `src/main/index.ts`. |
| New columns on existing tables | Must appear in **both** `createSchema()` DDL and `migrateSchema()`. Add a `columnsOf(table)` helper so `migrateSchema()` can inspect `goals` as well as `courses`. | `initDatabase()` skips `migrateSchema()` on a fresh file, so DDL alone misses existing installs and migration alone misses new ones. |
| New tables | `CREATE TABLE IF NOT EXISTS` in `createSchema()` only. No `FOREIGN KEY` clauses. | `createSchema()` already runs on existing files; rows should survive course deletion. |
| Timestamps | Full ISO-8601 UTC strings (`toISOString()`) in SQLite. All day/week bucketing happens in the renderer in **local time** via `lib/dates.ts`. | Matches existing TEXT convention; a "daily streak" means local days. |
| `lastCompleted` bug | Fix the existing UTC-date slice (`toISOString().slice(0,10)` in `App.tsx` and `AdminView.tsx`) to use `localDayKey()` in Phase 0. | All three agents flagged it; pace math and streaks compare against local dates. |
| "Last touched" | Two sources, both kept: `courses.updatedAt` (stamped by `handleUpdateCourse` on status/progress/note changes) and `course_events` (per-transition log). Next Up ranks on `updatedAt` + last completed session; Streaks/Roadmap velocity read `course_events`. | `updatedAt` is cheap and covers notes; the event log is lossless for stats and recap text. |
| Dialog primitive | One `components/ui/dialog.tsx` built in Phase 0, reused by the recap and journal dialogs. | Two features need it; `@radix-ui/react-dialog` is already installed for `sheet.tsx`. |
| Timer state | Single unified shape in `App.tsx` (see Phase 0). Sessions are recorded by `completeFocusSession()`/`handleCancelFocusSession()`, never by the journal dialog, so Skip still counts the session. | Streaks needs the row; Smart Focus needs the binding and a double-fire guard. |
| Business logic | Stays in the renderer. `db.ts` gains only CRUD + column defaults. `handleUpdateCourse` remains the single course-mutation path and now also stamps `updatedAt` and logs `course_events`. | CLAUDE.md rule. |
| Charts | Inline SVG, no chart library. | ~60 lines; theme tokens via `hsl(var(--x))` work in SVG. |
| Reordering | Up/Down buttons, swap `sortOrder` via two `handleUpdateCourse` calls. | No deps, keyboard accessible; drag can come later. |

---

## Phase 0: Foundation

### 0.1 Shared types (`src/shared/types.ts`)

```ts
export interface Goal {
  id: string;
  name: string;
  targetDate: string | null;   // YYYY-MM-DD or null
  startedAt: string | null;    // YYYY-MM-DD or null; pace falls back to earliest completion
}
export type GoalPatch = Partial<Pick<Goal, "name" | "targetDate" | "startedAt">>;

export interface Course {
  ...existing fields...
  sortOrder: number;           // position within goal, unique per goal, 0-based
  updatedAt: string | null;    // ISO timestamp of last learning-relevant mutation
}
export type CourseInput = Omit<Course, "id" | "sortOrder" | "updatedAt"> & {
  sortOrder?: number;
  updatedAt?: string;
};
export type CoursePatch = Partial<Omit<Course, "id" | "goalId">>;   // unchanged; now includes sortOrder/updatedAt

export interface FocusSession {
  id: number;
  goalId: string;
  courseId: number | null;
  task: string;                // snapshot of course name or free text
  minutes: number;
  startedAt: string;           // ISO UTC
  endedAt: string;             // ISO UTC
  completed: boolean;
}
export type FocusSessionInput = Omit<FocusSession, "id">;

export interface CourseEvent {
  id: number;
  courseId: number;
  goalId: string;
  courseName: string;          // snapshot for recap text
  fromStatus: CourseStatus;
  toStatus: CourseStatus;
  fromProgress: number;
  toProgress: number;
  at: string;                  // ISO UTC
}
export type CourseEventInput = Omit<CourseEvent, "id">;
```

`src/shared/seed.ts`: add `targetDate: null, startedAt: null` to goal literals. Course literals need no change (`sortOrder`/`updatedAt` are optional on input).

### 0.2 Database (`src/main/db.ts`)

**DDL in `createSchema()`**

```sql
CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  targetDate TEXT,
  startedAt TEXT
);
-- courses: add
  sortOrder INTEGER NOT NULL DEFAULT 0,
  updatedAt TEXT

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
```

**Migration** (replace `migrateSchema()`):

```ts
function columnsOf(table: string): string[] {
  const info = db.exec(`PRAGMA table_info(${table})`);   // table name is a fixed literal; PRAGMA can't bind ?
  return info.length ? info[0].values.map((r) => r[1] as string) : [];
}

function migrateSchema(): void {
  let dirty = false;
  const courseCols = columnsOf("courses");
  if (!courseCols.includes("progress")) { /* existing block */ dirty = true; }
  if (!courseCols.includes("sortOrder")) {
    db.run("ALTER TABLE courses ADD COLUMN sortOrder INTEGER NOT NULL DEFAULT 0");
    // Backfill 0..n-1 per goal in rowid order, in JS (no window functions needed).
    const rows = db.exec("SELECT id, goalId FROM courses ORDER BY goalId, rowid");
    const next: Record<string, number> = {};
    for (const [id, goalId] of rows[0]?.values ?? []) {
      const g = goalId as string; next[g] = next[g] ?? 0;
      db.run("UPDATE courses SET sortOrder = ? WHERE id = ?", [next[g]++, id as number]);
    }
    dirty = true;
  }
  if (!courseCols.includes("updatedAt")) {
    db.run("ALTER TABLE courses ADD COLUMN updatedAt TEXT");   // SQLite forbids non-constant DEFAULT on ADD COLUMN
    db.run("UPDATE courses SET updatedAt = COALESCE(lastCompleted || 'T00:00:00.000Z', ?) WHERE updatedAt IS NULL",
      [new Date().toISOString()]);
    dirty = true;
  }
  const goalCols = columnsOf("goals");
  if (!goalCols.includes("targetDate")) { db.run("ALTER TABLE goals ADD COLUMN targetDate TEXT"); dirty = true; }
  if (!goalCols.includes("startedAt"))  { db.run("ALTER TABLE goals ADD COLUMN startedAt TEXT");  dirty = true; }
  if (dirty) persist();
}
```

**Function changes**

- `listGoals`: `SELECT id, name, targetDate, startedAt FROM goals ORDER BY rowid`.
- `addGoal`: insert `startedAt = today (local YYYY-MM-DD)`; return full `Goal`.
- New `updateGoal(id, patch: GoalPatch): Goal`: SET-from-keys like `updateCourse`, then re-select.
- `listCourses`: `ORDER BY sortOrder ASC, rowid ASC`.
- `insertCourse`: `sortOrder = input.sortOrder ?? nextSortOrder(goalId)` (`SELECT COALESCE(MAX(sortOrder), -1) + 1 ... WHERE goalId = ?`); `updatedAt = input.updatedAt ?? new Date().toISOString()`. `addCourse` must **re-read the row** after insert so the renderer gets DB-assigned values (otherwise `sortOrder` is `undefined` and sorting yields `NaN`).
- New `addSession(input): FocusSession`, `listSessions(since?): FocusSession[]` (`WHERE endedAt >= ? ORDER BY endedAt`), `addCourseEvent(input): CourseEvent`, `listCourseEvents(since?): CourseEvent[]`. Map `completed` INTEGER ↔ boolean in a `rowToSession` helper. Each `add*` calls `persist()`.
- `seedFdeGoalIfMissing()`: unchanged; courses get `sortOrder` 0..9 from array order.

### 0.3 IPC + preload

`src/main/index.ts`:
```ts
ipcMain.handle("db:updateGoal",       (_e, id: string, patch: GoalPatch) => db.updateGoal(id, patch));
ipcMain.handle("db:addSession",       (_e, input: FocusSessionInput) => db.addSession(input));
ipcMain.handle("db:listSessions",     (_e, since?: string) => db.listSessions(since));
ipcMain.handle("db:addCourseEvent",   (_e, input: CourseEventInput) => db.addCourseEvent(input));
ipcMain.handle("db:listCourseEvents", (_e, since?: string) => db.listCourseEvents(since));
```

`src/preload/index.ts` + `src/preload/api.d.ts` (typings live in `api.d.ts`):
```ts
goals:    { list, add, update: (id: string, patch: GoalPatch) => Promise<Goal> };
sessions: { add: (input: FocusSessionInput) => Promise<FocusSession>; list: (since?: string) => Promise<FocusSession[]> };
events:   { add: (input: CourseEventInput) => Promise<CourseEvent>;   list: (since?: string) => Promise<CourseEvent[]> };
```

### 0.4 Shared renderer libs

**`src/renderer/src/lib/dates.ts`** (new; all local-time, `setDate` arithmetic, never `+ 86400000`):
```ts
startOfLocalDay(d: Date): Date
localDayKey(d: Date): string            // "YYYY-MM-DD" from local getters (NOT toISOString)
parseIsoDate(iso: string): Date         // new Date(iso + "T00:00:00") → local midnight
addDays(d: Date, n: number): Date
startOfWeek(d: Date): Date              // Monday 00:00 local; offset = (getDay() + 6) % 7
weekKey(d: Date): string                // localDayKey(startOfWeek(d))
weeksBetween(a: Date, b: Date): number  // (b - a) / 7d, fractional, signed
interface DateRange { start: Date; end: Date }   // half-open [start, end)
thisWeekRange(now: Date): DateRange
previousWeekRange(now: Date): DateRange
inRange(iso: string, r: DateRange): boolean
formatRangeLabel(r: DateRange): string  // "Sep 7 – 13"
formatMinutes(m: number): string        // "2h 15m" / "45m"
formatRelativeDays(ms: number | null, now: number): string   // "never" | "today" | "3d ago"
```

Fix `lastCompleted` writes in `App.tsx` and `AdminView.tsx` to use `localDayKey(new Date())`.

**`src/renderer/src/components/ui/dialog.tsx`** (new primitive): mirror `sheet.tsx` (same imports, `forwardRef`, `displayName`, `cn`). Export `Dialog`, `DialogPortal`, `DialogOverlay`, `DialogContent` (`fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-background p-6 shadow-2xl` + `animate-in/out fade/zoom-95` data-state classes + absolute Close button), `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`, `DialogClose`. Always render a `DialogDescription` (Radix warns otherwise).

### 0.5 Unified timer state and `handleUpdateCourse` (`src/renderer/src/App.tsx`)

`FocusPhase` (in `FocusTimerView.tsx`) becomes `"idle" | "running" | "journal" | "done"`.

```ts
const [focusCourseId, setFocusCourseId]   = useState<number | null>(null);   // was focusTaskId
const [focusGoalId, setFocusGoalId]       = useState<string | null>(null);
const [focusTaskText, setFocusTaskText]   = useState("");                    // course name snapshot or free text
const [focusStartedAt, setFocusStartedAt] = useState<number | null>(null);   // epoch ms
const [focusMinutes, setFocusMinutes]     = useState(0);                     // planned length
const [focusEndedAt, setFocusEndedAt]     = useState<number | null>(null);   // for journal stamp
const [focusSeq, setFocusSeq]             = useState(0);                     // increments per Begin
const completedSeqRef                     = useRef(0);                       // double-fire guard
const [sessions, setSessions]             = useState<FocusSession[]>([]);
const [events, setEvents]                 = useState<CourseEvent[]>([]);
```

Initial load: `Promise.all([goals.list(), courses.list(), sessions.list(), events.list()])`. Volumes are tiny; load everything.

`recordSession(completed, endedAtMs)`: minutes = planned (`focusMinutes`) when completed, else `floor(elapsed / 60_000)`; skip abandoned sessions under 1 min; `endedAt` for a completed session is the **planned** `focusEndAt` (a laptop-sleep overrun shouldn't inflate the timestamp); `task = focusTaskText`; append the returned row to `sessions`.

`completeFocusSession()` (called from the existing tick effect): first line `if (completedSeqRef.current === focusSeq) return; completedSeqRef.current = focusSeq;`. Then, once: `playAlarm()`, pick encouragement, `setFocusEndAt(null)`, `setFocusEndedAt(plannedEnd)`, `recordSession(true, plannedEnd)`, fire `Notification` (its `onclick` only calls `window.focus()`), then `setFocusPhase(boundCourseStillExists ? "journal" : "done")`. Phase 3 supplies the journal dialog; until then treat `"journal"` like `"done"`.

`handleCancelFocusSession`: `recordSession(false, Date.now())`, set `completedSeqRef.current = focusSeq`, reset all focus fields.

`handleUpdateCourse` additions after `const updated = await window.api.courses.update(...)`:
```ts
// stamp updatedAt when the patch is learning-relevant (not for link/platform renames)
if (!("updatedAt" in finalPatch) && ("status" in patch || "progress" in patch || "userNote" in patch)) {
  finalPatch.updatedAt = new Date().toISOString();   // include before calling update
}
// log a transition event when status or progress actually changed
if (current && (current.status !== updated.status || current.progress !== updated.progress)) {
  void window.api.events.add({ courseId: id, goalId: updated.goalId, courseName: updated.name,
    fromStatus: current.status, toStatus: updated.status,
    fromProgress: current.progress, toProgress: updated.progress, at: new Date().toISOString() })
    .then((ev) => setEvents((prev) => [...prev, ev]));
}
```
`{ sortOrder }` patches pass through untouched (no status/progress keys).

`handleDeleteCourse`: if `id === focusCourseId`, set `focusCourseId = null` (timer degrades to free-text with the old name); if phase is `"journal"`, move to `"done"`.

`goalCourses`: sort by `a.sortOrder - b.sortOrder || a.id - b.id` (one `useMemo`; `CourseTable`'s initial sorting is `[]`, so it preserves this order and needs no change).

### 0.6 Phase 0 verification

- `npm run typecheck && npm run build` (delete `tsconfig.*.tsbuildinfo` if stale).
- Existing DB: launch; via the `console-message` trick, confirm `goals.list()` returns `targetDate/startedAt: null`, courses have `sortOrder` 0..n-1 per goal and non-null `updatedAt`, and `sessions.list()` returns `[]` rather than "no such table". Relaunch: migration idempotent.
- Fresh DB (rename the sqlite file): both seed goals load, FDE courses ordered 0..9.
- Timer: complete a session (temporarily add a 1-min `DURATIONS` entry) → one `focus_sessions` row; add a temporary `console.count` in `completeFocusSession` and confirm it fires once. Cancel at 30 s → no row; cancel after 2 min → `completed: 0` row.
- Change status in `TaskDrawer` → one `course_events` row; save a note only → no event, but `updatedAt` changes.

---

## Phase 1: Streaks & Weekly Review

### Files
- New: `lib/stats.ts`, `lib/recap.ts`, `components/WeekPanel.tsx`, `components/WeeklyRecapDialog.tsx`
- Modified: `App.tsx`, `components/DashboardView.tsx`, optionally `Sidebar.tsx`

### `lib/stats.ts`
```ts
interface WeekStats {
  focusMinutes: number;     // completed + abandoned sessions with endedAt in range
  sessionCount: number;     // completed only
  topicsAdvanced: number;   // distinct courseId with any forward event in range
  topicsCompleted: number;  // distinct courseId whose LATEST in-range event has toStatus "Completed"
  topicsStarted: number;    // ... toStatus "In Progress"
  currentStreak: number;
  bestStreak: number;
}
computeWeekStats(sessions, events, range: DateRange, goalId?: string): WeekStats
computeStreaks(sessions, now: Date): { current: number; best: number }
```
- **Forward event**: `rank(toStatus) > rank(fromStatus)` (NS=0, IP=1, C=2) or `toProgress > fromProgress`. Regressions are logged but don't count.
- Group in-range events by `courseId`, take the last one per course, bucket by `toStatus` (so NS→IP→C in one week counts once, as completed).
- **Streaks** (completed sessions only): `days = Set(localDayKey(endedAt))`. Current: start at today; if today isn't in the set, step back one day first (grace: not having trained *yet* today doesn't break it); count consecutive days backwards. Best: sort unique keys, walk, track longest run.
- Week = Monday 00:00 local through Sunday 23:59:59 local. A session belongs to the local day of its `endedAt`.
- Scope is global (all goals); `goalId` param exists for Roadmap reuse.

### `lib/recap.ts`
```ts
interface Recap { title: string; lines: string[]; empty: boolean }
buildRecap(sessions, events, goals, range: DateRange, streaks): Recap
```
Output: title `Week of Sep 7 – 13`; lines like `"4 focus sessions (2h 0m) — 3 on Become a FDE, 1 on Learn Rust"`, `"2 topics moved to In Progress, 1 completed: Prompt Engineering Guide"`, `"Streak: 3 days (best 5)"`. Deleted goals fall back to the id. Empty state: `empty = true`, one encouraging line.

### App.tsx
- `LAST_RECAP_WEEK_KEY = "northstar:lastRecapWeek"`; state `recapOpen`, `recapIsAuto`.
- After initial load: `if (loadJSON(LAST_RECAP_WEEK_KEY, "") !== weekKey(new Date()))` → open the recap automatically. On close of an auto recap, write the key (even if the recap is empty, so a fresh install doesn't nag). On-demand opens never touch the key.
- `weekStats = useMemo(() => computeWeekStats(sessions, events, thisWeekRange(new Date())), [sessions, events])`.
- `recap = useMemo(() => buildRecap(sessions, events, goals, previousWeekRange(now), computeStreaks(sessions, now)), ...)`.
- Render `<WeeklyRecapDialog open={recapOpen} onOpenChange={...} recap={recap} />` next to `TaskDrawer`.

### Components
- **`WeekPanel`**: `Card` titled "This Week" with `formatRangeLabel`, caption "All goals". Five tiles (`grid-cols-5`, wraps on narrow): Focus (`2h 15m`, sub `5 sessions`, `Timer` icon), Advanced, Completed (`text-success`), Streak (`Flame`, `text-warning`, "3 days"), Best. Ghost button "Weekly recap" → `onOpenRecap`. Typography matches `Summary.tsx` tiles; tokens only.
- **`WeeklyRecapDialog`**: `Dialog` with title, `recap.lines` as a list, footer "Got it".
- **`DashboardView`**: props `weekStats`, `onOpenRecap`; render `<WeekPanel>` **before** the `courses.length === 0` early return so an empty goal still shows the week.
- **`Sidebar`** (optional): `streak?: number` → small `Flame` + count above the collapse button.

### Verification
- Complete a 1-min dev session → Focus tile `1m / 1 session`, streak 1. Cancel a second after >1 min → minutes rise, session count and streak don't.
- Status NS→IP in drawer, bump progress, mark Completed → Advanced/Completed tiles update; note-only save changes nothing.
- Clear `localStorage["northstar:lastRecapWeek"]`, reload → dialog once; reload again → no dialog; button still opens it.
- Empty goal still renders the week panel.

---

## Phase 2: Goal Roadmap with Target Date & Pace

### Files
- New: `lib/pace.ts`, `components/RoadmapView.tsx`, `components/RoadmapPath.tsx`, `components/BurndownChart.tsx`
- Modified: `App.tsx`, `components/Sidebar.tsx`, `components/AdminView.tsx`

### `lib/pace.ts` (pure; `today` injectable)
```ts
type PaceStatus = "no-target" | "done" | "no-data" | "on-track" | "behind" | "overdue";
interface PaceInput { courses: Course[]; targetDate: string | null; startedAt: string | null; today?: Date }
interface PaceReport {
  total: number; completed: number; remaining: number;
  startDate: string;              // resolved reference start
  elapsedWeeks: number;
  weeksLeft: number | null;       // null without target; negative when past due
  requiredPerWeek: number | null; // remaining / weeksLeft; null without target or weeksLeft <= 0
  actualPerWeek: number;          // completed / max(elapsedWeeks, 1)
  projectedFinish: string | null; // null when actualPerWeek === 0 and remaining > 0
  behindByWeeks: number;          // >= 0
  status: PaceStatus;
}
computePace(input: PaceInput): PaceReport

interface BurndownPoint { date: string; remaining: number }
interface BurndownSeries {
  actual: BurndownPoint[];                       // (start,total) → step down per completion → (today, remaining)
  ideal: [BurndownPoint, BurndownPoint] | null;  // (start,total) → (target,0)
  projected: BurndownPoint | null;               // (projectedFinish, 0)
}
buildBurndown(input: PaceInput, report: PaceReport): BurndownSeries
```
**Formulas**
- `startDate = startedAt ?? min(lastCompleted of completed) ?? today`.
- `elapsedWeeks = max(weeksBetween(start, today), 0)`; rate denominator floored at 1 week (document in JSDoc: avoids absurd rates on day one).
- `actualPerWeek = completed === 0 ? 0 : completed / max(elapsedWeeks, 1)`. Completed courses with null `lastCompleted` count and sit at `startDate` on the burn-down.
- `weeksLeft = targetDate ? weeksBetween(today, target) : null`; `requiredPerWeek = weeksLeft > 0 ? remaining / weeksLeft : null`.
- `projectedFinish = actualPerWeek > 0 ? today + remaining/actualPerWeek weeks (ceil to days) : null`; when `remaining === 0`, latest `lastCompleted`.
- `behindByWeeks = max(0, weeksBetween(target, projectedFinish))`; overdue with no projection → `-weeksLeft`.

**Status order**: `total === 0` → `no-data` · `remaining === 0` → `done` · no target → `no-target` · `weeksLeft < 0` → `overdue` · `actualPerWeek === 0` → `no-data` (show required pace + "complete your first topic") · `projectedFinish <= target` → `on-track` else `behind`.

Uses `parseIsoDate`/`weeksBetween` from `lib/dates.ts` so today and `lastCompleted` compare on local midnight.

### App.tsx
- `VIEW_TITLES: Record<ViewId, string>` replaces the ternary; add `roadmap: "Roadmap"`.
- `handleUpdateGoal(id, patch)` → `window.api.goals.update`, replace in `goals` state.
- `handleMoveCourse(id, "up" | "down")`: find adjacent sibling in sortOrder, swap via two `handleUpdateCourse` calls (`{ sortOrder }` only). Tiebreak by id covers the transient duplicate. Guard with a `reordering` flag if double-clicks flicker.
- Render `activeView === "roadmap" && <RoadmapView goal={selectedGoal} courses={goalCourses} onTopicClick={handleRowClick} onGoToAdmin={() => setActiveView("admin")} />`.
- Pass `onUpdateGoal`, `onMoveCourse` to `AdminView`.

### Sidebar
`ViewId = "dashboard" | "roadmap" | "focus" | "admin"`; `NAV_ITEMS` gets `{ id: "roadmap", label: "Roadmap", icon: Route }` after dashboard.

### AdminView
- Goal cards: `<Input type="date">` for target date (value `goal.targetDate ?? ""`, onChange → `onUpdateGoal(id, { targetDate: value || null })`), ghost `X` to clear, and a second smaller date input for `startedAt`. Native date input yields `YYYY-MM-DD`; no conversion.
- Topic cards: step number (`index + 1`) and `ChevronUp`/`ChevronDown` icon buttons before Edit, disabled at ends. `index` is roadmap position since courses arrive sorted. Hint: order is global across categories.

### Roadmap components
- **`RoadmapView`**: `useMemo` pace + burndown. Layout: stat row (Target, Required `x.x / wk`, Actual, Projected finish) reusing `Summary` card styling; status pill (`bg-success/10 text-success` on track, `bg-warning/10 text-warning` behind by N wk, `bg-destructive/10 text-destructive` overdue, muted otherwise with a "Set a target date" link → `onGoToAdmin`); `BurndownChart` in a `Card`; `RoadmapPath`; empty state mirroring `DashboardView`.
- **`BurndownChart`**: inline `<svg viewBox>` `className="w-full h-40"`. X from `min(start, today)` to `max(target ?? projected ?? today, today)`; Y 0..total. Ideal = dashed `hsl(var(--muted-foreground))`; actual = step polyline `hsl(var(--primary))`; projected = dotted segment (warning/success); vertical "today" tick; 2–3 labels at `fontSize=10`; `<title>` for a11y. Stateless.
- **`RoadmapPath`**: ordered vertical list; numbered circle (filled `bg-success` Completed, `bg-warning` In Progress, `border` Not Started), connector line, name, category/platform, `StatusBadge`, progress; click → `onTopicClick`; first non-completed topic highlighted "Up next".

### Verification
- Set target date → required pace and status appear; clear → `no-target`. Set `startedAt` → actual pace changes.
- Reorder persists across restart; dashboard category grouping follows; no `NaN` sorting after adding a topic.
- Edge cases: zero topics; all completed; zero completions with target; past-due target; Completed with null `lastCompleted`.
- Roadmap click opens `TaskDrawer`; status changes re-render pace immediately.
- Collapsed sidebar shows the new icon and active highlight.

---

## Phase 3: Smart Focus (Next Up + Session Journaling)

### Files
- New: `lib/nextUp.ts`, `lib/journal.ts`, `components/SessionJournalDialog.tsx`
- Modified: `App.tsx`, `components/FocusTimerView.tsx`, `components/Sidebar.tsx`, `components/TaskDrawer.tsx`

### `lib/nextUp.ts`
```ts
interface NextUpItem { course: Course; lastTouchedAt: number | null }   // epoch ms
lastTouchedAt(course, sessions): number | null   // latest of updatedAt, lastCompleted (date-only), last COMPLETED session endedAt
rankNextUp(courses, sessions, opts?: { limit?: number; goalId?: string }): NextUpItem[]   // limit default 5
```
Rules: drop Completed (and other goals if `goalId`); In Progress first, sorted `lastTouchedAt` asc with null first → `progress` asc → `id`; then Not Started, `progress` asc → `lastTouchedAt` asc → `id`; slice to limit. Abandoned sessions do not count as "touched".

### `lib/journal.ts`
```ts
formatStamp(d: Date): string                                     // local "YYYY-MM-DD HH:mm"
formatSessionLine(at: Date, minutes: number, text: string): string   // "[2026-09-14 14:30, 30m] text"
appendSessionNote(existing: string, line: string): string        // trimEnd, newline-join, or just line if empty
bumpProgress(current: number, bump: number | "complete"): number // clamp 0..100
```

### `SessionJournalDialog`
Props `{ open, course: Course, minutes, endedAt: number, onSave({ text, progress: number | null }): Promise<void>, onSkip }`. Internal `text`, `bump: 0 | 5 | 10 | 25 | "complete"`, `saving`. Title "Session complete: {name}", autofocused `Input` "What did you get done?" (Enter submits), chip row `+5 / +10 / +25 / Mark completed` styled like the duration picker, live `"{from}% → {to}%"`, footer Skip / Save. Esc/overlay/X → `onSkip`. Save enabled when text or bump; `progress` null when bump is 0. Parent passes `key={endedAt}` to reset state.

### App.tsx
- `completeFocusSession` (from Phase 0) already routes to `"journal"` when the bound course exists.
- `handleSaveJournal({ text, progress })`: find current course (missing → `done`). One patch: `userNote` appended line if text, `progress` if non-null, `updatedAt` now. One `handleUpdateCourse` call (100 flips to Completed and fills `lastCompleted`). Then `done`.
- `handleSkipJournal` → `done`. `handleDismissFocusDone` clears all focus fields.
- Render `<SessionJournalDialog key={focusEndedAt ?? 0} open={focusPhase === "journal" && journalCourse !== null} ... />` after `TaskDrawer` so it stacks above the drawer; living in App, it survives navigation.
- `nextUp = useMemo(() => rankNextUp(courses, sessions), [courses, sessions])`; pass to `FocusTimerView`. Pass `focusLabel={focusTaskText}` to `Sidebar`.

### FocusTimerView
Props: `courseId`, `taskText`, `nextUp`, `now`, `onBegin({ courseId, task }, minutes)`. Idle layout: duration chips → "Next up" list (≤5 rows: name, goal, `StatusBadge`, progress, `formatRelativeDays`; click toggles selection with the `border-primary bg-primary` treatment) → `Input` "Or type what you'll work on" (typing clears selection) → "Choose a different topic" reveals the existing grouped `<select>` → Start enabled when a course is selected or text is non-empty. `running`/`journal`/`done` show `activeCourse?.name ?? taskText`; `journal` is the `done` screen minus the button. No selectable courses → free-text only.

### Sidebar
`focusLabel?: string | null` → truncated `text-[11px] opacity-80` line under "Focus Timer" in the expanded state; included in `title`.

### TaskDrawer merge (avoid clobbering a draft)
Track `baseNoteRef = useRef(course?.userNote ?? "")`. On `course.id` change: reset draft and base. On `course.userNote` change with the same id: if draft is not dirty → reset; else if `newNote.startsWith(base)` (the append case) → `setDraftNote(draft + newNote.slice(base.length))`; else reset. Always update `baseNoteRef`. `isDirty` stays `draftNote !== course.userNote`. A later drawer Save writes the union rather than overwriting the journal line.

### Verification
- Next Up ordering: oldest-touched In Progress first, then Not Started, no Completed; click binds, typing unbinds; Start gating correct in all emptiness cases.
- Navigate Dashboard → Admin during a run and at the alarm: sidebar shows countdown + topic name; alarm once; dialog appears regardless of view.
- Save text + `+10` → `userNote` ends with the stamped line, progress up, `updatedAt` refreshed, topic drops down Next Up. "Mark completed" → 100/Completed/`lastCompleted`. Skip → nothing but the session row.
- Drawer open with an unsaved draft when a session completes and is journaled → draft keeps typed text plus the new line; Save persists both.
- Delete the bound topic mid-session → timer continues with the name, no dialog at completion.

---

## Closing tasks

- Update `CLAUDE.md`: `window.api.{goals,courses,sessions,events}`; the two new tables and the rule that `course_events` are written only by `handleUpdateCourse`; `northstar:lastRecapWeek`; week/streak definitions; `roadmap` in the `ViewId` list; `lib/dates.ts`, `lib/pace.ts`, `lib/nextUp.ts`; `sortOrder` uniqueness/backfill; `updatedAt` stamping rule; the `FocusPhase` `journal` state and the `focusSeq` guard.
- Update `docs/DATABASE.md`, `docs/FEATURES.md`, `docs/COMPONENTS.md` accordingly.
- Known gap to document: a running timer is not persisted, so quitting the app mid-session loses that session.

## Suggested commit boundaries

1. `Phase 0: schema migrations, sessions/events persistence, unified timer state, dialog primitive`
2. `Phase 1: This Week panel, streaks, weekly recap`
3. `Phase 2: Roadmap view with target date, ordering, pace and burn-down`
4. `Phase 3: Next Up suggestions and end-of-session journaling`
5. `Docs: CLAUDE.md and docs/ for momentum features`
