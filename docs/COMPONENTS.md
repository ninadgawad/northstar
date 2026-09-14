# Components and UI System

This document describes the React component architecture and UI patterns used in Northstar.

## Component Hierarchy

```
App
├── Sidebar
├── TopBar
│   └── GoalSwitcher
├── Main View (one of):
│   ├── DashboardView
│   │   └── CourseTable
│   ├── FocusTimerView
│   └── AdminView
│       ├── TopicForm
│       └── CourseTable
└── TaskDrawer
```

## View-Level Components

### App.tsx

The root component that manages all app state and orchestrates the other views.

**Responsibilities**:
- Fetch goals and courses from the database on mount
- Manage selected goal, active view, and focus timer state
- Pass handlers down to child components
- Render the current view based on `activeView`

**State**:
```typescript
loading: boolean
goals: Goal[]
courses: Course[]
selectedGoalId: string
activeStatus: CourseStatus | null
selectedCourseId: number | null
drawerOpen: boolean
activeView: ViewId  // "dashboard" | "focus" | "admin"
sidebarCollapsed: boolean

// Focus timer
focusPhase: FocusPhase  // "idle" | "running" | "done"
focusTaskId: number | null
focusEndAt: number | null
focusTotalMs: number
focusMessage: string
now: number  // For countdown updates
```

**Key Handlers**:
- `handleAddGoal(name)` → calls `window.api.goals.add()` and updates state
- `handleUpdateCourse(id, patch)` → applies business logic, calls API, updates state
- `handleAddCourse(input)` → calls API and updates state
- `handleDeleteCourse(id)` → calls API and removes from state
- `handleBeginFocusSession(taskId, minutes)` → starts the timer
- `handleCancelFocusSession()` → stops the timer
- `handleDismissFocusDone()` → returns to idle state

### Sidebar.tsx

Left navigation panel with collapsible support and view switching.

**Props**:
```typescript
collapsed: boolean
onToggleCollapsed: () => void
activeView: ViewId
onNavigate: (view: ViewId) => void
focusBadge: string | null  // MM:SS countdown or null
```

**Features**:
- Displays nav items for each view (Dashboard, Focus Timer, Admin)
- Shows a live MM:SS badge next to Focus Timer when a session is running
- Collapses to icon-only mode, expands to show labels
- Collapse state is persisted to localStorage

**UI Pattern**:
```tsx
NAV_ITEMS.map(({ id, label, icon }) => (
  <button
    onClick={() => onNavigate(id)}
    className={cn(
      "flex items-center gap-3 rounded-md px-2.5 py-2",
      activeView === id ? "bg-primary" : "hover:bg-accent"
    )}
  >
    <Icon />
    {!collapsed && <span>{label}</span>}
  </button>
))
```

### TopBar.tsx

Header bar with view title and optional goal switcher.

**Props**:
```typescript
title: string
goals: Goal[]
selectedGoalId: string
onSelectGoal: (goalId: string) => void
onManageGoals: () => void
showGoalSwitcher?: boolean  // Defaults to true
```

**Features**:
- Displays the current view name (Dashboard, Focus Timer, Admin)
- Shows a goal dropdown (hidden on Focus Timer view)
- Allows switching between goals
- Opens Admin view via "Manage goals" menu item

### DashboardView.tsx

Main course list with status filtering and table display.

**Props**:
```typescript
goal: Goal | undefined
courses: Course[]
activeStatus: CourseStatus | null
onToggleStatus: (status: CourseStatus) => void
onRowClick: (course: Course) => void
```

**Features**:
- Displays three status cards at the top (Not Started, In Progress, Completed)
- Shows course counts per status
- Clicking a card filters the table (click again to clear)
- Uses CourseTable for the main list
- Row clicks open TaskDrawer

**UI Layout**:
```
┌─────────────────────────────────────┐
│ Status cards (3 columns)            │
├─────────────────────────────────────┤
│ CourseTable                         │
│ (sorted, filterable, clickable)     │
└─────────────────────────────────────┘
```

### AdminView.tsx

Goal and topic management interface.

**Props**:
```typescript
goals: Goal[]
selectedGoal: Goal | undefined
courses: Course[]  // All courses (not filtered by goal)
onAddGoal: (name: string) => void
onAddCourse: (input: CourseInput) => void
onUpdateCourse: (id: number, patch: CoursePatch) => void
onDeleteCourse: (id: number) => void
```

**Features**:
- Add new goal form
- List all existing goals with topic counts
- For selected goal: add/edit/delete topics
- Uses TopicForm for add/edit flows
- Uses CourseTable to display topics

