import type { SyncSettings, Workout } from "../types";
import { addDays, todayKey } from "./dates";

// Publishes the training schedule to data/workouts.json in a GitHub repo.
// A scheduled GitHub Action reads that file every morning and pushes the
// day's plan to the phone through ntfy (see scripts/send-daily-notification.mjs).

const DATA_PATH = "data/workouts.json";

interface ExportedWorkout {
  id: string;
  date: string;
  time?: string;
  type: string;
  title: string;
  duration: number;
  distance: number | null;
  details: string;
  done: boolean;
}

function encodeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

/** Only the recent past and the future matter to the notifier. */
export function toExport(workouts: Workout[], today = todayKey()): ExportedWorkout[] {
  const from = addDays(today, -7);
  return workouts
    .filter((w) => w.date >= from)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? "99").localeCompare(b.time ?? "99"))
    .map((w) => ({
      id: w.id,
      date: w.date,
      time: w.time,
      type: w.category,
      title: w.title,
      duration: w.durationMin,
      distance: w.distanceKm ?? null,
      // Phone notifications stay readable: only the start of long imported instructions.
      details: [w.focus, w.notes].filter(Boolean).join(" — ").slice(0, 300),
      done: w.status === "completed",
    }));
}

export async function pushSchedule(settings: SyncSettings, workouts: Workout[]): Promise<void> {
  const url = `https://api.github.com/repos/${settings.owner}/${settings.repo}/contents/${DATA_PATH}`;
  const headers = { Accept: "application/vnd.github+json", Authorization: `Bearer ${settings.token}` };

  // Fetch the current blob sha right before writing so concurrent edits don't 409.
  const current = await fetch(url, { headers, cache: "no-store" });
  if (current.status === 401 || current.status === 403) throw new Error("GitHub rejected the token. Check its repo permissions.");
  if (!current.ok && current.status !== 404) throw new Error(`GitHub responded ${current.status} while reading the schedule.`);
  const sha = current.ok ? ((await current.json()) as { sha: string }).sha : undefined;

  const body = {
    message: `chore: sync training schedule (${todayKey()})`,
    content: encodeBase64(JSON.stringify({ workouts: toExport(workouts) }, null, 2) + "\n"),
    sha,
  };
  const res = await fetch(url, { method: "PUT", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Sync failed (GitHub ${res.status}).`);
}
