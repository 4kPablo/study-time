import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  eachDayOfInterval,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";

import type { Activity, CategoryId, Session } from "./types";

export function formatMinutes(min: number): string {
  const m = Math.max(0, Math.round(min));
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (h === 0) return `${rest}m`;
  if (rest === 0) return `${h}h`;
  return `${h}h ${rest}m`;
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

export const todayKey = () => format(new Date(), "yyyy-MM-dd");

export function totalsByDay(sessions: Session[]): Map<string, Session[]> {
  const map = new Map<string, Session[]>();
  for (const s of sessions) {
    const list = map.get(s.date);
    if (list) list.push(s);
    else map.set(s.date, [s]);
  }
  return map;
}

export const sumMinutes = (sessions: Session[]) =>
  sessions.reduce((acc, s) => acc + s.durationMin, 0);

export function minutesToday(sessions: Session[]) {
  const key = todayKey();
  return sumMinutes(sessions.filter((s) => s.date === key));
}

export function minutesThisWeek(sessions: Session[], activities: Activity[] = []) {
  const start = startOfWeek(new Date(), { weekStartsOn: 1 });
  const excluded = new Set(activities.filter((a) => !a.countsTowardGoal).map((a) => a.id));
  return sumMinutes(
    sessions.filter((s) => parseISO(s.date) >= start && !excluded.has(s.activityId)),
  );
}

/** Consecutive days with at least one session, tolerating "today not started yet". */
export function currentStreak(sessions: Session[]): number {
  const days = new Set(sessions.map((s) => s.date));
  if (days.size === 0) return 0;
  let cursor = new Date();
  if (!days.has(format(cursor, "yyyy-MM-dd"))) cursor = subDays(cursor, 1);
  let streak = 0;
  while (days.has(format(cursor, "yyyy-MM-dd"))) {
    streak += 1;
    cursor = subDays(cursor, 1);
  }
  return streak;
}

export function intensityLevel(minutes: number): 0 | 1 | 2 | 3 | 4 {
  if (minutes <= 0) return 0;
  if (minutes < 45) return 1;
  if (minutes < 90) return 2;
  if (minutes < 180) return 3;
  return 4;
}

export type CalendarRange = "1w" | "1m" | "3m" | "6m" | "all";

export const RANGE_LABEL: Record<CalendarRange, string> = {
  "1w": "1 semana",
  "1m": "1 mes",
  "3m": "3 meses",
  "6m": "6 meses",
  all: "Todo",
};

export function rangeStart(range: CalendarRange, sessions: Session[]): Date {
  const now = new Date();
  switch (range) {
    case "1w":
      return startOfWeek(now, { weekStartsOn: 1 });
    case "1m":
      return subMonths(now, 1);
    case "3m":
      return subMonths(now, 3);
    case "6m":
      return subMonths(now, 6);
    case "all": {
      const first = sessions.reduce<string | null>(
        (min, s) => (min === null || s.date < min ? s.date : min),
        null,
      );
      return first ? parseISO(first) : subMonths(now, 3);
    }
  }
}

export interface CalendarDay {
  date: Date;
  key: string;
  minutes: number;
  sessions: Session[];
  level: 0 | 1 | 2 | 3 | 4;
}

export function buildCalendar(sessions: Session[], range: CalendarRange): CalendarDay[] {
  const start = startOfWeek(rangeStart(range, sessions), { weekStartsOn: 1 });
  const end = new Date();
  const byDay = totalsByDay(sessions);
  return eachDayOfInterval({ start, end }).map((date) => {
    const key = format(date, "yyyy-MM-dd");
    const list = byDay.get(key) ?? [];
    const minutes = sumMinutes(list);
    return { date, key, minutes, sessions: list, level: intensityLevel(minutes) };
  });
}

export interface WeekDay extends CalendarDay {
  /** Days after today, shown as placeholders. */
  future: boolean;
}

/** The current week (Monday→Sunday): today and past days carry data, the rest are `future`. */
export function buildWeek(sessions: Session[]): WeekDay[] {
  const start = startOfWeek(new Date(), { weekStartsOn: 1 });
  const byDay = totalsByDay(sessions);
  const today = todayKey();
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(start, i);
    const key = format(date, "yyyy-MM-dd");
    const list = byDay.get(key) ?? [];
    const minutes = sumMinutes(list);
    return {
      date,
      key,
      minutes,
      sessions: list,
      level: intensityLevel(minutes),
      future: key > today,
    };
  });
}

