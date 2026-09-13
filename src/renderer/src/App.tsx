import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Summary from "@/components/Summary";
import CategorySection from "@/components/CategorySection";
import TaskDrawer from "@/components/TaskDrawer";
import { NORTHSTAR_GOAL, NORTHSTAR_COURSES } from "@/data";
import type { Course, CourseStatus } from "@/types";

const NOTES_STORAGE_KEY = "northstar:notes";

function loadNotes(): Record<string, string> {
  try {
    const raw = localStorage.getItem(NOTES_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export default function App(): JSX.Element {
  const [courses, setCourses] = useState<Course[]>(NORTHSTAR_COURSES);
  const [notes, setNotes] = useState<Record<string, string>>(() => loadNotes());
  const [activeStatus, setActiveStatus] = useState<CourseStatus | null>(null);
  const [selectedCourseName, setSelectedCourseName] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  const handleToggleStatus = (status: CourseStatus): void => {
    setActiveStatus((current) => (current === status ? null : status));
  };

  const handleRowClick = (course: Course): void => {
    setSelectedCourseName(course.name);
    setDrawerOpen(true);
  };

  const handleCourseStatusChange = (courseName: string, status: CourseStatus): void => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.name !== courseName) return c;
        if (status === "Completed" && !c.lastCompleted) {
          return { ...c, status, lastCompleted: new Date().toISOString().slice(0, 10) };
        }
        if (status === "Not Started") {
          return { ...c, status, lastCompleted: null };
        }
        return { ...c, status };
      })
    );
  };

  const handleSaveNote = (courseName: string, note: string): void => {
    setNotes((prev) => ({ ...prev, [courseName]: note }));
  };

  const categories = useMemo(() => [...new Set(courses.map((c) => c.category))], [courses]);

  const visibleCategories = useMemo(
    () =>
      categories
        .map((category) => ({
          category,
          courses: courses.filter(
            (c) => c.category === category && (!activeStatus || c.status === activeStatus)
          ),
        }))
        .filter((group) => group.courses.length > 0),
    [categories, courses, activeStatus]
  );

  const selectedCourse = courses.find((c) => c.name === selectedCourseName) ?? null;

  return (
    <div className="w-full px-4 py-5 sm:px-6">
      <Header goal={NORTHSTAR_GOAL} />
      <Summary courses={courses} activeStatus={activeStatus} onToggleStatus={handleToggleStatus} />
      <main>
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
              onStatusClick={handleToggleStatus}
              onRowClick={handleRowClick}
            />
          ))
        )}
      </main>
      <p className="mt-6 text-center text-xs text-muted-foreground">Seeded with sample data · v1</p>

      <TaskDrawer
        course={selectedCourse}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onStatusChange={handleCourseStatusChange}
        note={selectedCourseName ? (notes[selectedCourseName] ?? "") : ""}
        onSaveNote={handleSaveNote}
      />
    </div>
  );
}
