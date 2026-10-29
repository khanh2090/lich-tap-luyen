import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { seedChallenges } from "../data/seed";
import { computeAchievements } from "../lib/achievements";
import { todayKey } from "../lib/dates";
import { initials, newId } from "../lib/format";
import { pushSchedule } from "../lib/github-sync";
import { loadSyncSettings, loadUiMemory, repository, saveSyncSettings, saveUiMemory } from "../lib/storage";
import type { AppData, Challenge, CommunityPost, Profile, SyncSettings, TrainingPlan, Workout } from "../types";
import { useToast } from "./toast";

export type WorkoutInput = Omit<Workout, "id" | "status" | "startedAt"> & { status?: Workout["status"] };
type SyncState = { status: "off" | "idle" | "syncing" | "ok" | "error"; message?: string };

interface Store {
  data: AppData | null;
  today: string;
  challenges: Challenge[];
  createWorkout(input: WorkoutInput): void;
  updateWorkout(id: string, patch: Partial<Workout>): void;
  deleteWorkout(id: string): void;
  startWorkout(id: string): void;
  completeWorkout(id: string): void;
  reopenWorkout(id: string): void;
  toggleFavorite(exerciseId: string): void;
  updateProfile(patch: Partial<Profile>, message?: string): void;
  toggleChallenge(id: string): void;
  addPost(post: Pick<CommunityPost, "text" | "workoutTitle" | "category" | "stat">): void;
  toggleKudos(id: string): void;
  resetData(): Promise<void>;
  /** Adds a plan and its sessions; when `replacePlanId` is given that plan and its sessions are removed first. */
  importPlan(plan: Pick<TrainingPlan, "name" | "sourceFile">, sessions: WorkoutInput[], replacePlanId?: string): string;
  deletePlan(planId: string): void;
  sync: SyncState & { settings: SyncSettings | null; configure(s: SyncSettings | null): void; syncNow(): Promise<void> };
}

const StoreContext = createContext<Store | null>(null);

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

