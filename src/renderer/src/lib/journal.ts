// Session journaling: turning "what did you just do" into an appended note
// line and (optionally) a progress bump, applied straight to the course.

/** Local "YYYY-MM-DD HH:mm" stamp for a session journal line. */
export function formatStamp(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${mo}-${day} ${h}:${mi}`;
}

/** "[2026-09-14 14:30, 30m] text" style line for a journaled session. */
export function formatSessionLine(at: Date, minutes: number, text: string): string {
  return `[${formatStamp(at)}, ${minutes}m] ${text}`;
}

/** Appends `line` to `existing`, newline-joined; just `line` if there's nothing yet. */
export function appendSessionNote(existing: string, line: string): string {
  const trimmed = existing.trimEnd();
  return trimmed ? `${trimmed}\n${line}` : line;
}

/** Applies a progress bump (or a jump straight to 100), clamped to 0..100. */
export function bumpProgress(current: number, bump: number | "complete"): number {
  const next = bump === "complete" ? 100 : current + bump;
  return Math.max(0, Math.min(100, next));
}
