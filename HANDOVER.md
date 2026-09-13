# Handover: Northstar (formerly "Nebula")

## What this is

A personal learning/task tracker. v1 is a static page (no build step, no
auth, no email integration) showing courses/books/certs the user is working
through toward a stated goal, grouped by skill category, with a summary
stats bar at top.

Originally built under the name **Nebula**, then the user asked to rename
it to **Northstar** and move it out of the `localable` repo into its own
repo, `ninadgawad/northstar`.

## Current state (as of end of this session)

### 1. Original build — done, but sitting in the wrong repo

Nebula v1 was built and committed inside `ninadgawad/localable` (an
unrelated Electron LAN-chat app repo) under `nebula/`, on branch
`claude/zealous-dijkstra-vwzmwl`, commit `06d2a2b` ("Add Nebula v1: personal
learning tracker with synthetic CTO-track data"). That branch has an open
PR: https://github.com/ninadgawad/localable/pull/3

**That commit is the canonical source for the file contents** (before the
Nebula→Northstar rename) if you need to re-fetch them:
```
git fetch origin claude/zealous-dijkstra-vwzmwl
git show 06d2a2b:nebula/index.html
git show 06d2a2b:nebula/styles.css
git show 06d2a2b:nebula/script.js
git show 06d2a2b:nebula/data.js
git show 06d2a2b:nebula/README.md
```

### 2. Rename to Northstar — done locally, NOT yet pushed anywhere

All references to "Nebula"/`NEBULA_*` were renamed to "Northstar"/`NORTHSTAR_*`:
- `<title>`, `.brand` text, README heading → "Northstar"
- JS constants `NEBULA_GOAL` → `NORTHSTAR_GOAL`, `NEBULA_COURSES` → `NORTHSTAR_COURSES`
- README's `npx serve nebula` → `npx serve .` (since in the new repo the files sit at repo root, not in a subfolder)

The renamed files were **not committed to git anywhere** — they only existed
as loose files in this session's ephemeral sandbox and were handed to the
user directly (as a zip via file-send, and then as inline PowerShell
`Set-Content` here-string blocks, since the zip download wasn't working for
them). **Assume that content does not exist anywhere durable yet** unless
the user confirms they ran the PowerShell blocks and pushed.

### 3. New repo `ninadgawad/northstar` — exists, but empty

- Repo already exists on GitHub with just an auto-generated `README.md` and
  `LICENSE` (user must have created it via the GitHub web UI).
- **Blocker hit this session:** the Claude GitHub App does not have push
  access to this repo (`create_repository` also failed with the same
  permission issue — 403 "Resource not accessible by integration"). Read
  access worked fine (could clone).
- User was given steps to grant access (installing/configuring the Claude
  GitHub App for that repo, or reconnecting the GitHub connector at
  claude.ai), but as of the last check in this session, push was **still
  refused**. Unknown whether they've since fixed it — re-test with:
  ```
  git clone https://github.com/ninadgawad/northstar
  cd northstar
  git push --dry-run origin main
  ```
- Given the friction, we pivoted to **having the user push manually from
  their own Windows machine** (they're already authenticated there), rather
  than waiting on the GitHub App permission fix.

### 4. User's local environment

- Windows machine, working in **PowerShell** (not cmd — this caused some
  confusion mid-session, e.g. `%USERPROFILE%`/`Expand-Archive` mismatches).
- Their local path: `C:\Users\ninad\claudeworkspace\sept\northstar`
- They had already run `git clone https://github.com/ninadgawad/northstar.git`
  into that folder.
- Last known state: they were about to run the PowerShell `Set-Content`
  blocks to recreate `index.html`, `styles.css`, `script.js`, `data.js`,
  `README.md` locally, then commit + push. **Unconfirmed whether they
  finished this.**

## Immediate next steps (in priority order)

1. **Ask the user directly** whether they finished creating the 5 files
   locally and pushed to `origin/main` on `ninadgawad/northstar`. Don't
   assume — the session ended mid-troubleshooting.
2. If not done yet, resume from wherever they left off:
   - Confirm all 5 files exist in
     `C:\Users\ninad\claudeworkspace\sept\northstar` with correct content
     (see file contents below or regenerate from the `nebula/` commit above
     + the rename rules in section 2).
   - `git add .`
   - `git commit -m "Add Northstar v1: personal learning tracker with synthetic CTO-track data"`
   - `git push origin main`
   - `git checkout -b v0.0.1`
   - `git push -u origin v0.0.1`
   - `git checkout main`
3. **Once Northstar is confirmed live** on `main` (and `v0.0.1`) at
   https://github.com/ninadgawad/northstar — clean up the source repo: on
   `ninadgawad/localable` branch `claude/zealous-dijkstra-vwzmwl` (PR #3),
   delete the `nebula/` folder and push. That branch is already writable by
   Claude Code (no permission issue there — only `northstar` had the
   blocker). Do **not** open a new PR for `localable`; PR #3 already tracks
   this branch and will auto-update.
4. Optionally verify the Northstar page renders correctly (open
   `index.html` in a browser, or `npx serve .`) — it was visually verified
   once already (desktop + mobile screenshots, looked correct: sparse,
   Apple-like, muted palette, tables scroll horizontally on mobile instead
   of squishing).

## Product/design decisions already made (don't re-litigate unless asked)

- Course statuses: 3-stage — Not Started / In Progress / Completed
- Grouped by skill area: Technical Leadership, Cloud & Systems Architecture,
  Business & Finance, People Management, Strategy & Innovation
- Data is fully invented/synthetic (15 courses), goal = "Become a CTO"
- Summary bar at top: courses completed, in progress count, hours logged,
  hours remaining
- No auth, no email integration (explicitly out of scope for v1)
- Stack: plain static HTML/CSS/JS, no build step, no framework — chosen
  deliberately for simplicity given this is a single static page with
  hardcoded data
- Visual style: system font stack, muted grayscale palette (`#f7f7f5`
  background, `#1d1d1f` text), soft pastel status badges (muted green/amber/
  gray), generous whitespace, 14px border-radius cards, subtle 1px dividers
  instead of heavy borders

## Full current file contents (Northstar-named versions)

These are the exact, final Northstar-renamed contents. Use these verbatim
if the user hasn't already created the files, or to verify what they have
matches.

### `index.html`

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Northstar</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div class="page">
    <header class="header">
      <p class="brand">Northstar</p>
      <h1>Learning &amp; Growth</h1>
      <p class="goal">Goal: <strong id="goal-text"></strong></p>
    </header>

    <section class="summary" id="summary"></section>

    <main id="categories"></main>

    <p class="footer-note">Seeded with sample data &middot; v1</p>
  </div>

  <script src="data.js"></script>
  <script src="script.js"></script>
</body>
</html>
```

### `styles.css`

```css
:root {
  --bg: #f7f7f5;
  --surface: #ffffff;
  --border: #e6e6e3;
  --text: #1d1d1f;
  --text-secondary: #6e6e73;
  --text-tertiary: #a1a1a6;
  --accent: #5b7c99;

  --status-completed-bg: #eaf0ea;
  --status-completed-fg: #4a6b4d;
  --status-progress-bg: #f5eee0;
  --status-progress-fg: #93713a;
  --status-notstarted-bg: #eeeeee;
  --status-notstarted-fg: #7a7a7e;
}

* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI",
    Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.page {
  max-width: 1040px;
  margin: 0 auto;
  padding: 64px 24px 96px;
}

/* Header */

.header {
  margin-bottom: 48px;
}

.header .brand {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--text-tertiary);
  text-transform: uppercase;
  margin: 0 0 12px;
}

.header h1 {
  font-size: 34px;
  font-weight: 600;
  letter-spacing: -0.015em;
  margin: 0 0 8px;
}

.header .goal {
  font-size: 17px;
  color: var(--text-secondary);
  margin: 0;
}

.header .goal strong {
  color: var(--text);
  font-weight: 500;
}

/* Summary */

.summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  background: var(--border);
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 56px;
}

.summary .stat {
  background: var(--surface);
  padding: 22px 20px;
  text-align: left;
}

.summary .stat .value {
  font-size: 26px;
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 1.2;
}

.summary .stat .label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 4px;
}

