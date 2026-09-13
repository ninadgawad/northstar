import { useMemo, useState } from "react";
import Header from "@/components/Header";
import Summary from "@/components/Summary";
import CategorySection from "@/components/CategorySection";
import { NORTHSTAR_GOAL, NORTHSTAR_COURSES } from "@/data";
import type { CourseStatus } from "@/types";

export default function App(): JSX.Element {
  const [activeStatus, setActiveStatus] = useState<CourseStatus | null>(null);

  const handleToggleStatus = (status: CourseStatus): void => {
    setActiveStatus((current) => (current === status ? null : status));
  };

  const categories = useMemo(
    () => [...new Set(NORTHSTAR_COURSES.map((c) => c.category))],
    []
  );

  const visibleCategories = useMemo(
    () =>
      categories
        .map((category) => ({
          category,
          courses: NORTHSTAR_COURSES.filter(
            (c) => c.category === category && (!activeStatus || c.status === activeStatus)
          ),
        }))
        .filter((group) => group.courses.length > 0),
    [categories, activeStatus]
  );

  return (
    <div className="w-full px-4 py-5 sm:px-6">
      <Header goal={NORTHSTAR_GOAL} />
      <Summary
        courses={NORTHSTAR_COURSES}
        activeStatus={activeStatus}
        onToggleStatus={handleToggleStatus}
      />
      <main>
        {visibleCategories.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No courses match this filter.
          </p>
        ) : (
          visibleCategories.map(({ category, courses }) => (
            <CategorySection
              key={category}
              category={category}
              courses={courses}
              activeStatus={activeStatus}
              onStatusClick={handleToggleStatus}
            />
          ))
        )}
      </main>
      <p className="mt-6 text-center text-xs text-muted-foreground">Seeded with sample data · v1</p>
    </div>
  );
}
