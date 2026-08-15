import { addDays, format, subDays } from "date-fns";

import type { Activity, Deadline, Resource, Session, StudyData } from "./types";

function id(prefix: string, n: number) {
  return `${prefix}-${n}`;
}

/**
 * Initial content for a brand new install: activities, resources and deadlines
 * plus a few weeks of sample sessions so the dashboard is alive from minute one.
 */
export function seedData(): StudyData {
  const activities: Activity[] = [
    ["Matemática I", "estudio", true],
    ["Electricidad", "estudio", true],
    ["Inglés", "estudio", false],
    ["React", "desarrollo", true],
    ["Astro", "desarrollo", false],
    ["FreeCodeCamp", "desarrollo", false],
    ["Fortalecimiento", "entrenamiento", false],
    ["Caminata", "entrenamiento", false],
    ["Lectura", "personal", false],
  ].map(([name, categoryId, favorite], i) => ({
    id: id("act", i),
    name: name as string,
    categoryId: categoryId as Activity["categoryId"],
    favorite: favorite as boolean,
    createdAt: new Date().toISOString(),
  }));

  const resources: Resource[] = [
    { activityId: "act-0", label: "Apunte de práctica", url: "https://example.com", kind: "pdf" },
    { activityId: "act-0", label: "Campus virtual", url: "https://example.com", kind: "campus" },
    {
      activityId: "act-1",
      label: "Playlist teoría",
      url: "https://youtube.com",
      kind: "youtube",
    },
    { activityId: "act-3", label: "Repo del curso", url: "https://github.com", kind: "github" },
  ].map((r, i) => ({ ...r, id: id("res", i) }) as Resource);

  const today = new Date();
  const deadlines: Deadline[] = [
    {
      activityId: "act-0",
      kind: "parcial",
      title: "Primer parcial",
      date: format(addDays(today, 9), "yyyy-MM-dd"),
    },
    {
      activityId: "act-1",
      kind: "tp",
      title: "TP 3 — Circuitos",
      date: format(addDays(today, 4), "yyyy-MM-dd"),
    },
    {
      activityId: "act-2",
      kind: "final",
      title: "Final oral",
      date: format(addDays(today, 41), "yyyy-MM-dd"),
    },
  ].map((d, i) => ({ ...d, id: id("dl", i) }) as Deadline);

  const sessions: Session[] = [];
  const plan: Array<[number, string, number]> = [
    [0, "act-0", 55],
    [0, "act-3", 40],
    [1, "act-1", 75],
    [2, "act-0", 30],
    [3, "act-3", 95],
    [4, "act-2", 25],
    [5, "act-0", 120],
    [6, "act-6", 45],
    [8, "act-1", 60],
    [9, "act-3", 150],
    [10, "act-0", 35],
    [12, "act-2", 20],
    [13, "act-1", 90],
    [15, "act-0", 65],
    [16, "act-7", 50],
    [18, "act-3", 110],
    [20, "act-0", 45],
    [23, "act-1", 80],
    [26, "act-3", 70],
    [30, "act-0", 100],
  ];
  plan.forEach(([daysAgo, activityId, durationMin], i) => {
    const day = subDays(today, daysAgo);
    const startedAt = new Date(day);
    startedAt.setHours(9 + (i % 8), (i * 7) % 60, 0, 0);
    const endedAt = new Date(startedAt.getTime() + durationMin * 60_000);
    const activity = activities.find((a) => a.id === activityId)!;
    sessions.push({
      id: id("ses", i),
      activityId,
      categoryId: activity.categoryId,
      date: format(day, "yyyy-MM-dd"),
      startedAt: startedAt.toISOString(),
      endedAt: endedAt.toISOString(),
      durationMin,
      mode: "solo",
      energy: 3 + (i % 3),
      outcome: i % 4 === 0 ? "excelente" : i % 3 === 0 ? "regular" : "bien",
      distractions: i % 4,
      notes: "",
      nextStep: "",
    });
  });

  return {
    activities,
    sessions,
    resources,
    deadlines,
    settings: { weeklyGoalMin: 600 },
  };
}
