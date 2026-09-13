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