export interface MonthDay extends CalendarDay {
  /** Days after today, shown as placeholders. */
  future: boolean;
}

export interface MonthHeat {
  /** "yyyy-MM" */
  key: string;
  /** Capitalized Spanish month name (+ year for "all"). */
  label: string;
  /** Index = day of month - 1 (1→31); `null` for days beyond the month. */
  days: (MonthDay | null)[];
}

/** One row per calendar month, columns = days of the month, most recent month first. */
export function buildMonthlyHeat(sessions: Session[], range: CalendarRange): MonthHeat[] {
  const now = new Date();
  const today = todayKey();
  const byDay = totalsByDay(sessions);

  let first: Date;
  if (range === "1m") {
    first = startOfMonth(now);
  } else if (range === "3m") {
    first = startOfMonth(subMonths(now, 2));
  } else if (range === "6m") {
    first = startOfMonth(subMonths(now, 5));
  } else {
    const firstDate = sessions.reduce<string | null>(
      (min, s) => (min === null || s.date < min ? s.date : min),
      null,
    );
    first = firstDate ? startOfMonth(parseISO(firstDate)) : startOfMonth(now);
  }

  const months: MonthHeat[] = [];
  for (let month = first; month <= now; month = addMonths(month, 1)) {
    const key = format(month, "yyyy-MM");
    const daysInMonth = differenceInCalendarDays(addMonths(month, 1), month);
    const days: (MonthDay | null)[] = [];
    for (let dayNum = 1; dayNum <= 31; dayNum++) {
      if (dayNum > daysInMonth) {
        days.push(null);
        continue;
      }
      const date = new Date(month.getFullYear(), month.getMonth(), dayNum);
      const dateKey = format(date, "yyyy-MM-dd");
      if (dateKey > today) {
        days.push({ date, key: dateKey, minutes: 0, sessions: [], level: 0, future: true });
        continue;
      }
      const list = byDay.get(dateKey) ?? [];
      const minutes = sumMinutes(list);
      days.push({
        date,
        key: dateKey,
        minutes,
        sessions: list,
        level: intensityLevel(minutes),
        future: false,
      });
    }
    const name = format(month, "MMMM", { locale: es });
    const label = `${name.charAt(0).toUpperCase()}${name.slice(1)}${range === "all" ? ` ${month.getFullYear()}` : ""}`;
    months.push({ key, label, days });
  }
  return months.reverse();
}

/** Continuous GitHub-style grid: weeks (Mon–Sun) oldest→newest, no month grouping. */
export function buildGitHubHeat(sessions: Session[], range: CalendarRange): WeekDay[][] {
  const start = startOfWeek(rangeStart(range, sessions), { weekStartsOn: 1 });
  const today = todayKey();
  const byDay = totalsByDay(sessions);
  const weeks: WeekDay[][] = [];
  for (let weekStart = start; weekStart <= new Date(); weekStart = addDays(weekStart, 7)) {
    const week: WeekDay[] = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i);
      const key = format(date, "yyyy-MM-dd");
      const list = byDay.get(key) ?? [];
      const minutes = sumMinutes(list);
      week.push({
        date,
        key,
        minutes,
        sessions: list,
        level: intensityLevel(minutes),
        future: key > today,
      });
    }
    weeks.push(week);
  }
  return weeks;
}

