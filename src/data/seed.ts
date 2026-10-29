import { estimateCalories } from "../lib/categories";
import { addDays, todayKey } from "../lib/dates";
import type { AppData, Challenge, CommunityPost, Workout } from "../types";

// Sample data is generated relative to "today" so every number on the dashboard
// (streak, totals, charts, challenges) is derived from the same workout history.

type Template = Omit<Workout, "id" | "date" | "status" | "calories">;

const T: Record<string, Template> = {
  upper: { title: "Upper Body Strength", category: "strength", durationMin: 35, difficulty: "Intermediate", focus: "Chest · Back · Arms", sets: 4, reps: 10, exerciseId: "ex-db-row" },
  hiit: { title: "HIIT Cardio Blast", category: "hiit", durationMin: 20, difficulty: "Advanced", focus: "Full body", sets: 8, exerciseId: "ex-battle-ropes" },
  core: { title: "Core Stability", category: "strength", durationMin: 15, difficulty: "Beginner", focus: "Core · Abs", sets: 3, reps: 15, exerciseId: "ex-core-stability" },
  run5k: { title: "Outdoor Running", category: "running", durationMin: 30, difficulty: "Intermediate", focus: "Aerobic base", distanceKm: 5, exerciseId: "ex-easy-run" },
  lower: { title: "Lower Body Power", category: "strength", durationMin: 40, difficulty: "Advanced", focus: "Quads · Glutes · Hamstrings", sets: 5, reps: 5, exerciseId: "ex-deadlift" },
  ride: { title: "Zone 2 Ride", category: "cycling", durationMin: 45, difficulty: "Intermediate", focus: "Endurance", distanceKm: 18, exerciseId: "ex-zone2-ride" },
  mobility: { title: "Mobility Flow", category: "yoga", durationMin: 20, difficulty: "Beginner", focus: "Hips · Spine", exerciseId: "ex-vinyasa-flow" },
  tempo: { title: "Tempo Run", category: "running", durationMin: 35, difficulty: "Advanced", focus: "Threshold", distanceKm: 6.5, exerciseId: "ex-tempo-run" },
  stretch: { title: "Recovery Stretch", category: "recovery", durationMin: 15, difficulty: "Beginner", focus: "Full body", exerciseId: "ex-band-reset" },
  spin: { title: "Spin Intervals", category: "cycling", durationMin: 30, difficulty: "Intermediate", focus: "VO2 max", distanceKm: 14, exerciseId: "ex-spin-intervals" },
  stairs: { title: "Stair Climber Cardio", category: "cardio", durationMin: 25, difficulty: "Intermediate", focus: "Legs · Lungs", sets: 8, exerciseId: "ex-stair-sprint" },
  longrun: { title: "Long Run", category: "running", durationMin: 50, difficulty: "Intermediate", focus: "Endurance", distanceKm: 9, exerciseId: "ex-hill-trail" },
};

// [day offset from today, template, time]
type Entry = [number, keyof typeof T, string];

// Last 30 days: 24 completed sessions, a 12-day streak ending today, one missed day (-13).
const RECENT: Entry[] = [
  [-29, "upper", "06:30"], [-28, "run5k", "05:45"], [-26, "lower", "18:00"], [-25, "mobility", "07:00"],
  [-24, "ride", "06:00"], [-22, "hiit", "12:15"], [-21, "tempo", "05:45"], [-19, "upper", "06:30"],
  [-18, "spin", "18:30"], [-16, "longrun", "06:00"], [-14, "stairs", "17:30"],
  [-11, "run5k", "05:45"], [-10, "upper", "06:30"], [-9, "mobility", "07:00"], [-8, "hiit", "12:15"],
  [-7, "ride", "06:00"], [-6, "lower", "18:00"], [-5, "stretch", "20:00"], [-4, "tempo", "05:45"],
  [-4, "core", "19:00"], [-3, "upper", "06:30"], [-2, "spin", "18:30"], [-1, "longrun", "06:00"],
];

// Days 30–59 ago: a lighter month so period-over-period comparisons show growth.
const PREVIOUS: Entry[] = [
  [-58, "run5k", "06:00"], [-56, "upper", "06:30"], [-55, "mobility", "07:00"], [-53, "lower", "18:00"],
  [-51, "run5k", "06:00"], [-50, "hiit", "12:15"], [-48, "upper", "06:30"], [-46, "ride", "06:00"],
  [-45, "core", "19:00"], [-43, "tempo", "05:45"], [-41, "upper", "06:30"], [-40, "stretch", "20:00"],
  [-38, "longrun", "06:00"], [-37, "lower", "18:00"], [-35, "spin", "18:30"], [-34, "mobility", "07:00"],
  [-33, "run5k", "06:00"], [-32, "upper", "06:30"], [-31, "hiit", "12:15"],
];

// Days 60–179 ago: three sessions a week, rising to four in the most recent two months,
// so the six-month trend shows steady growth.
const ROTATION: (keyof typeof T)[] = ["upper", "run5k", "lower", "mobility", "ride", "hiit", "tempo", "core", "spin", "longrun"];
const TIMES: Record<keyof typeof T, string> = {
  upper: "06:30", hiit: "12:15", core: "19:00", run5k: "06:00", lower: "18:00", ride: "06:00",
  mobility: "07:00", tempo: "05:45", stretch: "20:00", spin: "18:30", stairs: "17:30", longrun: "06:00",
};
const OLDER: Entry[] = [];
for (let offset = -179, n = 0; offset <= -60; offset++) {
  const day = -offset % 7;
  const sessionDays = offset > -120 ? [0, 2, 4, 5] : [0, 2, 4];
  if (!sessionDays.includes(day)) continue;
  const key = ROTATION[n++ % ROTATION.length];
  OLDER.push([offset, key, TIMES[key]]);
}

