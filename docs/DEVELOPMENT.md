# Development Guide

This guide covers development workflow, debugging, testing, and best practices for Northstar.

## Development Workflow

### Starting Development

```bash
npm run dev
```

This:
1. Starts Electron dev server with file watching
2. Opens DevTools automatically
3. Enables hot reload for React components
4. Rebuilds main/preload on file changes

Make changes and save to see them instantly in the running app.

### Building for Production

```bash
npm run build
```

This:
1. Runs Vite to bundle main, preload, and renderer
2. Outputs to `out/` directory
3. Minifies and optimizes code
4. Checks TypeScript (if you pass `--check` to Vite)

Always run `npm run build` before committing to ensure the build is clean.

### Previewing the Build

```bash
npm run start
```

This:
1. Rebuilds from source (like `build`)
2. Launches the built app (from `out/`)
3. Good for testing the production configuration

Use this to verify the app works after building.

## Type Checking

```bash
npm run typecheck
```

Checks both `tsconfig.node.json` (main/preload) and `tsconfig.web.json` (renderer).

**Common Issues**:
- `Type 'X' does not satisfy the constraint 'Record<string, unknown>'` - Remove overly strict generic constraints
- `Cannot find name 'window'` - Make sure `tsconfig.node.json` includes `"lib": ["DOM"]`
- `Property 'api' does not exist on type 'Window'` - Check that `src/preload/api.d.ts` is included in `tsconfig.web.json`

If types seem stale:
```bash
rm tsconfig.*.tsbuildinfo
npm run typecheck
```

## Debugging

### React DevTools

Open with `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Opt+I` (macOS).

**Console Tab**:
- Log from React components: `console.log(...)`
- Check for errors and warnings
- Evaluate JavaScript expressions

**Components Tab** (if React DevTools extension installed):
- Inspect component tree
- View and edit props
- Check component state

**Sources Tab**:
- Set breakpoints in source code
- Step through execution
- Inspect variables

### Console Logging

Add temporary logs to understand flow:

```typescript
// In React components
console.log('[component-name] state changed', newValue)

// In main process
console.log('[db] writing course', course.id)

// In preload
console.log('[api] calling db:addCourse', input)
```

These appear in the DevTools console.

### Debugging IPC

To verify IPC is working:

1. Add a listener in main process (`src/main/index.ts`):
```typescript
mainWindow.webContents.on('console-message', (_event, _level, message) => {
  console.log('[renderer]', message)
})
```

2. Add logs in renderer:
```typescript
console.log('[debug] calling window.api.goals.list()')
const goals = await window.api.goals.list()
console.log('[debug] received goals:', goals)
```

3. Run `npm run dev` and check the terminal for output from both processes.

Remove these debug listeners before committing.

### Database Inspection

To inspect the SQLite database:

