export type Category = "strength" | "cardio" | "hiit" | "yoga" | "running" | "cycling" | "swimming" | "recovery";
export type Difficulty = "Beginner" | "Intermediate" | "Advanced";
/** Stored status. "missed" is derived: a scheduled workout whose date has passed. */
export type StoredStatus = "scheduled" | "in_progress" | "completed";
export type WorkoutStatus = StoredStatus | "missed";

export interface Workout {
  id: string;
  title: string;
  category: Category;
  /** Local date, YYYY-MM-DD */
  date: string;
  /** Optional start time, HH:MM */
  time?: string;
  durationMin: number;
  difficulty: Difficulty;
  calories: number;
  status: StoredStatus;
  /** ISO timestamp set when the workout is started; drives the live progress bar */
  startedAt?: string;
  focus?: string;
  sets?: number;
  reps?: number;
  distanceKm?: number;
  exerciseId?: string;
  notes?: string;
  /** Set when the workout came from an imported training plan */
  planId?: string;
}

export interface Exercise {
  id: string;
  name: string;
  category: Category;
  muscleGroups: string[];
  equipment: string;
  difficulty: Difficulty;
  durationMin: number;
  sets?: number;
  reps?: number;
  distanceKm?: number;
  description: string;
  image: string;
  /** Number of athletes who saved this exercise (sample community data) */
  popularity: number;
}

export type Units = "metric" | "imperial";
export type Theme = "dark" | "light";

export interface Profile {
  name: string;
  goal: string;
  favoriteCategories: Category[];
  experience: Difficulty;
  preferredDurationMin: number;
  units: Units;
  theme: Theme;
  weeklyGoal: { workouts: number; minutes: number };
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  metric: "workouts" | "minutes" | "distance" | "streak";
  target: number;
  /** Only workouts of this category count, if set */
  category?: Category;
  startDate: string;
  endDate: string;
  participants: number;
  accent: "lime" | "orange" | "violet" | "aqua";
}

export interface CommunityPost {
  id: string;
  author: string;
  initials: string;
  createdAt: string;
  text: string;
  workoutTitle?: string;
  category?: Category;
  stat?: string;
  kudos: number;
  /** Whether the current user gave kudos */
  kudoed: boolean;
}

export interface SyncSettings {
  owner: string;
  repo: string;
  token: string;
  lastSyncedAt?: string;
}

/** A training plan imported from a file; its sessions are Workouts with this planId. */
export interface TrainingPlan {
  id: string;
  name: string;
  sourceFile: string;
  importedAt: string;
}

export interface AppData {
  version: 1;
  profile: Profile;
  workouts: Workout[];
  favorites: string[];
  joinedChallenges: string[];
  posts: CommunityPost[];
  plans: TrainingPlan[];
}