const UPCOMING: Entry[] = [
  [1, "lower", "06:30"], [2, "run5k", "05:45"], [2, "mobility", "20:00"], [3, "ride", "06:00"],
  [4, "upper", "06:30"], [6, "longrun", "06:00"], [7, "stretch", "19:00"], [8, "tempo", "05:45"],
  [9, "hiit", "12:15"], [10, "upper", "06:30"],
];

function build(today: string, [offset, key, time]: Entry, index: number, status: Workout["status"]): Workout {
  const t = T[key];
  return {
    ...t,
    id: `seed-${offset}-${index}`,
    date: addDays(today, offset),
    time,
    status,
    calories: estimateCalories(t.category, t.durationMin, t.difficulty),
  };
}

function seedWorkouts(today: string): Workout[] {
  const past = [...OLDER, ...PREVIOUS, ...RECENT].map((e, i) => build(today, e, i, "completed"));
  const missed = build(today, [-13, "lower", "18:00"], 0, "scheduled");
  const todays: Workout[] = [
    build(today, [0, "upper", "06:30"], 1, "completed"),
    // Started 9 minutes ago so the live progress bar sits mid-way.
    { ...build(today, [0, "hiit", "12:15"], 2, "in_progress"), startedAt: new Date(Date.now() - 9 * 60_000).toISOString() },
    build(today, [0, "core", "17:30"], 3, "scheduled"),
    build(today, [0, "run5k", "18:30"], 4, "scheduled"),
  ];
  const future = UPCOMING.map((e, i) => build(today, e, i, "scheduled"));
  return [...past, missed, ...todays, ...future];
}

export function seedChallenges(today = todayKey()): Challenge[] {
  return [
    {
      id: "ch-consistency", title: "30-Day Consistency", description: "Complete 24 workouts in 30 days. Show up, every day counts.",
      metric: "workouts", target: 24, startDate: addDays(today, -29), endDate: today, participants: 12_480, accent: "lime",
    },
    {
      id: "ch-run-100", title: "100 KM Run Club", description: "Run 100 km in six weeks. Any pace, any route.",
      metric: "distance", target: 100, category: "running", startDate: addDays(today, -27), endDate: addDays(today, 14),
      participants: 8_215, accent: "orange",
    },
    {
      id: "ch-strength-season", title: "Strength Season", description: "Log 600 minutes of strength training this block.",
      metric: "minutes", target: 600, category: "strength", startDate: addDays(today, -29), endDate: addDays(today, 12),
      participants: 5_902, accent: "violet",
    },
    {
      id: "ch-streak-21", title: "21-Day Streak", description: "Train at least once a day for 21 days straight.",
      metric: "streak", target: 21, startDate: addDays(today, -11), endDate: addDays(today, 30), participants: 3_377, accent: "aqua",
    },
    {
      id: "ch-ride-300", title: "Ride 300", description: "Pedal 300 km before the month wraps. Indoor rides count.",
      metric: "distance", target: 300, category: "cycling", startDate: addDays(today, -10), endDate: addDays(today, 20),
      participants: 4_120, accent: "aqua",
    },
  ];
}

function seedPosts(): CommunityPost[] {
  const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
  return [
    { id: "p1", author: "Maya Chen", initials: "MC", createdAt: hoursAgo(1), text: "New 5K PR this morning. Negative splits felt amazing.", workoutTitle: "Tempo Run", category: "running", stat: "5.0 km · 22:41", kudos: 48, kudoed: false },
    { id: "p2", author: "Jordan Reyes", initials: "JR", createdAt: hoursAgo(3), text: "Deadlift day. Finally moved 180 kg for a clean triple.", workoutTitle: "Lower Body Power", category: "strength", stat: "5 × 3 · 180 kg", kudos: 73, kudoed: true },
    { id: "p3", author: "Sofia Lindqvist", initials: "SL", createdAt: hoursAgo(6), text: "Rainy day = spin day. Six threshold blocks done.", workoutTitle: "Spin Intervals", category: "cycling", stat: "30 min · 14 km", kudos: 21, kudoed: false },
    { id: "p4", author: "Kenji Watanabe", initials: "KW", createdAt: hoursAgo(20), text: "Day 30 of the consistency challenge. Never missed one.", category: "hiit", stat: "30-day streak", kudos: 112, kudoed: false },
    { id: "p5", author: "Amara Okafor", initials: "AO", createdAt: hoursAgo(26), text: "Recovery is training too. Long breathwork + mobility session tonight.", workoutTitle: "Mobility Flow", category: "yoga", stat: "40 min", kudos: 34, kudoed: false },
  ];
}

export function createSeedData(): AppData {
  const today = todayKey();
  return {
    version: 1,
    profile: {
      name: "Alex",
      goal: "Build strength and run a sub-50 10K",
      favoriteCategories: ["strength", "running", "hiit"],
      experience: "Intermediate",
      preferredDurationMin: 35,
      units: "metric",
      theme: "dark",
      weeklyGoal: { workouts: 6, minutes: 200 },
    },
    workouts: seedWorkouts(today),
    favorites: ["ex-deadlift", "ex-tempo-run", "ex-vinyasa-flow"],
    joinedChallenges: ["ch-consistency", "ch-run-100", "ch-streak-21"],
    posts: seedPosts(),
  };
}
