# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Northstar is a personal learning tracker: an Electron + React + TypeScript desktop app (built with `electron-vite`) where goals contain topics/courses that you track through status, progress, notes, and focus sessions.

## Commands

```bash
npm run dev        # electron-vite dev server with HMR
npm run typecheck  # tsc against both tsconfig.node.json and tsconfig.web.json
npm run build      # bundle main/preload/renderer into out/
npm run start      # electron-vite preview (rebuilds, then launches the built app)
npm run dist       # build + electron-builder package
```

There's no test runner or linter configured. `typecheck` + `build` are the verification gate.

- If a typecheck error looks stale, delete `tsconfig.*.tsbuildinfo` (both configs are `composite`). Those files are gitignored and shouldn't be committed.
- To check runtime behavior without a display, temporarily add a `webContents.on("console-message", ...)` listener in `src/main/index.ts` that forwards renderer logs to stdout. Then run `timeout 25 npm run start`. A shorter timeout can kill esbuild mid-build and look like a build failure. Remove the listener afterwards. `Network service crashed`, `GPU process exited`, disk-cache, and `AudioContext` errors are sandbox noise, not app bugs.

## Architecture

Three processes, plus shared code that both sides import:

- **`src/shared/`**: `types.ts` holds the canonical `Goal`/`Course`/`CourseInput`/`CoursePatch` types. `seed.ts` holds the seed data. The renderer's `src/renderer/src/types.ts` just re-exports `../../shared/types`.
- **`src/main/`**: `db.ts` is the whole persistence layer. `index.ts` exposes it over `ipcMain.handle("db:*")`.
- **`src/preload/`**: exposes `window.api.{goals,courses}` via `contextBridge`. These methods are the renderer's only way to reach the database.
- **`src/renderer/`**: React UI. `@/` aliases to `src/renderer/src/`, configured in both `tsconfig.web.json` and `electron.vite.config.ts`.

### Persistence (SQLite via sql.js)

- The database is `sql.js` (WASM), not `better-sqlite3`. This is deliberate: it avoids native-module rebuilds against Electron's ABI.
- It's an in-memory DB. `persist()` writes the full file back to `<userData>/northstar.sqlite3` after every write. On Windows that's `%APPDATA%/northstar/`.
- Main-process deps are externalized (`externalizeDepsPlugin`), so `sql.js` loads its `.wasm` from `node_modules` at runtime.
- **Schema changes must ship as migrations.** Users already have a database on disk, and `CREATE TABLE IF NOT EXISTS` won't alter it. Follow the existing patterns in `initDatabase()`:
  - `migrateSchema()` checks `PRAGMA table_info` and `ALTER`s in missing columns, with a backfill.
  - `seedFdeGoalIfMissing()` is idempotent seed data that runs on every startup. Use this pattern to add seed content that should also reach existing installs.
  - `seedIfEmpty()` only runs on a brand-new file.
- `updateCourse` builds its `SET` clause from the patch keys. The DB layer applies patches without any business logic.

### Business logic lives in the renderer, not the DB

`App.tsx` owns all app state (goals, courses, selection, drawer, focus timer) and passes handlers down. **`handleUpdateCourse` is the only correct way to mutate a course.** It keeps `status` ↔ `progress` in sync:
- Completed forces progress to 100, and Not Started forces 0.
- Progress at 100 or 0 flips the status to Completed or Not Started. Anything in between sets In Progress.
- It also auto-fills or clears `lastCompleted` to match.

Calling `window.api.courses.update` directly bypasses all of that. Always go through the handler. It returns the updated `Course`.

Where state is stored:
- **SQLite**: goals, courses (including `userNote` and `progress`).
- **`localStorage`**: UI-only preferences under `northstar:*` keys (selected goal, sidebar collapsed, the one-shot "switch to FDE goal" flag).

### UI layer

- **Primitives**: `components/ui/` holds hand-written shadcn/ui-style primitives built on Radix + `class-variance-authority` + `cn()`. There's no shadcn CLI or `components.json`. Add new primitives by hand in the same style.
- **Theming**: colors are CSS-variable HSL tokens in `styles.css`, mapped in `tailwind.config.js` (includes custom `success`/`warning`/`destructive`). Use the tokens, not raw Tailwind colors. Animations come from `tailwindcss-animate`.
- **Tables**: TanStack Table is pinned to **v8** (`useReactTable`, `ColumnDef`). v9 has a different API, so don't upgrade casually.
- **Views**: `Sidebar`'s `ViewId` (`dashboard` | `focus` | `admin`) drives which view `App.tsx` renders. Adding a view means extending `ViewId`, `NAV_ITEMS`, the title mapping, and the render switch in `App.tsx`.
- **Focus Timer**: its state (phase, task, end time) lives in `App.tsx` rather than `FocusTimerView`, so a running session survives navigation and drives the sidebar's live badge. The alarm uses Web Audio oscillators (`lib/sound.ts`), and notifications use the DOM `Notification` API.
- **Click handling**: `CourseTable` rows open `TaskDrawer`. The status badge (which toggles the status filter) and the link cell both call `stopPropagation`, so clicking them doesn't also open the drawer.

## Gotchas

- **Preload typings**: the `window.api` declarations are in `src/preload/api.d.ts`, not `index.d.ts`. TypeScript silently skips a `.d.ts` file when a `.ts` file with the same basename sits next to it.
- **`tsconfig.node.json` includes the `DOM` lib**: the preload script touches `window`.
- **Goal IDs are slugs**: `addGoal` slugifies the name and suffixes on collision. Course IDs are SQLite rowids.
