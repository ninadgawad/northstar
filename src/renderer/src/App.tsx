import { useEffect, useState } from "react";
import Sidebar, { type ViewId } from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import DashboardView from "@/components/DashboardView";
import AdminView from "@/components/AdminView";
import TaskDrawer from "@/components/TaskDrawer";
import { INITIAL_GOALS, NORTHSTAR_COURSES } from "@/data";
import type { Course, CourseStatus, Goal } from "@/types";

const NOTES_STORAGE_KEY = "northstar:notes";
const GOALS_STORAGE_KEY = "northstar:goals";
const SELECTED_GOAL_STORAGE_KEY = "northstar:selectedGoal";
const SIDEBAR_STORAGE_KEY = "northstar:sidebarCollapsed";

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function slugify(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return base || `goal-${Date.now()}`;
}

export default function App(): JSX.Element {
  const [goals, setGoals] = useState<Goal[]>(() => loadJSON(GOALS_STORAGE_KEY, INITIAL_GOALS));
  const [selectedGoalId, setSelectedGoalId] = useState<string>(() =>
    loadJSON(SELECTED_GOAL_STORAGE_KEY, INITIAL_GOALS[0].id)
  );
  const [courses, setCourses] = useState<Course[]>(NORTHSTAR_COURSES);
  const [notes, setNotes] = useState<Record<string, string>>(() => loadJSON(NOTES_STORAGE_KEY, {}));
  const [activeStatus, setActiveStatus] = useState<CourseStatus | null>(null);
  const [selectedCourseName, setSelectedCourseName] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() =>
    loadJSON(SIDEBAR_STORAGE_KEY, false)
  );
  const [activeView, setActiveView] = useState<ViewId>("dashboard");

  useEffect(() => {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem(SELECTED_GOAL_STORAGE_KEY, JSON.stringify(selectedGoalId));
  }, [selectedGoalId]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const handleAddGoal = (name: string): void => {
    const id = slugify(name);
    setGoals((prev) => (prev.some((g) => g.id === id) ? prev : [...prev, { id, name }]));
    setSelectedGoalId(id);
    setActiveView("dashboard");
  };

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

  const selectedCourse = courses.find((c) => c.name === selectedCourseName) ?? null;
  const goalCourses = courses.filter((c) => c.goalId === selectedGoalId);
  const selectedGoal = goals.find((g) => g.id === selectedGoalId);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
        activeView={activeView}
        onNavigate={setActiveView}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar
          title={activeView === "dashboard" ? "Dashboard" : "Admin"}
          goals={goals}
          selectedGoalId={selectedGoalId}
          onSelectGoal={setSelectedGoalId}
          onManageGoals={() => setActiveView("admin")}
        />

        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {activeView === "dashboard" ? (
            <DashboardView
              goal={selectedGoal}
              courses={goalCourses}
              activeStatus={activeStatus}
              onToggleStatus={handleToggleStatus}
              onRowClick={handleRowClick}
            />
          ) : (
            <AdminView goals={goals} courses={courses} onAddGoal={handleAddGoal} />
          )}
        </main>
      </div>

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