**Sections**:
1. "Add a new goal" - Input + button
2. "Existing goals" - Card list with counts
3. "Topics in [Goal]" - Full CRUD interface

### FocusTimerView.tsx

Focus session UI with three phases: idle, running, done.

**Props**:
```typescript
goals: Goal[]
courses: Course[]
phase: FocusPhase
remainingMs: number
totalMs: number
taskId: number | null
message: string
onBegin: (taskId: number, minutes: number) => void
onCancel: () => void
onDismissDone: () => void
```

**Phases**:

**Idle Phase**:
- Duration selector (4 buttons: 15, 30, 45, 60)
- Start button
- Message if no tasks available

**Running Phase**:
- Task name at top
- Large countdown ring (conic-gradient)
- MM:SS in center
- Cancel button

**Done Phase**:
- Party popper icon
- "Focus session complete!" message
- Task name
- Random encouraging message
- "Start another session" button

**Internals**:
- Maintains local state for duration and task picker
- Groups courses by goal for the dropdown
- Filters out Completed courses from selection
- Uses `useMemo` to avoid re-computing filtered/grouped courses

### TaskDrawer.tsx

Side panel for viewing and editing a single course.

**Props**:
```typescript
course: Course | null
open: boolean
onOpenChange: (open: boolean) => void
onStatusChange: (courseId: number, status: CourseStatus) => void
onProgressChange: (courseId: number, progress: number) => void
onSaveNote: (courseId: number, note: string) => void
```

**Features**:
- Displays course details (category, name, platform)
- Status buttons for quick toggling
- Progress slider (0-100%)
- Last completed date and time to complete
- Reference notes (read-only)
- User notes editor with save button
- Open source link button

**Layout**:
```
┌─────────────────────────────┐
│ Category (small badge)      │
│ Course name (large)         │
│ Platform (subtext)          │
├─────────────────────────────┤
│ Status                      │
│ [Button] [Button] [Button]  │
├─────────────────────────────┤
│ Progress slider             │
│ 45%                         │
├─────────────────────────────┤
│ Last completed / Time       │
│ About section               │
│ My notes editor             │
│ [Save note] button          │
├─────────────────────────────┤
│ [Close] [Open source]       │
└─────────────────────────────┘
```

## Table Component

### CourseTable.tsx

Reusable TanStack Table v8 component for displaying courses.

**Props**:
```typescript
courses: Course[]
activeStatus?: CourseStatus | null
onStatusClick?: (status: CourseStatus) => void
onRowClick?: (course: Course) => void
```

