import Summary from "@/components/Summary";
import CategorySection from "@/components/CategorySection";
import type { Course, CourseStatus, Goal } from "@/types";

interface DashboardViewProps {
  goal: Goal | undefined;
  courses: Course[];
  activeStatus: CourseStatus | null;
  onToggleStatus: (status: CourseStatus) => void;
  onRowClick: (course: Course) => void;
}

export default function DashboardView({
  goal,
  courses,
  activeStatus,
  onToggleStatus,
  onRowClick,
}: DashboardViewProps): JSX.Element {
  const categories = [...new Set(courses.map((c) => c.category))];

  const visibleCategories = categories
    .map((category) => ({
      category,
      courses: courses.filter(
        (c) => c.category === category && (!activeStatus || c.status === activeStatus)
      ),
    }))
    .filter((group) => group.courses.length > 0);

  if (courses.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm font-medium text-foreground">No courses yet for this goal.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add courses to <strong className="font-medium text-foreground">{goal?.name}</strong> to
          start tracking progress.
        </p>
      </div>
    );
  }

  return (
    <>
      <Summary courses={courses} activeStatus={activeStatus} onToggleStatus={onToggleStatus} />
      {visibleCategories.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No courses match this filter.
        </p>
      ) : (
        visibleCategories.map(({ category, courses: categoryCourses }) => (
          <CategorySection
            key={category}
            category={category}
            courses={categoryCourses}
            activeStatus={activeStatus}
            onStatusClick={onToggleStatus}
            onRowClick={onRowClick}
          />
        ))
      )}
    </>
  );
}
