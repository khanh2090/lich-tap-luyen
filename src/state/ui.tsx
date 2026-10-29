import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { startOfWeek, todayKey } from "../lib/dates";
import type { Exercise, Workout } from "../types";
import type { WorkoutInput } from "./store";

export type Page = "overview" | "workouts" | "library" | "schedule" | "progress" | "challenges" | "community" | "settings";
export const PAGES: Page[] = ["overview", "workouts", "library", "schedule", "progress", "challenges", "community", "settings"];

export type WorkoutModal =
  | { mode: "create"; prefill?: Partial<WorkoutInput> }
  | { mode: "edit"; workout: Workout }
  | { mode: "log" };

interface Ui {
  page: Page;
  navigate(page: Page): void;
  /** Query handed from the header search to the library page */
  libraryQuery: string;
  setLibraryQuery(q: string): void;
  /** Monday of the week selected in the header week picker */
  weekStart: string;
  setWeekStart(key: string): void;
  workoutModal: WorkoutModal | null;
  openWorkoutModal(m: WorkoutModal): void;
  closeWorkoutModal(): void;
  goalModal: boolean;
  setGoalModal(open: boolean): void;
  exerciseDetail: Exercise | null;
  setExerciseDetail(e: Exercise | null): void;
}

const UiContext = createContext<Ui | null>(null);

export function useUi(): Ui {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error("useUi must be used inside UiProvider");
  return ctx;
}

function pageFromHash(): Page {
  const name = location.hash.replace(/^#\/?/, "") as Page;
  return PAGES.includes(name) ? name : "overview";
}

export function UiProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<Page>(pageFromHash);
  const [libraryQuery, setLibraryQuery] = useState("");
  const [weekStart, setWeekStart] = useState(() => startOfWeek(todayKey()));
  const [workoutModal, setWorkoutModal] = useState<WorkoutModal | null>(null);
  const [goalModal, setGoalModal] = useState(false);
  const [exerciseDetail, setExerciseDetail] = useState<Exercise | null>(null);

  // Hash routing keeps the back button and deep links working without a router dependency.
  useEffect(() => {
    const onHash = () => {
      setPage(pageFromHash());
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const navigate = useCallback((p: Page) => {
    if (pageFromHash() !== p) location.hash = `/${p}`;
    setPage(p);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  return (
    <UiContext.Provider
      value={{
        page,
        navigate,
        libraryQuery,
        setLibraryQuery,
        weekStart,
        setWeekStart,
        workoutModal,
        openWorkoutModal: setWorkoutModal,
        closeWorkoutModal: () => setWorkoutModal(null),
        goalModal,
        setGoalModal,
        exerciseDetail,
        setExerciseDetail,
      }}
    >
      {children}
    </UiContext.Provider>
  );
}
