# Features

Northstar provides a complete learning tracker with goal management, course tracking, progress monitoring, and focused work sessions.

## Goals

### Create a Goal

1. Navigate to **Admin** view
2. In the "Add a new goal" section, enter a goal name (e.g., "Become a CTO")
3. Click **Add goal**
4. The new goal appears in the "Existing goals" list
5. The dashboard automatically switches to the new goal

**Goal ID Generation:**
- Goal names are converted to slugs (lowercase, hyphens)
- If a slug already exists, a suffix is added (e.g., `become-a-cto-1`)

### Switch Active Goal

1. Click the **Goal Switcher** dropdown in the top bar
2. Select a different goal
3. The dashboard updates to show courses for that goal
4. Your selection is saved to localStorage

### Manage Goals

- **View all goals** - See goal count and topic count in the Admin view
- **Delete topics** - Remove courses from a goal (done via topic management, see below)
- **Rename a goal** - Not currently supported (would require a database migration)

## Topics (Courses)

A "topic" is a course, book, or learning resource you're tracking. Each topic belongs to exactly one goal.

### Topic Structure

Each topic has:
- **Category** - Type of learning (e.g., "Technical Leadership", "Cloud & Systems")
- **Name** - Title of the course/resource
- **Platform** - Where it's hosted (e.g., "Coursera", "LinkedIn Learning")
- **Link** - URL to the resource
- **Status** - One of: Not Started, In Progress, Completed
- **Progress** - Percentage (0-100%, auto-synced with status)
- **Time to Complete** - Estimated duration (e.g., "4h 30m")
- **Notes** - Reference notes about the topic
- **User Note** - Your personal notes and reflections
- **Last Completed** - Date when last marked as completed

### Create a Topic

1. Navigate to **Admin** view
2. Under "Topics in [Goal Name]", click **Add topic**
3. Fill in the form:
   - Category (free text or existing category)
   - Name, Platform, Link
   - Status (Not Started, In Progress, Completed)
   - Time to Complete (e.g., "6h" or "2h 30m")
   - Notes (reference material about this topic)
4. Click **Add topic**

**Progress Auto-Sync:**
- Selecting "Completed" sets progress to 100%
- Selecting "Not Started" sets progress to 0%
- Selecting "In Progress" leaves progress unchanged (or sets to 50% if unset)

### Edit a Topic

1. In Admin view, find the topic card
2. Click the **Edit** (pencil) icon
3. Update the form
4. Click **Save changes**

Changes are immediately persisted to SQLite.

### Delete a Topic

1. In Admin view, find the topic card
2. Click the **Delete** (trash) icon
3. The topic is immediately removed

No confirmation dialog (be careful!).

## Dashboard View

The Dashboard shows all topics for the active goal in a table.

### Course Table

**Columns:**
- Course name and platform
- Status badge (Not Started, In Progress, Completed)
- Progress bar with percentage
- Last completed date
- Time to complete
- Link to resource
- Reference notes

**Sorting:**
Click any column header to sort (default: unsorted). Status has a custom order:
- Not Started (0)
- In Progress (1)
- Completed (2)

**Row Click:**
Click a row to open the **Task Drawer** on the right side.

### Status Filter

Three cards at the top show status counts:
- **Not Started** - Courses you haven't begun
- **In Progress** - Courses you're currently learning
- **Completed** - Finished courses

Click a status card to filter the table to show only that status. Click again to clear the filter.

## Task Drawer

Opens from the right side when you click a course row.

### View Details

Shows:
- Category (badge at top)
- Course name and platform
- Status buttons (Not Started, In Progress, Completed)
- Progress slider (0-100%)
- Last completed date and time to complete
- Reference notes
- Link to open the resource

### Update Status

1. Click one of the three status buttons (Not Started, In Progress, Completed)
2. Status updates immediately
3. Progress auto-syncs:
   - Completed → 100%
   - Not Started → 0%
   - In Progress → no change (or 50% if unset)
4. **lastCompleted** date is auto-filled when marked Completed, cleared when marked Not Started

### Track Progress

1. Use the **Progress** slider (0-100%)
2. Slide left to decrease, right to increase
3. Update releases on mouse/touch release
4. Progress auto-syncs status:
   - ≥100% → Completed
   - ≤0% → Not Started
   - 1-99% → In Progress

### Add Notes

1. Scroll to the **My notes** section
2. Click the text area and type your reflections
3. Click **Save note** when done
4. Notes are persisted to the database immediately

### Open Resource

Click **Open source** button to open the course link in your default browser.

### Close Drawer

Click the **Close** button or click outside the drawer to close it.

## Focus Timer

