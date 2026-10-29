import type { Challenge, Profile, Workout, WorkoutStatus } from "../types";
import { addDays, addMonths, formatDay, inRange, rangeKeys, startOfMonth, startOfWeek, todayKey } from "./dates";

// All dashboard numbers are derived here from the workout list, so every
// section of the UI stays consistent with the same underlying data.

export function statusOf(w: Workout, today = todayKey()): WorkoutStatus {
  if (w.status === "scheduled" && w.date < today) return "missed";
  return w.status;
}

/** Live progress (0–100) of a started workout based on elapsed time. */
export function liveProgress(w: Workout, now = Date.now()): number {
  if (w.status === "completed") return 100;
  if (w.status !== "in_progress" || !w.startedAt) return 0;
  const elapsed = (now - new Date(w.startedAt).getTime()) / 60_000;
  return Math.max(1, Math.min(99, Math.round((elapsed / w.durationMin) * 100)));
}

export const completedIn = (ws: Workout[], start: string, end: string) =>
  ws.filter((w) => w.status === "completed" && inRange(w.date, start, end));

export interface Totals {
  workouts: number;
  minutes: number;
  calories: number;
  distanceKm: number;
}

export function totals(ws: Workout[]): Totals {
  return ws.reduce<Totals>(
    (acc, w) => ({
      workouts: acc.workouts + 1,
      minutes: acc.minutes + w.durationMin,
      calories: acc.calories + w.calories,
      distanceKm: acc.distanceKm + (w.distanceKm ?? 0),
    }),
    { workouts: 0, minutes: 0, calories: 0, distanceKm: 0 },
  );
}

export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

function activeDays(ws: Workout[]): Set<string> {
  return new Set(ws.filter((w) => w.status === "completed").map((w) => w.date));
}

/** Consecutive days with a completed workout, ending today (or yesterday if today has none yet). */
export function currentStreak(ws: Workout[], today = todayKey()): number {
  const days = activeDays(ws);
  let cursor = days.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function bestStreak(ws: Workout[]): number {
  const sorted = [...activeDays(ws)].sort();
  let best = 0;
  let run = 0;
  let prev = "";
  for (const day of sorted) {
    run = prev && addDays(prev, 1) === day ? run + 1 : 1;
    best = Math.max(best, run);
    prev = day;
  }
  return best;
}

export type Metric = "calories" | "minutes" | "workouts";

export function metricOf(ws: Workout[], metric: Metric): number {
  const t = totals(ws);
  return metric === "calories" ? t.calories : metric === "minutes" ? t.minutes : t.workouts;
}

export interface DayPoint {
  date: string;
  label: string;
  value: number;
  isToday: boolean;
}

export function dailySeries(ws: Workout[], start: string, days: number, metric: Metric, today = todayKey()): DayPoint[] {
  return rangeKeys(start, days).map((date) => ({
    date,
    label: formatDay(date, { weekday: "short" }),
    value: metricOf(completedIn(ws, date, date), metric),
    isToday: date === today,
  }));
}

export interface PeriodSummary {
  current: Totals;
  previous: Totals;
}

/** Rolling 30-day window ending today vs the 30 days before it. */
export function last30Summary(ws: Workout[], today = todayKey()): PeriodSummary {
  return {
    current: totals(completedIn(ws, addDays(today, -29), today)),
    previous: totals(completedIn(ws, addDays(today, -59), addDays(today, -30))),
  };
}

export function weekTotals(ws: Workout[], weekStart: string): Totals {
  return totals(completedIn(ws, weekStart, addDays(weekStart, 6)));
}

export function weeklyGoalProgress(ws: Workout[], profile: Profile, today = todayKey()) {
  const t = weekTotals(ws, startOfWeek(today));
  const { workouts, minutes } = profile.weeklyGoal;
  const pct = Math.round(((Math.min(t.workouts / workouts, 1) + Math.min(t.minutes / minutes, 1)) / 2) * 100);
  return { ...t, pct, goal: profile.weeklyGoal };
}

export interface MonthPoint {
  month: string;
  label: string;
  workouts: number;
  minutes: number;
}

export function monthlySeries(ws: Workout[], months: number, today = todayKey()): MonthPoint[] {
  const first = addMonths(startOfMonth(today), -(months - 1));
  return Array.from({ length: months }, (_, i) => {
    const start = addMonths(first, i);
    const end = addDays(addMonths(start, 1), -1);
    const t = totals(completedIn(ws, start, end));
    return { month: start, label: formatDay(start, { month: "short" }), workouts: t.workouts, minutes: t.minutes };
  });
}

export interface WeekPoint {
  weekStart: string;
  label: string;
  minutes: number;
  workouts: number;
  goalMet: boolean;
}

export function weeklySeries(ws: Workout[], weeks: number, profile: Profile, today = todayKey()): WeekPoint[] {
  const thisWeek = startOfWeek(today);
  return Array.from({ length: weeks }, (_, i) => {
    const weekStart = addDays(thisWeek, -7 * (weeks - 1 - i));
    const t = weekTotals(ws, weekStart);
    return {
      weekStart,
      label: formatDay(weekStart, { month: "short", day: "numeric" }),
      minutes: t.minutes,
      workouts: t.workouts,
      goalMet: t.workouts >= profile.weeklyGoal.workouts && t.minutes >= profile.weeklyGoal.minutes,
    };
  });
}

export function challengeProgress(ch: Challenge, ws: Workout[], today = todayKey()) {
  const end = ch.endDate < today ? ch.endDate : today;
  const relevant = completedIn(ws, ch.startDate, end).filter((w) => !ch.category || w.category === ch.category);
  const t = totals(relevant);
  const value =
    ch.metric === "workouts" ? t.workouts
    : ch.metric === "minutes" ? t.minutes
    : ch.metric === "distance" ? Math.round(t.distanceKm * 10) / 10
    : currentStreak(ws, today);
  return { value, pct: Math.min(100, Math.round((value / ch.target) * 100)), done: value >= ch.target };
}
