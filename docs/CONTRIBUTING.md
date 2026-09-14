# Contributing

Thank you for contributing to Northstar! This guide explains how to contribute effectively.

## Getting Started

1. Read [Getting Started](./GETTING_STARTED.md) to set up your environment
2. Read [Architecture](./ARCHITECTURE.md) to understand the system
3. Check [Development Guide](./DEVELOPMENT.md) for workflow tips

## What to Contribute

### Good Contributions

- **Bug fixes** - Find and fix reproducible bugs
- **New features** - Propose and implement new learning features
- **Performance improvements** - Make the app faster or use less memory
- **Documentation** - Improve these docs or add comments to code
- **UI/UX improvements** - Enhance the interface design
- **Code cleanup** - Refactor and simplify complex code

### Before Starting

For larger features, consider opening an issue first to discuss the approach. This prevents wasted effort if the maintainer has a different direction.

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/short-description
```

Use a descriptive branch name:
- `feature/add-tags` - New feature
- `fix/timer-reset-bug` - Bug fix
- `docs/update-readme` - Documentation
- `refactor/db-layer` - Code improvement

### 2. Make Your Changes

- Follow the code style (see [Style Guide](#style-guide) below)
- Keep commits atomic and well-described
- Update tests if applicable
- Update documentation if behavior changes

### 3. Verify Your Changes

Before pushing:

```bash
npm run typecheck   # No type errors
npm run build       # Build succeeds
npm run start       # Test the feature manually
```

### 4. Commit and Push

```bash
git add .
git commit -m "Add feature X

- Describe what the commit does
- Use imperative mood (Add, Fix, not Added)
- Keep messages clear and concise"

git push origin feature/short-description
```

**Commit Message Format**:
```
Verb what-you-did: short summary

- Bullet point explaining change
- Another bullet point
- Be specific about what changed why
```

Examples:
```
Add focus timer feature

- Implement 15/30/45/60 minute sessions
- Add alarm notification on completion
- Update sidebar with running timer badge
- Add FocusTimerView component

---

Fix course update not persisting progress

- Ensure handleUpdateCourse calls API with final patch
- Add test for status/progress sync
- Verify database persistence

---

Refactor CourseTable sorting logic

- Extract sort function to utils
- Add custom status order
- Simplify column definitions
```

### 5. Create a Pull Request

1. Push your branch to GitHub
2. Open a pull request with a clear description
3. Reference any related issues (#123)
4. Wait for review and address feedback

**PR Description Template**:
```markdown
## What

Brief description of what this PR does.

## Why

Why is this change needed? What problem does it solve?

## How

How does it work? Any implementation notes?

## Testing

How can reviewers test this change?

## Checklist

- [ ] TypeScript checks pass
- [ ] Build succeeds
- [ ] Manual testing done
- [ ] Documentation updated (if needed)
```

## Style Guide

### TypeScript

- Use explicit types (avoid `any`)
- Keep functions small and focused
- Use meaningful variable names
- Comment complex logic

```typescript
// ✅ Good
function calculateProgress(completed: number, total: number): number {
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
}

// ❌ Avoid
function calc(c: any, t: any): any {
  return c / t * 100  // What does this calculate?
}
```

### React

- Use functional components with hooks
- Keep components focused (single responsibility)
- Extract complex logic to custom hooks
- Use TypeScript for props

```typescript
// ✅ Good
interface CourseListProps {
  courses: Course[]
  onSelect: (course: Course) => void
}

export default function CourseList({ courses, onSelect }: CourseListProps) {
  // Component logic
}

// ❌ Avoid
export default function CourseList(props) {
  // Uses 'any', props not documented
}
```

### Styling

- Use Tailwind classes (not inline styles)
- Use design tokens (CSS variables)
- Use `cn()` for conditional classes
- Keep classes readable

```typescript
// ✅ Good
className={cn(
  "rounded-md border px-3 py-2",
  status === "Completed" && "bg-success text-success-foreground",
  isDisabled && "opacity-50"
)}

// ❌ Avoid
className={`rounded-md border px-3 py-2 ${status === 'Completed' ? 'bg-green-500 text-white' : ''}`}
```

### Naming

Use clear, descriptive names:

```typescript
// ✅ Good
const selectedCourseId = 123
const isSessionRunning = true
function handleAddGoal(name: string) { }

// ❌ Avoid
const id = 123  // What id?
const flag = true  // What flag?
function add() { }  // Add what?
```

### File Organization

```
src/
├── components/
│   ├── views/           # Full-page views
│   │   ├── DashboardView.tsx
│   │   └── AdminView.tsx
│   ├── ui/              # Primitives (Button, Card, etc.)
│   └── MyComponent.tsx  # Other components
├── lib/                 # Utilities (sound.ts, encouragement.ts)
└── pages/               # (if using routing later)
```

## Code Review Process

### What Reviewers Look For

- Does it solve the problem?
- Is the code maintainable and readable?
- Are there edge cases handled?
- Does it follow the style guide?
- Are there performance concerns?
- Is it documented?

### Addressing Feedback

1. Read the feedback carefully
2. Ask clarifying questions if needed
3. Make the suggested changes
4. Push the new commits
5. Mark conversations as resolved
6. Reply to the reviewer

Example response:
```
Done! I've updated the function to handle empty arrays and added a comment explaining the edge case.
```

## Testing Guidelines

### Manual Testing

For new features, test:

1. **Happy path** - Does it work as intended?
2. **Edge cases** - Empty data, missing fields, large datasets?
3. **Integration** - Does it work with other features?
4. **Persistence** - Does data save and load correctly?
5. **UI** - Does it look good at different window sizes?

### Before Submitting

```bash
npm run typecheck   # No type errors
npm run build       # Build succeeds
npm run start       # App launches and works
```

### Reporting Bugs

Include:
- **Description** - What did you do? What happened?
- **Expected** - What should have happened?
- **Actual** - What actually happened?
- **Steps to reproduce** - Can someone else reproduce it?
- **Environment** - Windows/macOS/Linux, what build?
- **Screenshots** - If visual issue

Example:
```
When I add a goal with a special character (e.g., "C++"), the goal ID is malformed.

Expected: goal ID should be "c-plus-plus"
Actual: goal ID is "c--"
Steps: 1. Open Admin, 2. Enter "C++" as goal name, 3. Click Add goal, 4. See malformed ID

This happens in the latest build on Windows 11.
```

## Documentation

### Updating Docs

If your change affects user-facing behavior:
1. Update the relevant doc in `docs/`
2. Update examples if applicable
3. Check for outdated information

### Commenting Code

- Comment the **why**, not the **what**
- Keep comments up-to-date
- Remove outdated comments

```typescript
// ✅ Good
// Courses are grouped by goal to match the user's mental model
const groupedCourses = useMemo(() => groupCourses(courses), [courses])

// ❌ Avoid
// Group courses
const groupedCourses = useMemo(() => groupCourses(courses), [courses])
```

## Questions?

- Read the relevant documentation file
- Check existing code for examples
- Open an issue asking for guidance
- Discuss in comments before starting big refactors

## Recognition

Contributors are valued! If your contribution is merged:
- Your name goes in commit history
- You're welcome to be listed in a CONTRIBUTORS file (if we create one)
- Thank you for making Northstar better!

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (if applicable).
