# Security Policy

## Supported versions

Only the latest release on `main` receives security fixes.

## Reporting a vulnerability

Please do **not** open a public issue for security problems.

Use GitHub's private reporting instead: go to the repository's **Security** tab and choose **Report a vulnerability**
(<https://github.com/ninadgawad/northstar/security/advisories/new>).

Include what you found, steps to reproduce, and the impact you expect. You can expect an acknowledgement within a few days. Fixes are released as soon as practical, and reporters are credited unless they prefer otherwise.

## Scope notes

Northstar is a local, offline desktop app. It stores data in a SQLite file in the user's app-data directory and makes no network calls of its own. Issues in the Electron main/preload boundary (IPC handlers, `contextBridge` exposure) and in file handling are the most relevant.