A dedicated feature for timed work sessions with alarm notification.

### Start a Session

1. Navigate to **Focus Timer** view (sidebar icon)
2. Select a duration: **15**, **30**, **45**, or **60** minutes
3. Click **Start**
4. A modal appears asking "What are you focusing on for N minutes?"
5. Select a task from the dropdown (grouped by goal)
   - Only "Not Started" and "In Progress" tasks appear
   - "Completed" tasks are hidden
6. Click **Begin focus session**

### During a Session

**Display:**
- Shows task name at the top
- Large conic-gradient countdown ring
- MM:SS timer in the center
- **Cancel session** button to abort

**Timer:**
- Counts down every second
- Ring fills as time elapses
- No user input (timer is read-only)

**Other Sections:**
- You can navigate to Dashboard or Admin while a session is running
- The sidebar shows a live MM:SS badge next to the Focus Timer icon
- Clicking Focus Timer returns you to the session (it doesn't reset)

### Session Complete

When time expires:
- **Alarm plays** - Three-tone chime (Web Audio)
- **Notification** - OS notification (if permission granted)
- **UI shows completion screen** with:
  - Party popper icon
  - "Focus session complete!"
  - Task name
  - Random encouraging message
  - **Start another session** button

**Encouraging Messages:**
Randomly chosen from a list, e.g.:
- "Nice work! That focused block adds up more than you think."
- "Session complete — you showed up and did the work. That's the whole game."
- "Great focus! Small consistent sessions beat rare heroic ones."
- And 5 more...

### Dismiss and Reset

Click **Start another session** to:
- Reset the timer UI
- Return to the idle state
- Prepare for another session

## Progress Percentage

Every topic has a **progress** field (0-100) that's kept in sync with status.

### How It Works

**Setting via Status:**
- Completed → progress = 100
- Not Started → progress = 0
- In Progress → progress unchanged

**Setting via Slider:**
- Drag the progress slider in the Task Drawer
- progress ≥ 100 → status = Completed
- progress ≤ 0 → status = Not Started
- progress 1-99 → status = In Progress

**Display:**
- Progress bar in the course table shows percentage
- Slider in the Task Drawer shows exact percentage
- Both are kept in sync automatically

### Smart Sync

The sync logic in `App.tsx` (`handleUpdateCourse`) ensures:
- You can control progress via the slider
- You can control progress via the status buttons
- Either way, the other field updates to stay consistent
- If you explicitly set both (e.g., `status = "Completed", progress = 50`), both are preserved

## Seed Data

New installs come with two goals pre-loaded:

### "Become a CTO" Goal (15 courses)

Includes courses in:
- Technical Leadership
- Cloud & Systems Architecture
- Business & Finance
- People Management
- Strategy & Innovation

Example topics: "AWS Solutions Architect", "Designing Data-Intensive Applications", "Radical Candor"

### "Become a FDE" Goal (10 courses)

Forward Deployed Engineer learning path with courses in:
- FDE Fundamentals
- Data & Analytics Engineering
- Systems & Architecture
- Applied AI Engineering
- Client & Communication Skills

Example topics: "dbt Fundamentals", "AI Agents in LangGraph", "Technical Writing One"

All seed courses start with:
- Status: Not Started
- Progress: 0%
- Real, verified URLs to actual courses

## Sidebar

Left navigation panel with collapsible behavior.

### Views

- **Dashboard** - View and filter courses
- **Focus Timer** - Run timed focus sessions
- **Admin** - Manage goals and topics

### Collapse/Expand

- Click the **Collapse** button to hide labels (icons only)
- Click the **Expand** button (or the toggle icon) to show labels again
- State is saved to localStorage

### Focus Timer Badge

- When a session is running, a small dot appears next to the Focus Timer icon
- When expanded, the badge shows the live MM:SS countdown
- Provides at-a-glance awareness of an active session from any view

## Preferences (localStorage)

Your preferences are saved locally and persist across sessions:

- **Selected Goal** - Which goal is currently active (key: `northstar:selectedGoal`)
- **Sidebar State** - Expanded or collapsed (key: `northstar:sidebarCollapsed`)
- **FDE Goal Flag** - Whether you've seen the new FDE goal (one-time flag)

These are stored in browser localStorage, not the database.

## Database File Location

The SQLite database is stored in:
- **Windows**: `C:\Users\[YourName]\AppData\Roaming\northstar\northstar.sqlite3`
- **macOS**: `~/Library/Application Support/northstar/northstar.sqlite3`
- **Linux**: `~/.config/northstar/northstar.sqlite3`

You can browse/modify it with any SQLite client, but changes made outside the app won't appear in the UI until you restart.
