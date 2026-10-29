import { Award, Flame, Medal, Mountain, Sunrise, Target, Timer, Trophy, type LucideIcon } from "lucide-react";
import type { Profile, Workout } from "../types";
import { addDays, todayKey } from "./dates";
import { bestStreak, completedIn, totals, weeklySeries } from "./stats";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  /** Gradient stops for the badge medallion */
  colors: [string, string];
  value: number;
  target: number;
  earned: boolean;
}

/** Badges are computed from the workout history; nothing is awarded by hand. */
export function computeAchievements(ws: Workout[], profile: Profile, today = todayKey()): Achievement[] {
  const done = ws.filter((w) => w.status === "completed");
  const all = totals(done);
  const runKm30 = totals(completedIn(ws, addDays(today, -29), today).filter((w) => w.category === "running")).distanceKm;
  const earlyBird = done.filter((w) => w.time && w.time < "07:00").length;
  const strength = done.filter((w) => w.category === "strength").length;
  const goalWeeks = weeklySeries(ws, 12, profile, today).filter((w) => w.goalMet).length;

  const defs: Omit<Achievement, "earned">[] = [
    { id: "first-step", title: "First Step", description: "Complete your first workout", icon: Medal, colors: ["#C6FF3D", "#42E8E0"], value: all.workouts, target: 1 },
    { id: "streak-7", title: "Week Warrior", description: "Train 7 days in a row", icon: Flame, colors: ["#FF6B35", "#FFB547"], value: bestStreak(ws), target: 7 },
    { id: "streak-14", title: "Unbreakable", description: "Train 14 days in a row", icon: Flame, colors: ["#FF6B35", "#A78BFA"], value: bestStreak(ws), target: 14 },
    { id: "early-bird", title: "Early Bird", description: "Finish 10 workouts before 7 AM", icon: Sunrise, colors: ["#FFB547", "#C6FF3D"], value: earlyBird, target: 10 },
    { id: "iron", title: "Iron Will", description: "Complete 15 strength sessions", icon: Trophy, colors: ["#A78BFA", "#42E8E0"], value: strength, target: 15 },
    { id: "hours-25", title: "25-Hour Club", description: "Log 25 hours of training", icon: Timer, colors: ["#42E8E0", "#C6FF3D"], value: Math.floor(all.minutes / 60), target: 25 },
    { id: "marathon-month", title: "Marathon Month", description: "Run 42.2 km in 30 days", icon: Mountain, colors: ["#C6FF3D", "#FF6B35"], value: Math.round(runKm30 * 10) / 10, target: 42.2 },
    { id: "goal-getter", title: "Goal Getter", description: "Hit your weekly goal 4 times", icon: Target, colors: ["#A78BFA", "#FF6B35"], value: goalWeeks, target: 4 },
    { id: "kcal-10k", title: "Furnace", description: "Burn 10,000 kcal in total", icon: Award, colors: ["#FF6B35", "#C6FF3D"], value: all.calories, target: 10_000 },
  ];
  return defs.map((d) => ({ ...d, earned: d.value >= d.target }));
}
