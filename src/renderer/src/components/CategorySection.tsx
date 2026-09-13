import { Card } from "@/components/ui/card";
import CourseTable from "@/components/CourseTable";
import type { Course } from "@/types";

interface CategorySectionProps {
  category: string;
  courses: Course[];
}

export default function CategorySection({ category, courses }: CategorySectionProps): JSX.Element {
  return (
    <section className="mb-11">
      <h2 className="mb-3.5 pl-0.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {category}
      </h2>
      <Card className="overflow-hidden">
        <CourseTable courses={courses} />
      </Card>
    </section>
  );
}
