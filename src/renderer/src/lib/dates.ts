// Local-time date/week helpers shared by the Streaks, Roadmap, and Smart Focus
// features. All bucketing here is in the *viewer's local time zone* — never
// use toISOString() for day/week keys, since that reports the UTC date and
// silently shifts a session across a day boundary near midnight.

/** Midnight (local) on the same day as `d`. */
export function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** "YYYY-MM-DD" for the local calendar day of `d` (not UTC — see module note). */
export function localDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parses a "YYYY-MM-DD" string as local midnight (matches utils.ts#formatDate). */
export function parseIsoDate(iso: string): Date {
  return new Date(iso + "T00:00:00");
}

/** `d` shifted by `n` days (negative to go back). DST-safe via setDate. */
export function addDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

/** Monday 00:00 local of the week containing `d`. */
export function startOfWeek(d: Date): Date {
  const day = d.getDay(); // 0 = Sunday
  const offset = (day + 6) % 7; // days since Monday
  return addDays(startOfLocalDay(d), -offset);
}

/** A stable per-week key: the local-day key of that week's Monday. */
export function weekKey(d: Date): string {
  return localDayKey(startOfWeek(d));
}

/** Fractional, signed number of 7-day weeks from `a` to `b`. */
export function weeksBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / (7 * 24 * 60 * 60 * 1000);
}

/** Half-open range [start, end). */
export interface DateRange {
  start: Date;
  end: Date;
}

/** [Monday 00:00 local, next Monday 00:00 local) containing `now`. */
export function thisWeekRange(now: Date): DateRange {
  const start = startOfWeek(now);
  return { start, end: addDays(start, 7) };
}

/** The week immediately before `thisWeekRange(now)`. */
export function previousWeekRange(now: Date): DateRange {
  const start = addDays(startOfWeek(now), -7);
  return { start, end: addDays(start, 7) };
}

/** Whether an ISO timestamp string falls within a half-open date range. */
export function inRange(iso: string, r: DateRange): boolean {
  const t = new Date(iso).getTime();
  return t >= r.start.getTime() && t < r.end.getTime();
}

/** "Sep 7 – 13" style label for a DateRange (assumes it spans one calendar week). */
export function formatRangeLabel(r: DateRange): string {
  const endInclusive = addDays(r.end, -1);
  const startStr = r.start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const sameMonth = r.start.getMonth() === endInclusive.getMonth();
  const endStr = sameMonth
    ? endInclusive.toLocaleDateString("en-US", { day: "numeric" })
    : endInclusive.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${startStr} – ${endStr}`;
}

/** "2h 15m" / "45m" style duration label. */
export function formatMinutes(m: number): string {
  const hours = Math.floor(m / 60);
  const mins = m % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/** "never" | "today" | "Nd ago" relative to `now` (both epoch ms). */
export function formatRelativeDays(ms: number | null, now: number): string {
  if (ms === null) return "never";
  const days = Math.floor((startOfLocalDay(new Date(now)).getTime() - startOfLocalDay(new Date(ms)).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "1d ago";
  return `${days}d ago`;
}
