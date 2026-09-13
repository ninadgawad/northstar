# Northstar

Learn with purpose. Build with intention. Move toward your North Star.

A personal learning & growth tracker, now a TypeScript desktop app (Electron
+ React) built with `electron-vite`.

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

- `src/main` — Electron main process (creates the app window)
- `src/preload` — preload script bridging main/renderer
- `src/renderer` — the React + TypeScript UI
  - `src/renderer/src/data.ts` — the course data (`NORTHSTAR_GOAL`,
    `NORTHSTAR_COURSES`) — edit this to reflect your real courses
  - `src/renderer/src/components` — Header, Summary, CategorySection
