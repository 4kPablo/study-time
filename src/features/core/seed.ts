import type { Activity, Deadline, Resource, Session, StudyData } from "./types";

/**
 * Initial state for a brand new install. Everything starts empty so the user
 * registers their own activities, sessions, resources and deadlines; only the
 * default weekly goal is pre-set.
 */
export function seedData(): StudyData {
  const activities: Activity[] = [];
  const sessions: Session[] = [];
  const resources: Resource[] = [];
  const deadlines: Deadline[] = [];

  return {
    activities,
    sessions,
    resources,
    deadlines,
    settings: { weeklyGoalMin: 600 },
  };
}
