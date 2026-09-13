# Northstar

Learn with purpose. Build with intention. Move toward your North Star.

A personal learning & growth tracker, now a TypeScript desktop app (Electron
+ React) built with `electron-vite`, styled with Tailwind CSS and shadcn/ui
components, icons from lucide-react, and course tables powered by
TanStack Table. Data lives in a real SQLite database (via `sql.js`, so no
native module rebuild is required) stored in the app's user data
directory, and is managed entirely over Electron IPC — the renderer never
touches the filesystem directly.

## Features

- Path: → Learning roadmap
- Focus → What you're learning now
- Progress → Course completion
- Tasks → Actions to apply what you learned
- Insights → Notes and reflections
- Momentum → Consistency over time

This is v1: synthetic data (goal: "Become a CTO"), no accounts, no email
integration.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build   # bundle main/preload/renderer
npm run dist    # package as a distributable desktop app
```

## Structure

- `src/shared` — types (`Goal`, `Course`, ...) and the first-run seed data,
  used by both the main and renderer processes
- `src/main` — Electron main process
  - `src/main/index.ts` — creates the app window and registers IPC handlers
  - `src/main/db.ts` — the SQLite layer (`sql.js`): schema, seeding, and all
    goal/course CRUD; persists to `<userData>/northstar.sqlite3`
- `src/preload` — preload script exposing `window.api.{goals,courses}` (typed
  in `src/preload/api.d.ts`) over `ipcRenderer.invoke`
- `src/renderer` — the React + TypeScript UI
  - `src/renderer/src/components` — `Sidebar` (collapsible nav), `TopBar` +
    `GoalSwitcher` (goal dropdown), `DashboardView`, `AdminView` (add goals,
    add/edit/delete topics via `TopicForm`), `CategorySection`, `CourseTable`
    (TanStack Table), `StatusBadge`, `TaskDrawer`
  - `src/renderer/src/components/ui` — shadcn/ui primitives (Button, Badge,
    Card, Table, Sheet, DropdownMenu, Input, Textarea)
  - `src/renderer/src/lib/utils.ts` — `cn()` class-merging helper
  - `tailwind.config.js` — design tokens (colors, radius) as CSS variables
    in `src/renderer/src/styles.css`

Course notes ("My notes" in the task drawer) and status changes are written
straight to SQLite; UI-only preferences (selected goal, sidebar collapsed
state) stay in `localStorage`.
