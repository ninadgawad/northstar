import GoalSwitcher from "@/components/GoalSwitcher";
import type { Goal } from "@/types";

interface TopBarProps {
  title: string;
  goals: Goal[];
  selectedGoalId: string;
  onSelectGoal: (goalId: string) => void;
  onManageGoals: () => void;
}

export default function TopBar({
  title,
  goals,
  selectedGoalId,
  onSelectGoal,
  onManageGoals,
}: TopBarProps): JSX.Element {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-5">
      <h1 className="text-sm font-semibold tracking-tight text-foreground">{title}</h1>
      <GoalSwitcher
        goals={goals}
        selectedGoalId={selectedGoalId}
        onSelectGoal={onSelectGoal}
        onManageGoals={onManageGoals}
      />
    </header>
  );
}