export function weeklySeries(sessions: Session[], weeks = 12) {
  const start = startOfWeek(subDays(new Date(), weeks * 7), { weekStartsOn: 1 });
  const buckets = new Map<string, number>();
  for (let i = 0; i <= weeks; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i * 7);
    buckets.set(format(d, "yyyy-MM-dd"), 0);
  }
  for (const s of sessions) {
    const key = format(startOfWeek(parseISO(s.date), { weekStartsOn: 1 }), "yyyy-MM-dd");
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + s.durationMin);
  }
  return [...buckets.entries()].map(([key, minutes]) => ({
    week: format(parseISO(key), "dd/MM"),
    hours: Math.round((minutes / 60) * 10) / 10,
  }));
}

const EMPTY_CATEGORY_BUCKET: Record<CategoryId, number> = {
  estudio: 0,
  desarrollo: 0,
  entrenamiento: 0,
  personal: 0,
};

/** Per-week totals split by category, ready for stacked bars. */
export function weeklySeriesByCategory(sessions: Session[], weeks = 12) {
  const start = startOfWeek(subDays(new Date(), weeks * 7), { weekStartsOn: 1 });
  const buckets = new Map<string, Record<CategoryId, number>>();
  for (let i = 0; i <= weeks; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i * 7);
    buckets.set(format(d, "yyyy-MM-dd"), { ...EMPTY_CATEGORY_BUCKET });
  }
  for (const s of sessions) {
    const key = format(startOfWeek(parseISO(s.date), { weekStartsOn: 1 }), "yyyy-MM-dd");
    const bucket = buckets.get(key);
    if (bucket) bucket[s.categoryId] += s.durationMin;
  }
  return [...buckets.entries()].map(([key, cats]) => ({
    week: format(parseISO(key), "dd/MM"),
    ...Object.fromEntries(
      (Object.keys(cats) as CategoryId[]).map((c) => [c, Math.round((cats[c] / 60) * 10) / 10]),
    ),
  }));
}

export function minutesByCategory(sessions: Session[]) {
  const map = new Map<CategoryId, number>();
  for (const s of sessions) map.set(s.categoryId, (map.get(s.categoryId) ?? 0) + s.durationMin);
  return map;
}

export function summaryStats(sessions: Session[]) {
  const days = totalsByDay(sessions);
  const activeDays = days.size;
  const total = sumMinutes(sessions);
  const first = sessions.reduce<string | null>(
    (min, s) => (min === null || s.date < min ? s.date : min),
    null,
  );
  const spanDays = first
    ? Math.max(1, differenceInCalendarDays(new Date(), parseISO(first)) + 1)
    : 1;
  const longest = sessions.reduce((max, s) => Math.max(max, s.durationMin), 0);
  return {
    totalMinutes: total,
    activeDays,
    dailyAverage: activeDays ? total / activeDays : 0,
    weeklyAverage: total / Math.max(1, spanDays / 7),
    longestSession: longest,
    streak: currentStreak(sessions),
  };
}

export function daysUntil(dateKey: string) {
  return differenceInCalendarDays(parseISO(dateKey), new Date());
}

/** Relative label for a past date: "Hoy", "Ayer", "Anteayer", "Hace X días/semanas/meses". */
export function relativeDay(dateKey: string): string {
  const days = differenceInCalendarDays(new Date(), parseISO(dateKey));
  if (days <= 0) return "Hoy";
  if (days === 1) return "Ayer";
  if (days === 2) return "Anteayer";
  if (days < 7) return `Hace ${days} días`;
  if (days < 14) return "Hace una semana";
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `Hace ${weeks} semanas`;
  const months = Math.floor(days / 30);
  if (months < 12) return `Hace ${months} ${months === 1 ? "mes" : "meses"}`;
  const years = Math.floor(days / 365);
  return `Hace ${years} ${years === 1 ? "año" : "años"}`;
}
