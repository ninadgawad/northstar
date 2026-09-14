# Architecture

This document describes the high-level architecture and design decisions in Northstar.

## System Overview

Northstar is a three-process Electron application with a clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                    Main Process (Node.js)                │
│  - App lifecycle and window management                   │
│  - SQLite database access and persistence                │
│  - IPC request handling (db:*)                           │
└──────────────────────┬──────────────────────────────────┘
                       │ IPC (preload bridge)
┌──────────────────────┴──────────────────────────────────┐
│               Preload Script (Electron)                  │
│  - Exposes window.api to renderer                        │
│  - Types: window.api.goals.*, window.api.courses.*       │
│  - Security boundary                                      │
└──────────────────────┬──────────────────────────────────┘
                       │ React (event handlers)
┌──────────────────────┴──────────────────────────────────┐
│           Renderer Process (React)                       │
│  - UI components and state management                    │
│  - User interactions                                      │
│  - localStorage for UI preferences                       │
└─────────────────────────────────────────────────────────┘
```

## Data Flow

### Reading Data

1. **Component** calls handler (e.g., `handleLoadGoals()`)
2. **Handler** calls `window.api.goals.list()`
3. **Preload** invokes `ipcRenderer.invoke("db:listGoals")`
4. **Main Process** executes `db.listGoals()`
5. **DB Layer** queries SQLite and returns data
6. **Response** bubbles back through the chain
7. **Component** updates React state with new data

### Writing Data

1. **Component** calls handler (e.g., `handleAddGoal(name)`)
2. **Handler** validates/transforms the input
3. **Handler** calls `window.api.goals.add(name)`
4. **Preload** invokes `ipcRenderer.invoke("db:addGoal", name)`
5. **Main Process** executes `db.addGoal(name)`
6. **DB Layer** executes INSERT, then `persist()` writes SQLite file
7. **Response** contains the created `Goal` object
8. **Handler** updates React state with the new goal

## Core Modules

### `src/shared/` - Shared Types and Seed Data

**Files:**
- `types.ts` - Canonical TypeScript interfaces for `Goal`, `Course`, `CourseInput`, `CoursePatch`
- `seed.ts` - Initial data (CTO goal with 15 courses, FDE goal with 10 courses)

**Purpose:**
- Type safety across process boundaries
- Single source of truth for data structure
- Both main and renderer import these

### `src/main/db.ts` - SQLite Persistence Layer

**Schema:**
```sql
goals (id TEXT PRIMARY KEY, name TEXT)
courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  goalId TEXT (FK → goals.id),
  category, name, platform, link,
  status, progress, lastCompleted, timeToComplete,
  notes, userNote
)
```

**Key Functions:**
- `initDatabase()` - Initializes DB on app start, handles migrations
- `listGoals()`, `addGoal(name)`, `listCourses(goalId)` - Goal/course queries
- `addCourse(input)`, `updateCourse(id, patch)`, `deleteCourse(id)` - CRUD for courses
- `persist()` - Writes the in-memory DB back to disk (sql.js only)

**Design Notes:**
- No business logic here. This is purely a data access layer.
- Patches are applied as-is without validation or derived fields.
- Migrations run on every startup (idempotent checks with `PRAGMA`).

### `src/main/index.ts` - Electron Main Process

**Responsibilities:**
- Create and manage the app window
- Register IPC handlers via `ipcMain.handle("db:*", ...)`
- Initialize the database on app ready
- Handle app lifecycle (quit, activate)

**IPC Handlers:**
Each `db:*` handler is a thin wrapper around the `db.*` function.

### `src/preload/index.ts` - IPC Bridge

**Exports:**
```typescript
window.api = {
  goals: {
    list(): Promise<Goal[]>,
    add(name: string): Promise<Goal>,
  },
  courses: {
    list(goalId: string): Promise<Course[]>,
    add(input: CourseInput): Promise<Course>,
    update(id: number, patch: CoursePatch): Promise<Course>,
    remove(id: number): Promise<void>,
  }
}
```

**Security:**
- Runs in a sandboxed context with `contextBridge`
- Exposes only the functions needed by the renderer
- No direct filesystem or system access

### `src/preload/api.d.ts` - TypeScript Definitions

Declares the `window.api` type for the renderer. Must be named `api.d.ts` (not `index.d.ts`) because TypeScript skips `.d.ts` files that sit next to `.ts` files with the same name.

### `src/renderer/src/App.tsx` - React App Container

**State Management:**
All app state lives here, passed down as props:
- Goals and courses (fetched from DB on mount)
- Selected goal, selected course
- View mode (dashboard, focus, admin)
- Focus timer state (phase, remaining time, task)
- UI preferences (sidebar collapsed)

**Handlers:**
Every data mutation goes through a handler that:
1. Transforms/validates the input
2. Calls the appropriate `window.api.*` function
3. Updates React state with the response
4. Handles errors gracefully

**Key Handlers:**
- `handleAddGoal(name)` - Creates a goal and updates state
- `handleUpdateCourse(id, patch)` - Applies business logic (status ↔ progress sync), calls API, updates state
- `handleBeginFocusSession(taskId, minutes)` - Starts a focus timer, manages countdown loop
- `handleCancelFocusSession()`, `handleDismissFocusDone()` - Timer cleanup

### `src/renderer/src/components/` - React Components

**View Components:**
- `Sidebar.tsx` - Left navigation with collapsible state and focus timer badge
- `TopBar.tsx` - Header with title and goal switcher
- `DashboardView.tsx` - Main course list with status filters
- `AdminView.tsx` - Goal and topic management
- `FocusTimerView.tsx` - Focus session UI (idle, running, done states)
- `TaskDrawer.tsx` - Side panel for viewing/editing a course

**Utility Components:**
- `CourseTable.tsx` - TanStack Table v8 for course list display
- `TopicForm.tsx` - Reusable form for adding/editing courses
- `GoalSwitcher.tsx` - Dropdown menu for switching active goal
- `StatusBadge.tsx` - Visual indicator for course status

**UI Primitives (`components/ui/`):**
Hand-written shadcn/ui-style components:
- `button.tsx` - CVA-based button variants (default, outline, ghost, link) and sizes (default, sm, lg, icon)
- `card.tsx`, `sheet.tsx`, `textarea.tsx`, `input.tsx`, `table.tsx`, `dropdown-menu.tsx`

All use `class-variance-authority` for variant logic and are styled with Tailwind.

### `src/renderer/src/lib/` - Utilities

- `sound.ts` - Web Audio API for alarm beeps (three-tone chime)
- `encouragement.ts` - Random encouraging messages for focus session completion
- `utils.ts` - `cn()` for class merging, `formatCountdown()` for MM:SS, etc.

## Key Design Decisions

### Why sql.js?

- **No native rebuild needed** - electron-better-sqlite3 requires recompiling against Electron's ABI
- **Portable** - Bundled WASM module, no external binary dependencies
- **Sufficient** - Single-user app with modest data volume doesn't need a C++ implementation

### Why Business Logic in the Renderer?

- **UI is stateful** - Status/progress sync, focus timer state, view switching
- **Simpler main process** - DB layer stays thin and testable
- **Faster iteration** - No IPC round-trip for simple validations

### Why localStorage for UI Preferences?

- **Not critical data** - Preferences don't need backup/sync
- **Lower latency** - No IPC call for every UI state change
- **Clear separation** - Business data (SQLite) vs. UX data (localStorage)

### Why TanStack Table v8 (Not v9)?

- **Stable API** - v9 lacks documentation and has breaking changes
- **Sufficient** - No complex features needed beyond sorting/filtering
- **Proven** - Works well with our component patterns

## Extension Points

### Adding a New View

1. Add a `ViewId` type to `Sidebar.tsx` (e.g., `type ViewId = "dashboard" | "reports" | "admin"`)
2. Add the nav item to `NAV_ITEMS` in `Sidebar.tsx`
3. Add a handler in `App.tsx` (e.g., `setActiveView("reports")`)
4. Create the component (e.g., `ReportsView.tsx`)
5. Add a render branch in `App.tsx` (e.g., `{activeView === "reports" && <ReportsView ... />}`)

### Adding a New Data Type

1. Define the type in `src/shared/types.ts`
2. Create the table in `createSchema()` in `src/main/db.ts`
3. Implement CRUD functions in `db.ts` (e.g., `addReport()`, `listReports()`)
4. Register IPC handlers in `src/main/index.ts`
5. Expose in the preload API (`src/preload/index.ts`)
6. Update `api.d.ts` with the new API shape
7. Use in React components via `window.api.*`

### Adding a Complex Feature

1. **Plan state** - Where does it live? (App.tsx, localStorage, SQLite?)
2. **Plan data** - New tables? New columns? Migrations?
3. **Plan UI** - New components? Existing component changes?
4. **Plan API** - New IPC handlers? New window.api methods?
5. **Test** - `npm run build` and launch to verify

## State Management Philosophy

- **SQLite** = persistent business data (goals, courses, progress)
- **React state in App.tsx** = current UI state and derived data
- **localStorage** = UI-only preferences (selected goal, sidebar state)
- **Component state** = transient UI state (form inputs, dropdowns)

Never use component state for data that should survive a page reload. Never use SQLite for data that's just temporary (e.g., current form input).

## Performance Notes

- **Lazy goal loading** - Courses are fetched per-goal, not all at once
- **Memoization** - CourseTable and groupByGoal use useMemo to avoid re-renders
- **No polling** - Data is fetched once on mount, updated on mutations
- **Focus timer** - Uses a 1-second interval (not animation frame) to update MM:SS display