1. Download [DB Browser for SQLite](https://sqlitebrowser.org/)
2. Open `%APPDATA%\northstar\northstar.sqlite3` (Windows) or equivalent on macOS/Linux
3. Browse tables and execute SQL queries
4. **Important**: Stop the app first (the file is locked while running)

To reset the database:
```bash
rm %APPDATA%\northstar\northstar.sqlite3
```

The app recreates it with seed data on next launch.

## Testing

There are no automated tests set up. Testing is manual:

### Smoke Testing

After making changes:

1. `npm run typecheck` - Verify types
2. `npm run build` - Verify build succeeds
3. `npm run start` - Launch and test the feature manually

### Feature Testing

For new features:

1. **Happy path**: Does the feature work as intended?
2. **Edge cases**: What if data is missing/empty/invalid?
3. **Integration**: Does it work with other features?
4. **Database**: Verify data is persisted correctly
5. **UI**: Does it look good at different window sizes?

### Manual Test Cases

**Adding a Goal**:
1. Open Admin view
2. Enter goal name "Test Goal"
3. Click "Add goal"
4. Verify it appears in "Existing goals" list
5. Verify the dashboard switches to it
6. Check that `%APPDATA%\northstar\northstar.sqlite3` has the new goal (DB Browser)

**Adding a Course**:
1. In Admin, under the selected goal, click "Add topic"
2. Fill in form with test data
3. Click "Add topic"
4. Verify it appears in the courses table
5. Refresh (Ctrl+R) and verify it's still there (persistent)

**Focus Timer**:
1. Click Focus Timer in sidebar
2. Select a duration (15 min)
3. Click Start
4. Select a task from the dropdown
5. Click "Begin focus session"
6. Verify the countdown ring and timer display
7. Wait for completion (or kill the app and restart) and verify the completion UI shows

## Code Organization

### Where to Put New Code

**New Feature (e.g., Reports)**:
1. **Type**: Define in `src/shared/types.ts` (if shared) or in component file (if component-only)
2. **DB Layer**: Add tables/queries in `src/main/db.ts` if data needs persistence
3. **IPC**: Register handler in `src/main/index.ts` and expose in `src/preload/index.ts`
4. **Component**: Create `src/renderer/src/components/ReportsView.tsx`
5. **Integration**: Update `src/renderer/src/App.tsx` to wire in the view and state

**Utility (e.g., Formatting)**:
1. Add to `src/renderer/src/lib/utils.ts` or `src/renderer/src/utils.ts`
2. Import and use in components

**UI Primitive (e.g., Badge)**:
1. Create `src/renderer/src/components/ui/badge.tsx` using shadcn/ui patterns
2. Import and use in components

## Common Tasks

### Add a New Column to Courses

1. Update `Course` type in `src/shared/types.ts`
2. Update `CourseInput` type if appropriate
3. Add migration to `migrateSchema()` in `src/main/db.ts`:
   ```typescript
   if (!columns.includes("newColumn")) {
     db.run("ALTER TABLE courses ADD COLUMN newColumn TEXT DEFAULT ''")
     persist()
   }
   ```
4. Update `insertCourse()` to include the new column in the INSERT
5. Update `updateCourse()` if the column should be patchable
6. Update seed data if needed
7. Update components that display/edit the field

### Add a New View (e.g., Reports)

1. Update `Sidebar.tsx`:
   ```typescript
   export type ViewId = "dashboard" | "focus" | "admin" | "reports"
   const NAV_ITEMS: { id: ViewId; ... }[] = [
     // ...
     { id: "reports", label: "Reports", icon: BarChart3 },
   ]
   ```

2. Create `ReportsView.tsx` component

3. Update `App.tsx`:
   ```typescript
   const [activeView, setActiveView] = useState<ViewId>("dashboard")
   // ...
   {activeView === "reports" && <ReportsView ... />}
   ```

4. Pass necessary data as props to `ReportsView`

### Update the Database Schema

1. Add a migration function to `src/main/db.ts`:
   ```typescript
   function migrateAddNewTable(): void {
     const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'")
     const tableNames = tables.length ? tables[0].values.map(row => row[0]) : []
     if (tableNames.includes("newTable")) return
     
     db.run("CREATE TABLE newTable (...)")
     persist()
   }
   ```

2. Call it from `initDatabase()`:
   ```typescript
   migrateAddNewTable()
   ```

3. Update the seed data if the new table should have initial data

4. Add CRUD functions to expose the data

5. Test on a fresh install and an existing database

### Style a Component

Use Tailwind classes with design tokens:

```tsx
<div className="rounded-lg border border-border bg-card p-4">
  <h2 className="text-lg font-semibold text-foreground">Title</h2>
  <p className="text-sm text-muted-foreground">Subtitle</p>
</div>
```

For complex styles, consider a CSS module or inline `<style>` tag (but prefer Tailwind classes).

## Performance Tips

### React Rendering

- Use `useMemo` for expensive calculations
- Use `useCallback` for event handlers passed to children
- Consider `React.memo` for pure components that get many re-renders

Example:
```typescript
const groupedCourses = useMemo(() => groupCourses(courses), [courses])
const handleClick = useCallback(() => doSomething(id), [id])
```

### Database Queries

- Fetch data efficiently (e.g., `listCourses(goalId)` not `listCourses()` for all goals)
- Consider lazy loading for large datasets
- Don't refetch data on every render (fetch once on mount)

### Build Size

- Check what's being bundled: `npm run build` outputs size stats
- Avoid large dependencies
- Tree-shaking works automatically with Vite (import only what you need)

## Version Control

### Branch Naming

Use descriptive names:
- `feature/add-reports` - New feature
- `fix/timer-bug` - Bug fix
- `refactor/db-layer` - Refactoring
- `docs/update-readme` - Documentation

### Commit Messages

Write clear, concise messages:
```
Add reports view with goal analytics

- Fetch goal progress data from database
- Display charts with TanStack Table
- Add new ReportsView component
- Update sidebar navigation
```

### Before Pushing

```bash
npm run typecheck   # No type errors
npm run build       # Build succeeds
npm run start       # App launches and works
```

Then commit and push.

## IDE Setup

### VS Code Extensions

Recommended:
- **ES7+ React/Redux/React-Native snippets** - Quick code generation
- **Tailwind CSS IntelliSense** - Autocomplete for Tailwind classes
- **TypeScript Vue Plugin (Volar)** - Better TypeScript support (if adding Vue later)
- **SQLite** - Browse SQLite files (optional)
- **Prettier** - Code formatter (optional)

### VS Code Settings

Add to `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": false
  }
}
```

### Running from VS Code

1. Open the folder in VS Code
2. `Ctrl+`` to open terminal
3. `npm run dev` to start development server
4. Code, save, and see changes instantly

## Troubleshooting

### App won't start

1. Check for errors in terminal
2. Delete `out/` directory and rebuild: `npm run build && npm run start`
3. Check that all dependencies are installed: `npm install`

### Type errors after pulling changes

Clear build cache and rebuild:
```bash
rm tsconfig.*.tsbuildinfo
npm run typecheck
```

### Changes not appearing

1. Are you editing files in `src/`? (Not `out/`)
2. Is the dev server running? (`npm run dev`)
3. Try refreshing the app: `Ctrl+R`
4. Check DevTools console for errors

### Database seems stuck

1. Stop the app
2. Delete the database: `rm %APPDATA%\northstar\northstar.sqlite3`
3. Restart the app (it recreates with seed data)

### Build succeeds but app crashes on launch

1. Check DevTools console for errors
2. Look at the terminal for main process errors
3. Try building again: `rm out -r && npm run build`
4. Check that all IPC handlers are registered in `src/main/index.ts`
