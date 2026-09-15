import { useEffect, useMemo, useRef, useState } from "react";
import Sidebar, { type ViewId } from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import DashboardView from "@/components/DashboardView";
import AdminView from "@/components/AdminView";
import RoadmapView from "@/components/RoadmapView";
import FocusTimerView, {
  type BeginFocusInput,
  type FocusPhase,
} from "@/components/FocusTimerView";
import TaskDrawer from "@/components/TaskDrawer";
import SessionJournalDialog from "@/components/SessionJournalDialog";
import WeeklyRecapDialog from "@/components/WeeklyRecapDialog";
import { pickEncouragement } from "@/lib/encouragement";
import { playAlarm } from "@/lib/sound";
import { localDayKey, previousWeekRange, thisWeekRange, weekKey } from "@/lib/dates";
import { rankNextUp } from "@/lib/nextUp";
import { appendSessionNote, formatSessionLine } from "@/lib/journal";
import { computeStreaks, computeWeekStats } from "@/lib/stats";
import { buildRecap } from "@/lib/recap";
import type {
  Course,
  CourseEvent,
  CourseInput,
  CoursePatch,
  CourseStatus,
  FocusSession,
  Goal,
  GoalPatch,
} from "@/types";
import { formatCountdown } from "@/utils";

const SELECTED_GOAL_STORAGE_KEY = "northstar:selectedGoal";
const SIDEBAR_STORAGE_KEY = "northstar:sidebarCollapsed";
const FDE_INTRODUCED_KEY = "northstar:seenFdeGoal";
const FDE_GOAL_ID = "become-a-fde";
const LAST_RECAP_WEEK_KEY = "northstar:lastRecapWeek";

