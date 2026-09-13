import { useState, type FormEvent } from "react";
import { Plus, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Course, Goal } from "@/types";

interface AdminViewProps {
  goals: Goal[];
  courses: Course[];
  onAddGoal: (name: string) => void;
}

export default function AdminView({ goals, courses, onAddGoal }: AdminViewProps): JSX.Element {
  const [name, setName] = useState("");

  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onAddGoal(trimmed);
    setName("");
  };

  return (
    <div className="mx-auto max-w-2xl">
      <section className="mb-6">
        <h2 className="mb-1 text-sm font-semibold">Add a new goal</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Goals group your courses. Switch between them from the dropdown in the top bar.
        </p>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Become a Founder"
            aria-label="New goal name"
          />
          <Button type="submit" disabled={!name.trim()}>
            <Plus className="size-3.5" />
            Add goal
          </Button>
        </form>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Existing goals
        </h2>
        <div className="space-y-2">
          {goals.map((goal) => {
            const count = courses.filter((c) => c.goalId === goal.id).length;
            return (
              <Card key={goal.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-2.5">
                    <Target className="size-4 text-primary" />
                    <span className="text-sm font-medium">{goal.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {count} course{count === 1 ? "" : "s"}
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
