import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Timer, TrendingUp, CheckCircle2, Flame, Trophy } from "lucide-react";
import { formatMinutes, formatRangeLabel, thisWeekRange } from "@/lib/dates";
import type { WeekStats } from "@/lib/stats";

interface WeekPanelProps {
  weekStats: WeekStats;
  onOpenRecap: () => void;
}

export default function WeekPanel({ weekStats, onOpenRecap }: WeekPanelProps): JSX.Element {
  const range = thisWeekRange(new Date());

  const tiles: {
    key: string;
    icon: typeof Timer;
    iconClasses: string;
    value: string;
    sub: string;
  }[] = [
    {
      key: "focus",
      icon: Timer,
      iconClasses: "text-primary",
      value: formatMinutes(weekStats.focusMinutes),
      sub: `${weekStats.sessionCount} session${weekStats.sessionCount === 1 ? "" : "s"}`,
    },
    {
      key: "advanced",
      icon: TrendingUp,
      iconClasses: "text-primary",
      value: String(weekStats.topicsAdvanced),
      sub: "advanced",
    },
    {
      key: "completed",
      icon: CheckCircle2,
      iconClasses: "text-success",
      value: String(weekStats.topicsCompleted),
      sub: "completed",
    },
    {
      key: "streak",
      icon: Flame,
      iconClasses: "text-warning",
      value: `${weekStats.currentStreak} day${weekStats.currentStreak === 1 ? "" : "s"}`,
      sub: "current streak",
    },
    {
      key: "best",
      icon: Trophy,
      iconClasses: "text-muted-foreground",
      value: `${weekStats.bestStreak} day${weekStats.bestStreak === 1 ? "" : "s"}`,
      sub: "best streak",
    },
  ];

  return (
    <Card className="mb-4">
      <CardHeader className="flex-row items-center justify-between gap-3 pb-0">
        <div>
          <CardTitle>This Week</CardTitle>
          <CardDescription>
            {formatRangeLabel(range)} · All goals
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={onOpenRecap}>
          Weekly recap
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {tiles.map(({ key, icon: Icon, iconClasses, value, sub }) => (
            <div
              key={key}
              className="flex items-center justify-between gap-2 rounded-2xl border border-border bg-card px-4 py-3"
            >
              <div>
                <div className="text-2xl font-semibold tracking-tight">{value}</div>
                <div className="text-xs text-muted-foreground">{sub}</div>
              </div>
              <Icon className={`size-5 shrink-0 ${iconClasses}`} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