const VIEW_TITLES: Record<ViewId, string> = {
  dashboard: "Dashboard",
  roadmap: "Roadmap",
  focus: "Focus Timer",
  admin: "Admin",
};

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
  const [recapOpen, setRecapOpen] = useState(false);
  const [recapIsAuto, setRecapIsAuto] = useState(false);

  const [focusPhase, setFocusPhase] = useState<FocusPhase>("idle");
  const [focusTaskId, setFocusTaskId] = useState<number | null>(null);
  const [focusTaskText, setFocusTaskText] = useState("");
  const [focusEndAt, setFocusEndAt] = useState<number | null>(null);
  const [focusEndedAt, setFocusEndedAt] = useState<number | null>(null);
  const [focusTotalMs, setFocusTotalMs] = useState(0);
  const [focusStartedAt, setFocusStartedAt] = useState<number | null>(null);
  const [focusMessage, setFocusMessage] = useState("");
  const [now, setNow] = useState(() => Date.now());

  // Activity log (focus sessions + status/progress transitions), shared by the
  // Streaks, Roadmap, and Smart Focus features.
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [events, setEvents] = useState<CourseEvent[]>([]);
  // Guards the timer-completion effect against firing twice for the same
  // session (e.g. a React re-render after `courses` changes).
  const focusSeq = useRef(0);
  const completedSeq = useRef(0);

  const nextUp = useMemo(() => rankNextUp(courses, sessions), [courses, sessions]);

  useEffect(() => {
    (async () => {
      const [fetchedGoals, fetchedSessions, fetchedEvents] = await Promise.all([
        window.api.goals.list(),
        window.api.sessions.list(),
        window.api.events.list(),
      ]);
      const allCourses = (
        await Promise.all(fetchedGoals.map((g) => window.api.courses.list(g.id)))
      ).flat();
      setGoals(fetchedGoals);
      setCourses(allCourses);
      setSessions(fetchedSessions);
      setEvents(fetchedEvents);

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
      if (loadJSON(LAST_RECAP_WEEK_KEY, "") !== weekKey(new Date())) {
        setRecapIsAuto(true);
        setRecapOpen(true);
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

  useEffect(() => {
    if (focusPhase !== "running") return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [focusPhase]);

  /** Records one focus_sessions row. Task/goal are snapshotted at record time. */
  const recordSession = (completed: boolean, endedAtMs: number, minutesOverride?: number): void => {
    if (focusStartedAt === null) return;
    const boundCourse = focusTaskId !== null ? courses.find((c) => c.id === focusTaskId) : null;
    const minutes = minutesOverride ?? Math.round((endedAtMs - focusStartedAt) / 60_000);
    if (!completed && minutes < 1) return;
    void window.api.sessions
      .add({
        goalId: boundCourse?.goalId ?? selectedGoalId,
        courseId: focusTaskId,
        task: boundCourse?.name ?? (focusTaskText || "Untitled task"),
        minutes,
        startedAt: new Date(focusStartedAt).toISOString(),
        endedAt: new Date(endedAtMs).toISOString(),
        completed,
      })
      .then((s) => setSessions((prev) => [...prev, s]));
  };

  useEffect(() => {
    if (focusPhase !== "running" || focusEndAt === null || now < focusEndAt) return;
    if (completedSeq.current === focusSeq.current) return;
    completedSeq.current = focusSeq.current;

    const plannedEnd = focusEndAt;
    const boundCourseStillExists =
      focusTaskId !== null && courses.some((c) => c.id === focusTaskId);
    playAlarm();
    setFocusMessage(pickEncouragement());
    setFocusEndAt(null);
    setFocusEndedAt(plannedEnd);
    recordSession(true, plannedEnd, Math.round(focusTotalMs / 60_000));
    setFocusPhase(boundCourseStillExists ? "journal" : "done");
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      const task = courses.find((c) => c.id === focusTaskId);
      new Notification("Focus session complete! 🎉", {
        body: task ? `You focused on "${task.name}". Nice work!` : "Nice work!",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, focusPhase, focusEndAt, focusTaskId, courses]);

  const handleBeginFocusSession = (input: BeginFocusInput, minutes: number): void => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      void Notification.requestPermission();
    }
    const totalMs = minutes * 60_000;
    focusSeq.current += 1;
    setFocusTaskId(input.courseId);
    setFocusTaskText(input.task);
    setFocusTotalMs(totalMs);
    setFocusStartedAt(Date.now());
    setFocusEndAt(Date.now() + totalMs);
    setFocusPhase("running");
  };

  const handleCancelFocusSession = (): void => {
    completedSeq.current = focusSeq.current;
    recordSession(false, Date.now());
    setFocusPhase("idle");
    setFocusEndAt(null);
    setFocusTaskId(null);
    setFocusTaskText("");
    setFocusStartedAt(null);
  };

  const handleDismissFocusDone = (): void => {
    setFocusPhase("idle");
    setFocusTaskId(null);
    setFocusTaskText("");
    setFocusStartedAt(null);
    setFocusEndedAt(null);
    setFocusMessage("");
  };

  const journalCourse =
    focusPhase === "journal" && focusTaskId !== null
      ? (courses.find((c) => c.id === focusTaskId) ?? null)
      : null;

  const handleSaveJournal = async (result: {
    text: string;
    progress: number | null;
  }): Promise<void> => {
    const course = journalCourse;
    if (!course || focusEndedAt === null) {
      handleDismissFocusDone();
      return;
    }
    const minutes = Math.round(focusTotalMs / 60_000);
    const patch: CoursePatch = {};
    if (result.text) {
      const line = formatSessionLine(new Date(focusEndedAt), minutes, result.text);
      patch.userNote = appendSessionNote(course.userNote, line);
    }
    if (result.progress !== null) {
      patch.progress = result.progress;
    }
    patch.updatedAt = new Date().toISOString();
    await handleUpdateCourse(course.id, patch);
    handleDismissFocusDone();
  };

  const handleSkipJournal = (): void => {
    handleDismissFocusDone();
  };

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
        finalPatch.lastCompleted = localDayKey(new Date());
      } else if (finalPatch.status === "Not Started") {
        finalPatch.lastCompleted = null;
      }
    }

    // Stamp "last touched" for any learning-relevant change (not a link/platform rename).
    if (
      !("updatedAt" in finalPatch) &&
      ("status" in patch || "progress" in patch || "userNote" in patch)
    ) {
      finalPatch.updatedAt = new Date().toISOString();
    }

    const updated = await window.api.courses.update(id, finalPatch);
    setCourses((prev) => prev.map((c) => (c.id === id ? updated : c)));

    if (current && (current.status !== updated.status || current.progress !== updated.progress)) {
      void window.api.events
        .add({
          courseId: id,
          goalId: updated.goalId,
          courseName: updated.name,
          fromStatus: current.status,
          toStatus: updated.status,
          fromProgress: current.progress,
          toProgress: updated.progress,
          at: new Date().toISOString(),
        })
        .then((ev) => setEvents((prev) => [...prev, ev]));
    }

    return updated;
  };

  const handleUpdateGoal = async (id: string, patch: GoalPatch): Promise<void> => {
    const updated = await window.api.goals.update(id, patch);
    setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
  };

  const handleMoveCourse = (id: number, direction: "up" | "down"): void => {
    const course = courses.find((c) => c.id === id);
    if (!course) return;
    const siblings = courses
      .filter((c) => c.goalId === course.goalId)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
    const index = siblings.findIndex((c) => c.id === id);
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= siblings.length) return;
    const sibling = siblings[swapIndex];
    void handleUpdateCourse(course.id, { sortOrder: sibling.sortOrder });
    void handleUpdateCourse(sibling.id, { sortOrder: course.sortOrder });
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
    if (focusTaskId === id) {
      // The bound course is gone; the timer degrades to a free-text task
      // using the name it already snapshotted.
      setFocusTaskId(null);
      if (focusPhase === "journal") setFocusPhase("done");
    }
  };

  const weekStats = useMemo(
    () => computeWeekStats(sessions, events, thisWeekRange(new Date())),
    [sessions, events]
  );

  const recap = useMemo(() => {
    const referenceNow = new Date();
    return buildRecap(
      sessions,
      events,
      goals,
      previousWeekRange(referenceNow),
      computeStreaks(sessions, referenceNow)
    );
  }, [sessions, events, goals]);

  const handleRecapOpenChange = (open: boolean): void => {
    setRecapOpen(open);
    if (!open && recapIsAuto) {
      localStorage.setItem(LAST_RECAP_WEEK_KEY, JSON.stringify(weekKey(new Date())));
      setRecapIsAuto(false);
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
  const goalCourses = courses
    .filter((c) => c.goalId === selectedGoalId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
  const selectedGoal = goals.find((g) => g.id === selectedGoalId);
  const focusBadge = focusPhase === "running" && focusEndAt !== null
    ? formatCountdown(focusEndAt - now)
    : null;
  const focusLabel = focusPhase === "running" ? focusTaskText || null : null;
  const viewTitle = VIEW_TITLES[activeView];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
        activeView={activeView}
        onNavigate={setActiveView}
        focusBadge={focusBadge}
        focusLabel={focusLabel}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar
          title={viewTitle}
          goals={goals}
          selectedGoalId={selectedGoalId}
          onSelectGoal={setSelectedGoalId}
          onManageGoals={() => setActiveView("admin")}
          showGoalSwitcher={activeView !== "focus"}
        />

        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {activeView === "dashboard" && (
            <DashboardView
              goal={selectedGoal}
              courses={goalCourses}
              activeStatus={activeStatus}
              onToggleStatus={handleToggleStatus}
              onRowClick={handleRowClick}
              weekStats={weekStats}
              onOpenRecap={() => {
                setRecapIsAuto(false);
                setRecapOpen(true);
              }}
            />
          )}
          {activeView === "roadmap" && (
            <RoadmapView
              goal={selectedGoal}
              courses={goalCourses}
              onTopicClick={handleRowClick}
              onGoToAdmin={() => setActiveView("admin")}
            />
          )}
          {activeView === "focus" && (
            <FocusTimerView
              goals={goals}
              courses={courses}
              phase={focusPhase}
              remainingMs={focusEndAt !== null ? Math.max(0, focusEndAt - now) : 0}
              totalMs={focusTotalMs}
              courseId={focusTaskId}
              taskText={focusTaskText}
              nextUp={nextUp}
              now={now}
              message={focusMessage}
              onBegin={handleBeginFocusSession}
              onCancel={handleCancelFocusSession}
              onDismissDone={handleDismissFocusDone}
            />
          )}
          {activeView === "admin" && (
            <AdminView
              goals={goals}
              selectedGoal={selectedGoal}
              courses={courses}
              onAddGoal={handleAddGoal}
              onAddCourse={handleAddCourse}
              onUpdateCourse={handleUpdateCourse}
              onDeleteCourse={handleDeleteCourse}
              onUpdateGoal={handleUpdateGoal}
              onMoveCourse={handleMoveCourse}
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

      {journalCourse && focusEndedAt !== null && (
        <SessionJournalDialog
          key={focusEndedAt}
          open={focusPhase === "journal"}
          course={journalCourse}
          minutes={Math.round(focusTotalMs / 60_000)}
          endedAt={focusEndedAt}
          onSave={handleSaveJournal}
          onSkip={handleSkipJournal}
        />
      )}

      <WeeklyRecapDialog open={recapOpen} onOpenChange={handleRecapOpenChange} recap={recap} />
    </div>
  );
}