/* Category sections */

.category {
  margin-bottom: 44px;
}

.category h2 {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
  margin: 0 0 14px;
  padding-left: 2px;
}

.table-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
}

.table-scroll {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 760px;
}

thead th {
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

tbody tr + tr td {
  border-top: 1px solid var(--border);
}

tbody td {
  padding: 16px 20px;
  font-size: 14.5px;
  vertical-align: top;
}

.course-name {
  font-weight: 500;
  color: var(--text);
}

.course-platform {
  font-size: 12.5px;
  color: var(--text-tertiary);
  margin-top: 2px;
}

.status-badge {
  display: inline-block;
  font-size: 12.5px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 100px;
  white-space: nowrap;
}

.status-badge.completed {
  background: var(--status-completed-bg);
  color: var(--status-completed-fg);
}

.status-badge.in-progress {
  background: var(--status-progress-bg);
  color: var(--status-progress-fg);
}

.status-badge.not-started {
  background: var(--status-notstarted-bg);
  color: var(--status-notstarted-fg);
}

td.muted {
  color: var(--text-tertiary);
}

td a {
  color: var(--accent);
  text-decoration: none;
  font-size: 14px;
}

td a:hover {
  text-decoration: underline;
}

td.notes {
  color: var(--text-secondary);
  max-width: 280px;
  line-height: 1.5;
}

td.time {
  color: var(--text-secondary);
  white-space: nowrap;
}

.footer-note {
  margin-top: 40px;
  font-size: 12.5px;
  color: var(--text-tertiary);
  text-align: center;
}

@media (max-width: 640px) {
  .page {
    padding: 40px 16px 64px;
  }

  .summary {
    grid-template-columns: repeat(2, 1fr);
  }

  .header h1 {
    font-size: 28px;
  }
}
```

### `script.js`

```js
function statusClass(status) {
  if (status === "Completed") return "completed";
  if (status === "In Progress") return "in-progress";
  return "not-started";
}

function formatDate(isoDate) {
  if (!isoDate) return "—";
  const date = new Date(isoDate + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function parseHours(timeToComplete) {
  const hoursMatch = timeToComplete.match(/(\d+)\s*h/);
  const minutesMatch = timeToComplete.match(/(\d+)\s*m/);
  const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
  return hours + minutes / 60;
}

function renderSummary(courses) {
  const completed = courses.filter((c) => c.status === "Completed");
  const inProgress = courses.filter((c) => c.status === "In Progress");
  const totalHours = courses.reduce((sum, c) => sum + parseHours(c.timeToComplete), 0);
  const completedHours = completed.reduce((sum, c) => sum + parseHours(c.timeToComplete), 0);
  const remainingHours = totalHours - completedHours;

  const stats = [
    { value: `${completed.length} / ${courses.length}`, label: "Courses completed" },
    { value: inProgress.length, label: "In progress" },
    { value: `${Math.round(completedHours)}h`, label: "Hours logged" },
    { value: `${Math.round(remainingHours)}h`, label: "Hours remaining" },
  ];

  const summary = document.getElementById("summary");
  summary.innerHTML = stats
    .map(
      (s) => `
      <div class="stat">
        <div class="value">${s.value}</div>
        <div class="label">${s.label}</div>
      </div>`
    )
    .join("");
}

function renderCategories(courses) {
  const categories = [...new Set(courses.map((c) => c.category))];
  const container = document.getElementById("categories");

  container.innerHTML = categories
    .map((category) => {
      const rows = courses
        .filter((c) => c.category === category)
        .map(
          (c) => `
          <tr>
            <td>
              <div class="course-name">${c.name}</div>
              <div class="course-platform">${c.platform}</div>
            </td>
            <td><span class="status-badge ${statusClass(c.status)}">${c.status}</span></td>
            <td class="muted">${formatDate(c.lastCompleted)}</td>
            <td class="time">${c.timeToComplete}</td>
            <td><a href="${c.link}" target="_blank" rel="noopener noreferrer">View source →</a></td>
            <td class="notes">${c.notes}</td>
          </tr>`
        )
        .join("");

      return `
        <section class="category">
          <h2>${category}</h2>
          <div class="table-card">
            <div class="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Status</th>
                    <th>Last Completed</th>
                    <th>Time to Complete</th>
                    <th>Link</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows}
                </tbody>
              </table>
            </div>
          </div>
        </section>`;
    })
    .join("");
}

document.getElementById("goal-text").textContent = NORTHSTAR_GOAL;
renderSummary(NORTHSTAR_COURSES);
renderCategories(NORTHSTAR_COURSES);
```

### `data.js`

```js
// Northstar v1 - synthetic seed data.
// Goal: Become a CTO. Replace with real courses/notes as you go.

const NORTHSTAR_GOAL = "Become a CTO";

const NORTHSTAR_COURSES = [
  {
    category: "Technical Leadership",
    name: "Engineering Leadership: From Manager to Director",
    platform: "LinkedIn Learning",
    link: "https://www.linkedin.com/learning/",
    status: "Completed",
    lastCompleted: "2026-02-10",
    timeToComplete: "4h 30m",
    notes: "Good framework for scaling a team past ~30 engineers without losing technical depth.",
  },
  {
    category: "Technical Leadership",
    name: "The Staff Engineer's Path",
    platform: "O'Reilly (Book)",
    link: "https://www.oreilly.com/",
    status: "In Progress",
    lastCompleted: null,
    timeToComplete: "8h",
    notes: "On the chapter about influence without authority. Useful for the IC-to-exec bridge.",
  },
  {
    category: "Technical Leadership",
    name: "Architecting for Scale",
    platform: "Coursera",
    link: "https://www.coursera.org/",
    status: "Not Started",
    lastCompleted: null,
    timeToComplete: "12h",
    notes: "Queued after finishing the distributed systems book below.",
  },
  {
    category: "Cloud & Systems Architecture",
    name: "AWS Certified Solutions Architect - Professional",
    platform: "AWS Training",
    link: "https://aws.amazon.com/certification/",
    status: "Completed",
    lastCompleted: "2025-11-02",
    timeToComplete: "40h",
    notes: "Renewal due 2028. Biggest single time investment so far, worth it for credibility with infra teams.",
  },
  {
    category: "Cloud & Systems Architecture",
    name: "Designing Data-Intensive Applications",
    platform: "O'Reilly (Book)",
    link: "https://www.oreilly.com/",
    status: "In Progress",
    lastCompleted: null,
    timeToComplete: "20h",
    notes: "Slow read but foundational - want to be able to challenge architecture proposals directly.",
  },
  {
    category: "Cloud & Systems Architecture",
    name: "Kubernetes for Platform Engineers",
    platform: "Udemy",
    link: "https://www.udemy.com/",
    status: "Completed",
    lastCompleted: "2026-04-18",
    timeToComplete: "10h",
    notes: "Enough to have an informed opinion in platform reviews, not enough to run prod myself.",
  },
  {
    category: "Cloud & Systems Architecture",
    name: "System Design Interview Deep Dive",
    platform: "Educative",
    link: "https://www.educative.io/",
    status: "Not Started",
    lastCompleted: null,
    timeToComplete: "15h",
    notes: "Useful less for interviews, more for calibrating what \"good\" looks like when hiring architects.",
  },
  {
    category: "Business & Finance",
    name: "Finance for Non-Financial Managers",
    platform: "Coursera",
    link: "https://www.coursera.org/",
    status: "Completed",
    lastCompleted: "2026-01-05",
    timeToComplete: "6h",
    notes: "Cleared up how R&D spend actually shows up on the income statement.",
  },
  {
    category: "Business & Finance",
    name: "Reading a P&L Like a CFO",
    platform: "LinkedIn Learning",
    link: "https://www.linkedin.com/learning/",
    status: "In Progress",
    lastCompleted: null,
    timeToComplete: "3h",
    notes: "Short course, doing it alongside real board deck reviews.",
  },
  {
    category: "Business & Finance",
    name: "Startup Financial Modeling",
    platform: "Udemy",
    link: "https://www.udemy.com/",
    status: "Not Started",
    lastCompleted: null,
    timeToComplete: "5h",
    notes: "Want to be able to build a headcount-vs-runway model without leaning on finance for every draft.",
  },
  {
    category: "People Management",
    name: "Radical Candor",
    platform: "Book",
    link: "https://www.radicalcandor.com/",
    status: "Completed",
    lastCompleted: "2026-03-22",
    timeToComplete: "6h",
    notes: "Reference this constantly in 1:1s now - especially the \"ruinous empathy\" trap.",
  },
  {
    category: "People Management",
    name: "Coaching Skills for Managers",
    platform: "Coursera",
    link: "https://www.coursera.org/",
    status: "In Progress",
    lastCompleted: null,
    timeToComplete: "5h",
    notes: "Practicing the GROW model in skip-levels this quarter.",
  },
  {
    category: "People Management",
    name: "Building High-Performing Engineering Cultures",
    platform: "Conference Talk Series",
    link: "https://www.youtube.com/",
    status: "Not Started",
    lastCompleted: null,
    timeToComplete: "4h",
    notes: "Curated playlist from LeadDev - saved for after the coaching course.",
  },
  {
    category: "Strategy & Innovation",
    name: "The CTO Playbook",
    platform: "Book",
    link: "https://www.amazon.com/",
    status: "Completed",
    lastCompleted: "2026-06-30",
    timeToComplete: "7h",
    notes: "Best single overview of the role split (tech strategy vs. delivery vs. people) I've read so far.",
  },
  {
    category: "Strategy & Innovation",
    name: "Technology Strategy for the C-Suite",
    platform: "Wharton Executive Education",
    link: "https://online.wharton.upenn.edu/",
    status: "In Progress",
    lastCompleted: null,
    timeToComplete: "18h",
    notes: "Executive cohort course - case studies are directly relevant to our build-vs-buy debates.",
  },
];
```

### `README.md`

````markdown
# Northstar

A personal learning tracker: see the courses, books, and certifications you're
working through toward a goal, at a glance.

This is v1: a static page with synthetic data (goal: "Become a CTO"), no
build step, no accounts, no email integration.

## Running it

Just open `index.html` in a browser, or serve the folder with any static
file server, e.g.:

```bash
npx serve .
```

## Structure

- `index.html` - page shell
- `styles.css` - visual design (sparse, muted palette)
- `data.js` - the course data (`NORTHSTAR_GOAL`, `NORTHSTAR_COURSES`) - edit this
  to reflect your real courses
- `script.js` - renders the summary stats and course tables from `data.js`
````

## Open questions / things to confirm with the user at start of next session

- Did they finish creating the files locally and push to `northstar` main?
- Did they ever resolve the Claude GitHub App permission issue for
  `ninadgawad/northstar`? (If yes, future pushes to that repo can go
  through Claude Code directly instead of manual copy-paste.)
- Do they still want `nebula/` removed from `localable` (confirmed yes
  earlier in the session, but re-confirm nothing changed).