/** Store that is guaranteed to have data (rendered only after loading). */
export function useData() {
  const store = useStore();
  return { ...store, data: store.data as AppData };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [data, setData] = useState<AppData | null>(null);
  const [syncSettings, setSyncSettings] = useState<SyncSettings | null>(() => loadSyncSettings());
  const [sync, setSync] = useState<SyncState>({ status: loadSyncSettings() ? "idle" : "off" });
  const today = todayKey();
  const challenges = useMemo(() => seedChallenges(today), [today]);
  const dirty = useRef(false);

  useEffect(() => {
    repository.load().then(setData);
  }, []);

  // Persist after every change made through `mutate`.
  useEffect(() => {
    if (!data || !dirty.current) return;
    repository.save(data).catch((e: Error) => toast("error", "Couldn't save", e.message));
  }, [data, toast]);

  // Celebrate badges that became earned since the last visit.
  useEffect(() => {
    if (!data) return;
    const earned = computeAchievements(data.workouts, data.profile, today).filter((a) => a.earned);
    const memory = loadUiMemory();
    if (memory.celebratedBadges) {
      for (const a of earned.filter((a) => !memory.celebratedBadges!.includes(a.id))) {
        toast("achievement", `Achievement unlocked: ${a.title}`, a.description);
      }
    }
    saveUiMemory({ ...memory, celebratedBadges: earned.map((a) => a.id) });
  }, [data, today, toast]);

  const mutate = useCallback(
    (fn: (d: AppData) => AppData, message?: string) => {
      dirty.current = true;
      setData((d) => (d ? fn(d) : d));
      if (message) toast("success", message);
    },
    [toast],
  );

  const runSync = useCallback(
    async (settings: SyncSettings, workouts: Workout[], quiet: boolean) => {
      setSync({ status: "syncing" });
      try {
        await pushSchedule(settings, workouts);
        const next = { ...settings, lastSyncedAt: new Date().toISOString() };
        saveSyncSettings(next);
        setSyncSettings(next);
        setSync({ status: "ok" });
        if (!quiet) toast("success", "Schedule synced", "Your phone will get tomorrow's plan at 5:30.");
      } catch (e) {
        setSync({ status: "error", message: (e as Error).message });
        toast("error", "Phone sync failed", (e as Error).message);
      }
    },
    [toast],
  );

  // Auto-publish the schedule (debounced) after workout changes when sync is configured.
  const workouts = data?.workouts;
  useEffect(() => {
    if (!workouts || !syncSettings || !dirty.current) return;
    const timer = setTimeout(() => runSync(syncSettings, workouts, true), 2500);
    return () => clearTimeout(timer);
    // Only workout edits should trigger a sync, not settings changes.
  }, [workouts]);

  const mapWorkout = (id: string, fn: (w: Workout) => Workout) => (d: AppData) => ({
    ...d,
    workouts: d.workouts.map((w) => (w.id === id ? fn(w) : w)),
  });

  const store: Store = {
    data,
    today,
    challenges,
    createWorkout: (input) =>
      mutate(
        (d) => ({ ...d, workouts: [...d.workouts, { ...input, id: newId(), status: input.status ?? "scheduled" }] }),
        input.status === "completed" ? "Activity logged" : "Workout scheduled",
      ),
    updateWorkout: (id, patch) => mutate(mapWorkout(id, (w) => ({ ...w, ...patch })), "Workout updated"),
    deleteWorkout: (id) => mutate((d) => ({ ...d, workouts: d.workouts.filter((w) => w.id !== id) }), "Workout deleted"),
    startWorkout: (id) =>
      mutate(mapWorkout(id, (w) => ({ ...w, status: "in_progress", startedAt: new Date().toISOString() })), "Workout started — let's go!"),
    completeWorkout: (id) => mutate(mapWorkout(id, (w) => ({ ...w, status: "completed", startedAt: undefined })), "Workout completed. Nice work!"),
    reopenWorkout: (id) => mutate(mapWorkout(id, (w) => ({ ...w, status: "scheduled", startedAt: undefined })), "Marked as not done"),
    toggleFavorite: (exerciseId) => {
      const saved = data?.favorites.includes(exerciseId);
      mutate(
        (d) => ({
          ...d,
          favorites: saved ? d.favorites.filter((f) => f !== exerciseId) : [...d.favorites, exerciseId],
        }),
        saved ? "Removed from favorites" : "Saved to favorites",
      );
    },
    updateProfile: (patch, message = "Profile updated") => mutate((d) => ({ ...d, profile: { ...d.profile, ...patch } }), message),
    toggleChallenge: (id) => {
      const joined = data?.joinedChallenges.includes(id);
      mutate(
        (d) => ({
          ...d,
          joinedChallenges: joined ? d.joinedChallenges.filter((c) => c !== id) : [...d.joinedChallenges, id],
        }),
        joined ? "You left the challenge" : "Challenge joined. Game on!",
      );
    },
    addPost: (post) =>
      mutate(
        (d) => ({
          ...d,
          posts: [
            {
              ...post,
              id: newId("p"),
              author: d.profile.name,
              initials: initials(d.profile.name),
              createdAt: new Date().toISOString(),
              kudos: 0,
              kudoed: false,
            },
            ...d.posts,
          ],
        }),
        "Posted to your feed",
      ),
    toggleKudos: (id) =>
      mutate((d) => ({
        ...d,
        posts: d.posts.map((p) => (p.id === id ? { ...p, kudoed: !p.kudoed, kudos: p.kudos + (p.kudoed ? -1 : 1) } : p)),
      })),
    importPlan: (plan, sessions, replacePlanId) => {
      const planId = newId("plan");
      mutate(
        (d) => ({
          ...d,
          plans: [...d.plans.filter((p) => p.id !== replacePlanId), { ...plan, id: planId, importedAt: new Date().toISOString() }],
          workouts: [
            ...d.workouts.filter((w) => !replacePlanId || w.planId !== replacePlanId),
            ...sessions.map((s, i) => ({ ...s, id: `${planId}-${i}`, planId, status: s.status ?? "scheduled" })),
          ],
        }),
        `Imported ${sessions.length} sessions into “${plan.name}”`,
      );
      return planId;
    },
    deletePlan: (planId) =>
      mutate(
        (d) => ({ ...d, plans: d.plans.filter((p) => p.id !== planId), workouts: d.workouts.filter((w) => w.planId !== planId) }),
        "Plan deleted",
      ),
    resetData: async () => {
      dirty.current = false;
      setData(await repository.reset());
      toast("info", "Sample data restored");
    },
    sync: {
      ...sync,
      settings: syncSettings,
      configure: (s) => {
        saveSyncSettings(s);
        setSyncSettings(s);
        setSync({ status: s ? "idle" : "off" });
        if (s && data) runSync(s, data.workouts, false);
        else toast("info", "Phone notifications disconnected");
      },
      syncNow: async () => {
        if (syncSettings && data) await runSync(syncSettings, data.workouts, false);
      },
    },
  };

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}
