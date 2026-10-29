import { Bike, BatteryCharging, Dumbbell, Flower2, Footprints, HeartPulse, Zap, type LucideIcon } from "lucide-react";
import type { Category, Difficulty } from "../types";

export const unsplash = (id: string, width = 800) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=75`;

interface CategoryMeta {
  label: string;
  icon: LucideIcon;
  /** Hex used for dots, chart series and tags (never for long text) */
  color: string;
  /** Approximate kcal burned per minute at intermediate intensity */
  kcalPerMin: number;
  /** Fallback thumbnail for workouts not linked to a library exercise */
  image: string;
}

export const CATEGORIES: Record<Category, CategoryMeta> = {
  strength: { label: "Strength Training", icon: Dumbbell, color: "#A78BFA", kcalPerMin: 7, image: "1549060279-7e168fcee0c2" },
  cardio: { label: "Cardio", icon: HeartPulse, color: "#FF6B35", kcalPerMin: 9, image: "1476480862126-209bfaa8edc8" },
  hiit: { label: "HIIT", icon: Zap, color: "#FFB547", kcalPerMin: 11, image: "1599058917212-d750089bc07e" },
  yoga: { label: "Yoga & Mobility", icon: Flower2, color: "#F0ABFC", kcalPerMin: 4, image: "1600881333168-2ef49b341f30" },
  running: { label: "Running", icon: Footprints, color: "#C6FF3D", kcalPerMin: 11, image: "1486218119243-13883505764c" },
  cycling: { label: "Cycling", icon: Bike, color: "#42E8E0", kcalPerMin: 9, image: "1517649763962-0c623066013b" },
  recovery: { label: "Recovery", icon: BatteryCharging, color: "#94A3B8", kcalPerMin: 3, image: "1506126613408-eca07ce68773" },
};

export const CATEGORY_ORDER: Category[] = ["strength", "cardio", "hiit", "yoga", "running", "cycling", "recovery"];

export const DIFFICULTIES: Difficulty[] = ["Beginner", "Intermediate", "Advanced"];

const DIFFICULTY_FACTOR: Record<Difficulty, number> = { Beginner: 0.85, Intermediate: 1, Advanced: 1.15 };

export function estimateCalories(category: Category, durationMin: number, difficulty: Difficulty): number {
  return Math.round(durationMin * CATEGORIES[category].kcalPerMin * DIFFICULTY_FACTOR[difficulty]);
}

/** Categories where distance is the natural volume metric. */
export const DISTANCE_CATEGORIES: Category[] = ["running", "cycling"];