**Features**:
- Sortable columns (click header to sort)
- Custom status sorting (Not Started → In Progress → Completed)
- Progress bar visualization
- Clickable rows (with hover effect)
- Link column that stops propagation (doesn't trigger row click)
- Status badge with click handler (doesn't trigger row click)

**Columns**:
1. Name + Platform
2. Status (badge, clickable)
3. Progress (bar + %)
4. Last Completed (formatted date)
5. Time to Complete
6. Link (external link button)
7. Notes (truncated text)

**Styling**:
- Uses Tailwind for responsive layout
- Progress bar uses primary and secondary colors
- Hover effect on rows (if `onRowClick` provided)

## Form Component

### TopicForm.tsx

Reusable form for creating and editing courses.

**Props**:
```typescript
initial?: Course  // If provided, form is in edit mode
categories: string[]  // Suggested categories
submitLabel: string  // e.g., "Add topic" or "Save changes"
onSubmit: (values: TopicFormValues) => void
onCancel: () => void
```

**Values**:
```typescript
category: string
name: string
platform: string
link: string
status: CourseStatus
timeToComplete: string
notes: string
```

**Features**:
- Text inputs for category, name, platform, link
- Text area for notes
- Status dropdown (Not Started, In Progress, Completed)
- Duration input (e.g., "4h 30m")
- Submit and Cancel buttons
- Form validation (all fields required)

## UI Primitives

Styled components in `components/ui/` using shadcn/ui patterns:

### Button.tsx

CVA-based button with variants and sizes.

**Variants**: `default`, `outline`, `ghost`, `link`
**Sizes**: `default` (h-9), `sm` (h-8), `lg` (h-11), `icon` (h-9 w-9)

```tsx
<Button>Click me</Button>
<Button variant="outline" size="sm">Small outline</Button>
<Button size="lg" className="w-full">Full width</Button>
<Button size="icon"><Icon /></Button>
```

### Card.tsx

Container component with optional header/footer.

```tsx
<Card>
  <CardContent>Card content</CardContent>
</Card>
```

### Sheet.tsx

Slide-out panel (used for TaskDrawer).

```tsx
<Sheet open={open} onOpenChange={setOpen}>
  <SheetContent>...</SheetContent>
</Sheet>
```

### Table.tsx

Semantic table elements styled for Northstar.

```tsx
<Table>
  <TableHeader>...</TableHeader>
  <TableBody>...</TableBody>
</Table>
```

### Input.tsx, Textarea.tsx

Form inputs styled consistently.

```tsx
<Input placeholder="Enter text" />
<Textarea rows={5} />
```

### Dropdown Menu (Radix)

Used for GoalSwitcher and TopBar menus.

```tsx
<DropdownMenu>
  <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Option 1</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

## Styling System

### Design Tokens (CSS Variables)

Defined in `src/renderer/src/styles.css` and used in `tailwind.config.js`:

**Colors**:
- `--primary` - Main brand color (blue)
- `--secondary` - Light background
- `--success` - Green for completed/successful states
- `--warning` - Orange for ongoing/alert states
- `--destructive` - Red for delete/danger actions
- `--muted` - Disabled/inactive text
- `--accent` - Hover/highlight color
- `--border`, `--input`, `--ring` - Structural colors

**Usage**:
```tsx
className="bg-primary text-primary-foreground"  // Using token
className="text-success"  // Using success token
className="border border-border"  // Using border color
```

### Utility Classes

All styling uses Tailwind with custom tokens:
- **Spacing**: `px-4`, `py-2`, `gap-3` (standard Tailwind)
- **Sizing**: `w-full`, `h-9`, `size-4` (shorthand for width and height)
- **Layout**: `flex`, `grid`, `gap-2`, `items-center` (flexbox/grid)
- **Text**: `text-sm`, `font-semibold`, `text-muted-foreground` (typography)
- **Interactivity**: `hover:bg-accent`, `focus-visible:ring-1`, `cursor-pointer`
- **Responsive**: `sm:px-6`, `md:flex` (mobile-first)

### Responsive Design

Breakpoints (from Tailwind):
- Mobile (default) - 0px
- `sm` - 640px
- `md` - 768px
- `lg` - 1024px
- `xl` - 1280px
- `2xl` - 1536px (limited to 1120px in this project)

Example:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 1 column on mobile, 2 on tablet, 3 on desktop */}
</div>
```

## Best Practices

### Component Props

Keep props minimal and focused:
```tsx
// Good: clear, functional props
interface DashboardViewProps {
  goal: Goal | undefined
  courses: Course[]
  onToggleStatus: (status: CourseStatus) => void
  onRowClick: (course: Course) => void
}

// Avoid: spreading large objects
interface Props {
  data: { goal, courses, selectedId, ... }  // ❌
}
```

### State Lifting

Keep shared state high (in App.tsx) and pass down:
```tsx
// ✅ Good: App manages, passes to children
const [selectedGoal, setSelectedGoal] = useState(...)
<DashboardView goal={goals.find(...)} ... />

// ❌ Avoid: Duplication in multiple children
// Each child maintains selectedGoal independently
```

### Memoization

Use `useMemo` for expensive calculations:
```tsx
const groupedCourses = useMemo(() => {
  return courses.reduce((acc, course) => {
    // grouping logic
  }, {})
}, [courses])
```

### Event Handlers

Wrap non-trivial event handlers in `useCallback`:
```tsx
const handleStatusChange = useCallback((status: CourseStatus) => {
  onStatusChange(id, status)
  logAnalytics('status_changed', status)
}, [id, onStatusChange])
```

### Accessibility

- Use semantic HTML (`<button>`, `<a>`, `<table>`)
- Add `aria-label` to icon buttons
- Use `title` attribute for tooltips
- Test keyboard navigation (Tab, Enter, Escape)

### Styling

- Use design tokens (CSS variables), not raw colors
- Use Tailwind classes, not inline styles
- Keep `className` readable (consider breaking long chains)
- Use `cn()` for conditional classes

```tsx
// ✅ Good
className={cn(
  "rounded-md px-3 py-2 text-sm font-medium",
  isActive && "bg-primary text-primary-foreground",
  isDisabled && "opacity-50 cursor-not-allowed"
)}

// ❌ Avoid
className={"rounded-md px-3 py-2 " + (isActive ? "bg-primary" : "bg-secondary")}
```
