import { Moon, Sun, Sunrise, Sunset, type LucideIcon } from "lucide-react";
import type { Slot, Workout } from "../types";
import { normalize } from "./format";

// Time-of-day slots ("buổi") used to split each calendar day into
// morning / midday / afternoon / evening rows.

export const SLOTS: { id: Slot; label: string; vi: string; hint: string; icon: LucideIcon }[] = [
  { id: "morning", label: "Morning", vi: "Sáng", hint: "before 11:00", icon: Sunrise },
  { id: "noon", label: "Midday", vi: "Trưa", hint: "11:00 – 14:00", icon: Sun },
  { id: "afternoon", label: "Afternoon", vi: "Chiều", hint: "14:00 – 18:00", icon: Sunset },
  { id: "evening", label: "Evening", vi: "Tối", hint: "after 18:00", icon: Moon },
];
export const SLOT_BY_ID = Object.fromEntries(SLOTS.map((s) => [s.id, s])) as Record<Slot, (typeof SLOTS)[number]>;
const RANK: Record<Slot, number> = { morning: 0, noon: 1, afternoon: 2, evening: 3 };

/** "after" means "right after the previous session" (e.g. "Ngay sau khi chạy"). */
export type SlotHint = Slot | "after";

export function slotFromTime(time?: string): Slot | null {
  if (!time) return null;
  const h = Number(time.slice(0, 2));
  if (Number.isNaN(h)) return null;
  return h < 11 ? "morning" : h < 14 ? "noon" : h < 18 ? "afternoon" : "evening";
}

const KEYWORDS: [Slot, string[]][] = [
  ["morning", ["sang", "morning", "am"]],
  ["noon", ["trua", "noon", "midday", "lunch"]],
  ["afternoon", ["chieu", "afternoon", "pm"]],
  ["evening", ["toi", "dem", "evening", "night"]],
];

/** Reads a slot from free text such as "Sáng sớm 6:00", "Trưa hoặc chiều", "Ngay sau khi chạy". */
export function slotFromText(raw: string): SlotHint | null {
  const n = normalize(raw);
  if (!n.trim()) return null;
  const clock = n.match(/(\d{1,2})\s*[:h]\s*(\d{2})?/);
  if (clock) return slotFromTime(clock[1].padStart(2, "0"));
  if (/\b(ngay sau|right after|after)\b/.test(n)) return "after";
  // The first slot word wins: "Trưa hoặc chiều" is midday.
  const tokens = n.split(/[^a-z0-9]+/);
  for (const t of tokens) for (const [slot, words] of KEYWORDS) if (words.includes(t)) return slot;
  return null;
}

/** Slot hint for one workout: explicit choice, then start time, then an imported "Buổi: …" note. */
function hintOf(w: Workout): SlotHint | null {
  if (w.slot) return w.slot;
  const fromTime = slotFromTime(w.time);
  if (fromTime) return fromTime;
  const line = w.notes?.split(/\r?\n/).find((l) => l.startsWith("Buổi:"));
  return line ? slotFromText(line.slice(5)) : null;
}

export interface SlotGroup {
  slot: Slot | null;
  workouts: Workout[];
}

/**
 * Groups one day's workouts by slot, in slot order (unslotted last). Keeps the
 * given order inside a slot except that timed sessions come first by time, and
 * "right after" sessions take the slot of the session listed before them.
 */
export function arrangeDay(workouts: Workout[]): SlotGroup[] {
  const resolved: { w: Workout; slot: Slot | null; i: number }[] = [];
  let previous: Slot | null = null;
  workouts.forEach((w, i) => {
    const hint = hintOf(w);
    const slot = hint === "after" ? previous : hint;
    resolved.push({ w, slot, i });
    if (slot) previous = slot;
  });
  const groups: SlotGroup[] = [];
  for (const slot of [...SLOTS.map((s) => s.id), null] as (Slot | null)[]) {
    const items = resolved
      .filter((r) => r.slot === slot)
      .sort((a, b) => (a.w.time ?? "99").localeCompare(b.w.time ?? "99") || a.i - b.i)
      .map((r) => r.w);
    if (items.length) groups.push({ slot, workouts: items });
  }
  return groups;
}

export const sortDay = (workouts: Workout[]) => arrangeDay(workouts).flatMap((g) => g.workouts);

/** Resolved slot of each workout in a day, keyed by id. */
export function slotMap(workouts: Workout[]): Map<string, Slot | null> {
  return new Map(arrangeDay(workouts).flatMap((g) => g.workouts.map((w) => [w.id, g.slot] as const)));
}

/** Sorts by date (ascending or descending), and by slot within each day. */
export function sortByDateAndSlot(workouts: Workout[], direction: 1 | -1 = 1): Workout[] {
  const byDate = new Map<string, Workout[]>();
  for (const w of workouts) byDate.set(w.date, [...(byDate.get(w.date) ?? []), w]);
  return [...byDate.keys()].sort((a, b) => direction * a.localeCompare(b)).flatMap((d) => sortDay(byDate.get(d)!));
}

export const slotRank = (slot: Slot | null) => (slot ? RANK[slot] : 4);
