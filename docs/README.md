# Northstar Documentation

Welcome to the Northstar project documentation. This directory contains comprehensive guides and references for understanding, developing, and contributing to Northstar.

## Documentation Structure

### Core Documentation

- **[Getting Started](./GETTING_STARTED.md)** - Setup, installation, and first steps
- **[Architecture](./ARCHITECTURE.md)** - System design, data flow, and technical decisions
- **[Features](./FEATURES.md)** - Detailed feature descriptions and user workflows
- **[Database Schema](./DATABASE.md)** - SQLite schema, models, and data persistence
- **[Components](./COMPONENTS.md)** - React component library and UI patterns
- **[Development Guide](./DEVELOPMENT.md)** - Development workflow, debugging, and best practices
- **[Contributing](./CONTRIBUTING.md)** - Contribution guidelines and standards

## Quick Links

### For New Developers
1. Read [Getting Started](./GETTING_STARTED.md) to set up your environment
2. Review [Architecture](./ARCHITECTURE.md) to understand the system
3. Check [Development Guide](./DEVELOPMENT.md) for workflow tips

### For Feature Development
1. See [Features](./FEATURES.md) for existing functionality
2. Review [Database Schema](./DATABASE.md) if data changes are needed
3. Check [Components](./COMPONENTS.md) for UI patterns

### For Bug Fixes
1. Look at [Architecture](./ARCHITECTURE.md) to understand the affected systems
2. Use [Development Guide](./DEVELOPMENT.md) for debugging techniques
3. Reference [Database](./DATABASE.md) for data-related issues

## Project Overview

**Northstar** is a personal learning tracker desktop application built with:
- **Framework**: Electron + React 18 + TypeScript 5.6
- **Styling**: Tailwind CSS 3 with shadcn/ui patterns
- **Data**: SQLite (sql.js) with persistent file storage
- **Build**: electron-vite with HMR support

### Key Features

- 📚 **Goal Management** - Create and organize learning goals
- 📝 **Course Tracking** - Track courses/topics with status, progress, and notes
- ⏱️ **Focus Timer** - 15/30/45/60 minute focus sessions with alarms and notifications
- 💾 **Persistent Storage** - All data saved to local SQLite database
- 🎨 **Modern UI** - Clean, responsive design with light/dark theme support

## Common Tasks

### Running the Application
```bash
npm run dev      # Start with HMR in development
npm run build    # Build for production
npm run start    # Preview the built app
```

### Development Workflow
```bash
npm run typecheck   # Check TypeScript types
npm run build       # Build and verify
npm run start       # Launch and test
```

### Adding New Features
1. Plan data changes in the database schema
2. Implement migrations in `src/main/db.ts`
3. Create React components in `src/renderer/src/components/`
4. Wire into `App.tsx` for state management
5. Test with `npm run dev` and verify with `npm run build`

## Resources

- **CLAUDE.md** - AI assistant development guidelines (see parent directory)
- **README.md** - Project overview with quick stats (see parent directory)
- **.md files in docs/** - This documentation

## Getting Help

- Check the relevant documentation file for your question
- Review existing code in the `src/` directory for patterns
- See [Development Guide](./DEVELOPMENT.md) for debugging help
