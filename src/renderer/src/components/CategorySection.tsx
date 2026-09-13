import { Card } from "@/components/ui/card";
import CourseTable from "@/components/CourseTable";
import type { Course, CourseStatus } from "@/types";

interface CategorySectionProps {
  category: string;
  courses: Course[];
  activeStatus?: CourseStatus | null;
  onStatusClick?: (status: CourseStatus) => void;
}

export default function CategorySection({
  category,
  courses,
  activeStatus,
  onStatusClick,
}: CategorySectionProps): JSX.Element {
  return (
    <section className="mb-5">
      <h2 className="mb-2 pl-0.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {category}
      </h2>
      <Card className="overflow-hidden">
        <CourseTable courses={courses} activeStatus={activeStatus} onStatusClick={onStatusClick} />
      </Card>
    </section>
  );
}
