import type { CourseStatus } from "./types";

export function statusClass(status: CourseStatus): string {
  if (status === "Completed") return "completed";
  if (status === "In Progress") return "in-progress";
  return "not-started";
}

export function formatDate(isoDate: string | null): string {
  if (!isoDate) return "—";
  const date = new Date(isoDate + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function parseHours(timeToComplete: string): number {
  const hoursMatch = timeToComplete.match(/(\d+)\s*h/);
  const minutesMatch = timeToComplete.match(/(\d+)\s*m/);
  const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
  return hours + minutes / 60;
}

/** Formats a millisecond duration as "MM:SS", clamped at zero. */
export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
