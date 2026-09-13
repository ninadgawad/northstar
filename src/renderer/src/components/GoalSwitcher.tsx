import { ChevronDown, ShieldCheck, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Goal } from "@/types";

interface GoalSwitcherProps {
  goals: Goal[];
  selectedGoalId: string;
  onSelectGoal: (goalId: string) => void;
  onManageGoals: () => void;
}

export default function GoalSwitcher({
  goals,
  selectedGoalId,
  onSelectGoal,
  onManageGoals,
}: GoalSwitcherProps): JSX.Element {
  const selected = goals.find((g) => g.id === selectedGoalId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Target className="size-3.5 text-primary" />
          <span className="max-w-[180px] truncate">{selected?.name ?? "Select goal"}</span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Your goals</DropdownMenuLabel>
        {goals.map((goal) => (
          <DropdownMenuCheckItem
            key={goal.id}
            checked={goal.id === selectedGoalId}
            onSelect={() => onSelectGoal(goal.id)}
          >
            {goal.name}
          </DropdownMenuCheckItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onManageGoals}>
          <ShieldCheck className="size-3.5" />
          Manage goals
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
