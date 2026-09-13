import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Course, CourseStatus } from "@/types";

export interface TopicFormValues {
  category: string;
  name: string;
  platform: string;
  link: string;
  status: CourseStatus;
  timeToComplete: string;
  notes: string;
}

const STATUS_OPTIONS: CourseStatus[] = ["Not Started", "In Progress", "Completed"];

const EMPTY_VALUES: TopicFormValues = {
  category: "",
  name: "",
  platform: "",
  link: "",
  status: "Not Started",
  timeToComplete: "",
  notes: "",
};

interface TopicFormProps {
  initial?: Course | null;
  categories: string[];
  submitLabel: string;
  onSubmit: (values: TopicFormValues) => void;
  onCancel?: () => void;
}

export default function TopicForm({
  initial,
  categories,
  submitLabel,
  onSubmit,
  onCancel,
}: TopicFormProps): JSX.Element {
  const [values, setValues] = useState<TopicFormValues>(
    initial
      ? {
          category: initial.category,
          name: initial.name,
          platform: initial.platform,
          link: initial.link,
          status: initial.status,
          timeToComplete: initial.timeToComplete,
          notes: initial.notes,
        }
      : EMPTY_VALUES
  );

  const set = <K extends keyof TopicFormValues>(key: K, value: TopicFormValues[K]): void =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault();
    if (!values.name.trim() || !values.category.trim()) return;
    onSubmit(values);
    if (!initial) setValues(EMPTY_VALUES);
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Category</label>
        <Input
          list="topic-categories"
          value={values.category}
          onChange={(e) => set("category", e.target.value)}
          placeholder="e.g. Technical Leadership"
          required
        />
        <datalist id="topic-categories">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Topic name</label>
        <Input
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Negotiation Fundamentals"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Platform</label>
        <Input
          value={values.platform}
          onChange={(e) => set("platform", e.target.value)}
          placeholder="e.g. Coursera"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Link</label>
        <Input
          value={values.link}
          onChange={(e) => set("link", e.target.value)}
          placeholder="https://…"
          type="url"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
        <select
          value={values.status}
          onChange={(e) => set("status", e.target.value as CourseStatus)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Time to complete
        </label>
        <Input
          value={values.timeToComplete}
          onChange={(e) => set("timeToComplete", e.target.value)}
          placeholder="e.g. 6h"
        />
      </div>

      <div className="sm:col-span-2">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Description
        </label>
        <Textarea
          value={values.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="What is this topic about?"
          rows={2}
        />
      </div>

      <div className="flex items-center gap-2 sm:col-span-2">
        <Button type="submit" size="sm">
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
