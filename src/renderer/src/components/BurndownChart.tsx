import { parseIsoDate } from "@/lib/dates";
import type { BurndownSeries } from "@/lib/pace";

interface BurndownChartProps {
  series: BurndownSeries;
  today: Date;
}

const WIDTH = 480;
const HEIGHT = 160;
const PAD_X = 8;
const PAD_TOP = 12;
const PAD_BOTTOM = 20;

/** Stateless inline-SVG burn-down chart: no chart library, theme tokens via inline styles. */
export default function BurndownChart({ series, today }: BurndownChartProps): JSX.Element {
  const { actual, ideal, projected } = series;

  const total = actual[0]?.remaining ?? 0;
  const allDates = [
    ...actual.map((p) => p.date),
    ...(ideal ? ideal.map((p) => p.date) : []),
    ...(projected ? [projected.date] : []),
  ].map((d) => parseIsoDate(d).getTime());
  const todayMs = today.getTime();

  const minX = Math.min(...allDates, todayMs);
  const maxX = Math.max(...allDates, todayMs);
  const spanX = Math.max(maxX - minX, 1);
  const maxY = Math.max(total, 1);

  const plotW = WIDTH - PAD_X * 2;
  const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const x = (ms: number): number => PAD_X + ((ms - minX) / spanX) * plotW;
  const y = (remaining: number): number => PAD_TOP + (1 - remaining / maxY) * plotH;

  const toPoints = (pts: { date: string; remaining: number }[]): string =>
    pts.map((p) => `${x(parseIsoDate(p.date).getTime())},${y(p.remaining)}`).join(" ");

  const actualPoints = toPoints(actual);
  const idealPoints = ideal ? toPoints(ideal) : null;
  const lastActual = actual[actual.length - 1];
  const projectedLine =
    projected && lastActual
      ? `${x(parseIsoDate(lastActual.date).getTime())},${y(lastActual.remaining)} ${x(
          parseIsoDate(projected.date).getTime()
        )},${y(projected.remaining)}`
      : null;

  const todayX = x(todayMs);
  const isBehind = projected && ideal ? parseIsoDate(projected.date).getTime() > parseIsoDate(ideal[1].date).getTime() : false;

  const fmt = (ms: number): string =>
    new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-40 w-full" role="img">
      <title>Burn-down: remaining topics over time</title>

      {/* Y-axis labels */}
      <text x={PAD_X} y={PAD_TOP} fontSize={10} fill="hsl(var(--muted-foreground))">
        {maxY}
      </text>
      <text x={PAD_X} y={HEIGHT - PAD_BOTTOM} fontSize={10} fill="hsl(var(--muted-foreground))">
        0
      </text>

      {/* Ideal line */}
      {idealPoints && (
        <polyline
          points={idealPoints}
          fill="none"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />
      )}

      {/* Actual step line */}
      <polyline points={actualPoints} fill="none" stroke="hsl(var(--primary))" strokeWidth={2} />

      {/* Projected segment */}
      {projectedLine && (
        <polyline
          points={projectedLine}
          fill="none"
          stroke={isBehind ? "hsl(var(--warning))" : "hsl(var(--success))"}
          strokeWidth={2}
          strokeDasharray="2 2"
        />
      )}

      {/* Today tick */}
      <line
        x1={todayX}
        y1={PAD_TOP}
        x2={todayX}
        y2={HEIGHT - PAD_BOTTOM}
        stroke="hsl(var(--border))"
        strokeWidth={1}
      />
      <text
        x={todayX}
        y={HEIGHT - 4}
        fontSize={10}
        fill="hsl(var(--muted-foreground))"
        textAnchor="middle"
      >
        Today
      </text>

      {/* X-axis start/end labels */}
      <text x={PAD_X} y={HEIGHT - 4} fontSize={10} fill="hsl(var(--muted-foreground))">
        {fmt(minX)}
      </text>
      <text x={WIDTH - PAD_X} y={HEIGHT - 4} fontSize={10} fill="hsl(var(--muted-foreground))" textAnchor="end">
        {fmt(maxX)}
      </text>
    </svg>
  );
}
