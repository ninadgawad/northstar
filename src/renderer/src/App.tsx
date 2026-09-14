import { useEffect, useState } from "react";
import Sidebar, { type ViewId } from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import DashboardView from "@/components/DashboardView";
import AdminView from "@/components/AdminView";
import TaskDrawer from "@/components/TaskDrawer";
import type { Course, CourseInput, CoursePatch, CourseStatus, Goal } from "@/types";

const SELECTED_GOAL_STORAGE_KEY = "northstar:selectedGoal";
const SIDEBAR_STORAGE_KEY = "northstar:sidebarCollapsed";
const FDE_INTRODUCED_KEY = "northstar:seenFdeGoal";
const FDE_GOAL_ID = "become-a-fde";

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function App(): JSX.Element {
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string>(() =>
    loadJSON(SELECTED_GOAL_STORAGE_KEY, "")
  );
  const [activeStatus, setActiveStatus] = useState<CourseStatus | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() =>
    loadJSON(SIDEBAR_STORAGE_KEY, false)
  );
  const [activeView, setActiveView] = useState<ViewId>("dashboard");

  useEffect(() => {
    (async () => {
      const fetchedGoals = await window.api.goals.list();
      const allCourses = (
        await Promise.all(fetchedGoals.map((g) => window.api.courses.list(g.id)))
      ).flat();
      setGoals(fetchedGoals);
      setCourses(allCourses);

      const hasSeenFde = loadJSON(FDE_INTRODUCED_KEY, false);
      const fdeGoalExists = fetchedGoals.some((g) => g.id === FDE_GOAL_ID);
      if (!hasSeenFde && fdeGoalExists) {
        setSelectedGoalId(FDE_GOAL_ID);
        localStorage.setItem(FDE_INTRODUCED_KEY, JSON.stringify(true));
      } else {
        setSelectedGoalId((prev) =>
          fetchedGoals.some((g) => g.id === prev) ? prev : (fetchedGoals[0]?.id ?? "")
        );
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    localStorage.setItem(SELECTED_GOAL_STORAGE_KEY, JSON.stringify(selectedGoalId));
  }, [selectedGoalId]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const handleAddGoal = async (name: string): Promise<void> => {
    const goal = await window.api.goals.add(name);
    setGoals((prev) => [...prev, goal]);
    setSelectedGoalId(goal.id);
    setActiveView("dashboard");
  };

  const handleToggleStatus = (status: CourseStatus): void => {
    setActiveStatus((current) => (current === status ? null : status));
  };

  const handleRowClick = (course: Course): void => {
    setSelectedCourseId(course.id);
    setDrawerOpen(true);
  };

  const handleUpdateCourse = async (id: number, patch: CoursePatch): Promise<Course> => {
    const current = courses.find((c) => c.id === id);
    const finalPatch: CoursePatch = { ...patch };

    // Keep status and progress in sync: setting one derives the other,
    // unless the caller already specified both explicitly.
    if (patch.status !== undefined && patch.progress === undefined) {
      if (patch.status === "Completed") finalPatch.progress = 100;
      else if (patch.status === "Not Started") finalPatch.progress = 0;
    } else if (patch.progress !== undefined && patch.status === undefined) {
      if (patch.progress >= 100) finalPatch.status = "Completed";
      else if (patch.progress <= 0) finalPatch.status = "Not Started";
      else finalPatch.status = "In Progress";
    }

    if (finalPatch.status && !("lastCompleted" in finalPatch)) {
      if (finalPatch.status === "Completed" && !current?.lastCompleted) {
        finalPatch.lastCompleted = new Date().toISOString().slice(0, 10);
      } else if (finalPatch.status === "Not Started") {
        finalPatch.lastCompleted = null;
      }
    }

    const updated = await window.api.courses.update(id, finalPatch);
    setCourses((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  };

  const handleAddCourse = async (input: CourseInput): Promise<void> => {
    const created = await window.api.courses.add(input);
    setCourses((prev) => [...prev, created]);
  };

  const handleDeleteCourse = async (id: number): Promise<void> => {
    await window.api.courses.remove(id);
    setCourses((prev) => prev.filter((c) => c.id !== id));
    if (selectedCourseId === id) {
      setDrawerOpen(false);
      setSelectedCourseId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading Northstar…
      </div>
    );
  }

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) ?? null;
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
            <AdminView
              goals={goals}
              selectedGoal={selectedGoal}
              courses={courses}
              onAddGoal={handleAddGoal}
              onAddCourse={handleAddCourse}
              onUpdateCourse={handleUpdateCourse}
              onDeleteCourse={handleDeleteCourse}
            />
          )}
        </main>
      </div>

      <TaskDrawer
        course={selectedCourse}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onStatusChange={(id, status) => handleUpdateCourse(id, { status })}
        onProgressChange={(id, progress) => handleUpdateCourse(id, { progress })}
        onSaveNote={(id, userNote) => handleUpdateCourse(id, { userNote })}
      />
    </div>
  );
}
