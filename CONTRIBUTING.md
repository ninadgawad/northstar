# Contributing to Northstar

Thanks for your interest in Northstar! Contributions of all sizes are welcome.

The full guide lives in [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md). The short version:

1. **Open an issue first** for anything bigger than a small fix, so we can agree on the approach.
2. **Fork and branch** from `main` (`feature/<name>` or `fix/<name>`).
3. **Set up**: `npm install`, then `npm run dev`.
4. **Verify before you push**: there is no test runner or linter, so `npm run typecheck && npm run build` is the gate. CI runs the same two commands.
5. **Open a pull request** against `main` and fill in the template.

Read [CLAUDE.md](CLAUDE.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) before changing persistence or course-mutation logic. Two rules matter most:

- Schema changes must ship as migrations. Users already have a database on disk.
- Mutate courses only through `handleUpdateCourse` in `App.tsx`.

## Licensing of contributions

By submitting a contribution you agree that it is licensed under the project's [MIT License](LICENSE).

## Conduct

Participation is governed by the [Code of Conduct](CODE_OF_CONDUCT.md). Report security issues privately, as described in [SECURITY.md](SECURITY.md), not in public issues.
