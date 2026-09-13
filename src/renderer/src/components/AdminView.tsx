import { useState, type FormEvent } from "react";
import { Pencil, Plus, Target, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import TopicForm, { type TopicFormValues } from "@/components/TopicForm";
import StatusBadge from "@/components/StatusBadge";
import type { Course, CourseInput, CoursePatch, Goal } from "@/types";

interface AdminViewProps {
  goals: Goal[];
  selectedGoal: Goal | undefined;
  courses: Course[];
  onAddGoal: (name: string) => void;
  onAddCourse: (input: CourseInput) => void;
  onUpdateCourse: (id: number, patch: CoursePatch) => void;
  onDeleteCourse: (id: number) => void;
}

export default function AdminView({
  goals,
  selectedGoal,
  courses,
  onAddGoal,
  onAddCourse,
  onUpdateCourse,
  onDeleteCourse,
}: AdminViewProps): JSX.Element {
  const [goalName, setGoalName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [addingTopic, setAddingTopic] = useState(false);

  const topicCourses = selectedGoal ? courses.filter((c) => c.goalId === selectedGoal.id) : [];
  const categories = [...new Set(topicCourses.map((c) => c.category))];

  const handleAddGoalSubmit = (e: FormEvent): void => {
    e.preventDefault();
    const trimmed = goalName.trim();
    if (!trimmed) return;
    onAddGoal(trimmed);
    setGoalName("");
  };

  const handleAddTopic = (values: TopicFormValues): void => {
    if (!selectedGoal) return;
    onAddCourse({
      ...values,
      goalId: selectedGoal.id,
      lastCompleted: values.status === "Completed" ? new Date().toISOString().slice(0, 10) : null,
      userNote: "",
    });
    setAddingTopic(false);
  };

  const handleEditTopic = (id: number, values: TopicFormValues): void => {
    onUpdateCourse(id, values);
    setEditingId(null);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <section>
        <h2 className="mb-1 text-sm font-semibold">Add a new goal</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Goals group your topics. Switch between them from the dropdown in the top bar.
        </p>
        <form onSubmit={handleAddGoalSubmit} className="flex gap-2">
          <Input
            value={goalName}
            onChange={(e) => setGoalName(e.target.value)}
            placeholder="e.g. Become a Founder"
            aria-label="New goal name"
          />
          <Button type="submit" disabled={!goalName.trim()}>
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
          {goals.map((goal) => (
            <Card key={goal.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-2.5">
                  <Target className="size-4 text-primary" />
                  <span className="text-sm font-medium">{goal.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {courses.filter((c) => c.goalId === goal.id).length} topic(s)
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {selectedGoal && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Topics in &ldquo;{selectedGoal.name}&rdquo;
            </h2>
            {!addingTopic && (
              <Button size="sm" variant="outline" onClick={() => setAddingTopic(true)}>
                <Plus className="size-3.5" />
                Add topic
              </Button>
            )}
          </div>

          {addingTopic && (
            <Card className="mb-3">
              <CardContent className="p-4">
                <TopicForm
                  categories={categories}
                  submitLabel="Add topic"
                  onSubmit={handleAddTopic}
                  onCancel={() => setAddingTopic(false)}
                />
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            {topicCourses.length === 0 && !addingTopic && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No topics yet for this goal.
              </p>
            )}
            {topicCourses.map((course) =>
              editingId === course.id ? (
                <Card key={course.id}>
                  <CardContent className="p-4">
                    <TopicForm
                      initial={course}
                      categories={categories}
                      submitLabel="Save changes"
                      onSubmit={(values) => handleEditTopic(course.id, values)}
                      onCancel={() => setEditingId(null)}
                    />
                  </CardContent>
                </Card>
              ) : (
                <Card key={course.id}>
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{course.name}</span>
                        <StatusBadge status={course.status} />
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {course.category} · {course.platform}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Edit topic"
                        onClick={() => setEditingId(course.id)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Delete topic"
                        onClick={() => onDeleteCourse(course.id)}
                      >
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            )}
          </div>
        </section>
      )}
    </div>
  );
}
