// Northstar v1 - synthetic seed data.
// Goal: Become a CTO. Replace with real courses/notes as you go.
import type { Course, Goal } from "./types";

export const CTO_GOAL_ID = "become-a-cto";

export const INITIAL_GOALS: Goal[] = [{ id: CTO_GOAL_ID, name: "Become a CTO" }];

const CTO_COURSES: Omit<Course, "goalId">[] = [
  {
    category: "Technical Leadership",
    name: "Engineering Leadership: From Manager to Director",
    platform: "LinkedIn Learning",
    link: "https://www.linkedin.com/learning/",
    status: "Completed",
    lastCompleted: "2026-02-10",
    timeToComplete: "4h 30m",
    notes: "Good framework for scaling a team past ~30 engineers without losing technical depth.",
  },
  {
    category: "Technical Leadership",
    name: "The Staff Engineer's Path",
    platform: "O'Reilly (Book)",
    link: "https://www.oreilly.com/",
    status: "In Progress",
    lastCompleted: null,
    timeToComplete: "8h",
    notes: "On the chapter about influence without authority. Useful for the IC-to-exec bridge.",
  },
  {
    category: "Technical Leadership",
    name: "Architecting for Scale",
    platform: "Coursera",
    link: "https://www.coursera.org/",
    status: "Not Started",
    lastCompleted: null,
    timeToComplete: "12h",
    notes: "Queued after finishing the distributed systems book below.",
  },
  {
    category: "Cloud & Systems Architecture",
    name: "AWS Certified Solutions Architect - Professional",
    platform: "AWS Training",
    link: "https://aws.amazon.com/certification/",
    status: "Completed",
    lastCompleted: "2025-11-02",
    timeToComplete: "40h",
    notes:
      "Renewal due 2028. Biggest single time investment so far, worth it for credibility with infra teams.",
  },
  {
    category: "Cloud & Systems Architecture",
    name: "Designing Data-Intensive Applications",
    platform: "O'Reilly (Book)",
    link: "https://www.oreilly.com/",
    status: "In Progress",
    lastCompleted: null,
    timeToComplete: "20h",
    notes:
      "Slow read but foundational - want to be able to challenge architecture proposals directly.",
  },
  {
    category: "Cloud & Systems Architecture",
    name: "Kubernetes for Platform Engineers",
    platform: "Udemy",
    link: "https://www.udemy.com/",
    status: "Completed",
    lastCompleted: "2026-04-18",
    timeToComplete: "10h",
    notes: "Enough to have an informed opinion in platform reviews, not enough to run prod myself.",
  },
  {
    category: "Cloud & Systems Architecture",
    name: "System Design Interview Deep Dive",
    platform: "Educative",
    link: "https://www.educative.io/",
    status: "Not Started",
    lastCompleted: null,
    timeToComplete: "15h",
    notes:
      'Useful less for interviews, more for calibrating what "good" looks like when hiring architects.',
  },
  {
    category: "Business & Finance",
    name: "Finance for Non-Financial Managers",
    platform: "Coursera",
    link: "https://www.coursera.org/",
    status: "Completed",
    lastCompleted: "2026-01-05",
    timeToComplete: "6h",
    notes: "Cleared up how R&D spend actually shows up on the income statement.",
  },
  {
    category: "Business & Finance",
    name: "Reading a P&L Like a CFO",
    platform: "LinkedIn Learning",
    link: "https://www.linkedin.com/learning/",
    status: "In Progress",
    lastCompleted: null,
    timeToComplete: "3h",
    notes: "Short course, doing it alongside real board deck reviews.",
  },
  {
    category: "Business & Finance",
    name: "Startup Financial Modeling",
    platform: "Udemy",
    link: "https://www.udemy.com/",
    status: "Not Started",
    lastCompleted: null,
    timeToComplete: "5h",
    notes:
      "Want to be able to build a headcount-vs-runway model without leaning on finance for every draft.",
  },
  {
    category: "People Management",
    name: "Radical Candor",
    platform: "Book",
    link: "https://www.radicalcandor.com/",
    status: "Completed",
    lastCompleted: "2026-03-22",
    timeToComplete: "6h",
    notes: 'Reference this constantly in 1:1s now - especially the "ruinous empathy" trap.',
  },
  {
    category: "People Management",
    name: "Coaching Skills for Managers",
    platform: "Coursera",
    link: "https://www.coursera.org/",
    status: "In Progress",
    lastCompleted: null,
    timeToComplete: "5h",
    notes: "Practicing the GROW model in skip-levels this quarter.",
  },
  {
    category: "People Management",
    name: "Building High-Performing Engineering Cultures",
    platform: "Conference Talk Series",
    link: "https://www.youtube.com/",
    status: "Not Started",
    lastCompleted: null,
    timeToComplete: "4h",
    notes: "Curated playlist from LeadDev - saved for after the coaching course.",
  },
  {
    category: "Strategy & Innovation",
    name: "The CTO Playbook",
    platform: "Book",
    link: "https://www.amazon.com/",
    status: "Completed",
    lastCompleted: "2026-06-30",
    timeToComplete: "7h",
    notes:
      "Best single overview of the role split (tech strategy vs. delivery vs. people) I've read so far.",
  },
  {
    category: "Strategy & Innovation",
    name: "Technology Strategy for the C-Suite",
    platform: "Wharton Executive Education",
    link: "https://online.wharton.upenn.edu/",
    status: "In Progress",
    lastCompleted: null,
    timeToComplete: "18h",
    notes:
      "Executive cohort course - case studies are directly relevant to our build-vs-buy debates.",
  },
];

export const NORTHSTAR_COURSES: Course[] = CTO_COURSES.map((course) => ({
  ...course,
  goalId: CTO_GOAL_ID,
}));
