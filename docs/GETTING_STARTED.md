# Getting Started with Northstar

This guide will help you set up Northstar for development and get it running locally.

## Prerequisites

- **Node.js** 18+ and npm
- **Git** for version control
- **Windows**, **macOS**, or **Linux** (Electron runs on all platforms)
- A text editor or IDE (VS Code recommended)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd northstar
```

### 2. Install Dependencies

```bash
npm install
```

This installs all required packages including:
- React, React DOM, and TypeScript
- Electron and electron-vite
- Tailwind CSS and UI component dependencies
- SQLite (sql.js) for data persistence

### 3. Verify Installation

```bash
npm run typecheck
```

This should complete without errors if your environment is set up correctly.

## Running the Application

### Development Mode (with Hot Module Reload)

```bash
npm run dev
```

This starts:
- Electron dev server with file watching
- Hot reload on code changes
- DevTools automatically open
- HMR for React components

The application window opens automatically. Make changes to files and see them reflected instantly.

### Production Build

```bash
npm run build
```

This creates an optimized build in the `out/` directory:
- Minified JavaScript and CSS
- Bundled assets
- Production configuration

### Preview Built Application

```bash
npm run start
```

This runs the production build locally to verify everything works before packaging.

## Project Structure

```
northstar/
├── src/
│   ├── main/           # Electron main process
│   │   ├── index.ts    # App entry point
│   │   └── db.ts       # SQLite persistence layer
│   ├── preload/        # Preload script for IPC
│   ├── renderer/       # React application
│   │   ├── index.html  # Entry HTML
│   │   └── src/
│   │       ├── App.tsx # Main app component
│   │       ├── components/  # React components
│   │       ├── lib/         # Utilities
│   │       └── styles.css   # Tailwind setup
│   └── shared/         # Shared types and data
├── docs/               # This documentation
├── CLAUDE.md           # AI development guidelines
├── package.json        # Dependencies and scripts
└── tailwind.config.js  # Tailwind configuration
```

## First Steps

### 1. Start Development Server

```bash
npm run dev
```

### 2. Explore the Application

- **Dashboard** - View courses organized by goal
- **Admin** - Manage goals and topics
- **Focus Timer** - Try a short focus session
- Click on courses to open the detail drawer

### 3. Open Developer Tools

Press `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (macOS) to open DevTools.

### 4. Make a Small Change

Edit `src/renderer/src/components/Sidebar.tsx` and change "Northstar" to something else. You'll see the change instantly in the running app.

## Common Issues

### Port Already in Use

If you see "Port is already in use":
```bash
# Kill the existing process or use a different port
npm run dev -- --port 5174
```

### TypeScript Errors After Pull

Clear the build cache:
```bash
rm tsconfig.*.tsbuildinfo
npm run typecheck
```

### Database File Locked

The SQLite database is stored in `%APPDATA%/northstar/northstar.sqlite3` on Windows. If the app crashes, you might need to restart it.

### Changes Not Appearing

Make sure you're editing files in `src/renderer/src/` (not built files in `out/`). Hot reload works for source files.

## Build Configuration

Key files:
- **electron.vite.config.ts** - Vite and Electron build configuration
- **tsconfig.node.json** - TypeScript config for main/preload processes
- **tsconfig.web.json** - TypeScript config for renderer (React)
- **tailwind.config.js** - Tailwind CSS configuration

## Next Steps

After getting the app running:
1. Read [Features](./FEATURES.md) to understand what the app does
2. Review [Architecture](./ARCHITECTURE.md) to understand the code organization
3. Check [Development Guide](./DEVELOPMENT.md) for workflow best practices
4. Look at [Components](./COMPONENTS.md) to understand the UI system

## Getting Help

- Check [Development Guide](./DEVELOPMENT.md) for debugging and common tasks
- Look at [CLAUDE.md](../CLAUDE.md) for development conventions
- Review existing code in `src/` for examples and patterns
