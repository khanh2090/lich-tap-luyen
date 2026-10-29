import { createSeedData } from "../data/seed";
import type { AppData, SyncSettings } from "../types";

/**
 * Persistence boundary. The app only talks to this interface, so swapping
 * localStorage for a real API later means adding another implementation.
 */
export interface DataRepository {
  load(): Promise<AppData>;
  save(data: AppData): Promise<void>;
  reset(): Promise<AppData>;
}

const DATA_KEY = "pulse.data.v1";
const SYNC_KEY = "pulse.sync.v1";
const SEEN_KEY = "pulse.ui.v1";

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export class LocalStorageRepository implements DataRepository {
  async load(): Promise<AppData> {
    const saved = readJson<AppData>(DATA_KEY);
    // Data saved before training plans existed has no `plans` list yet.
    if (saved && saved.version === 1) return { ...saved, plans: saved.plans ?? [] };
    const seed = createSeedData();
    writeJson(DATA_KEY, seed);
    return seed;
  }

  async save(data: AppData): Promise<void> {
    if (!writeJson(DATA_KEY, data)) throw new Error("This browser blocked local storage — changes won't survive a reload.");
  }

  async reset(): Promise<AppData> {
    const seed = createSeedData();
    writeJson(DATA_KEY, seed);
    return seed;
  }
}

export const repository: DataRepository = new LocalStorageRepository();

export const loadSyncSettings = () => readJson<SyncSettings>(SYNC_KEY);
export function saveSyncSettings(s: SyncSettings | null): void {
  if (s) {
    writeJson(SYNC_KEY, s);
    return;
  }
  try {
    localStorage.removeItem(SYNC_KEY);
  } catch {
    /* storage unavailable: nothing to remove */
  }
}

/** Small per-browser UI memory: read notifications and already-celebrated badges. */
export interface UiMemory {
  seenNotifications: string[];
  celebratedBadges: string[] | null;
}
export const loadUiMemory = (): UiMemory => readJson<UiMemory>(SEEN_KEY) ?? { seenNotifications: [], celebratedBadges: null };
export const saveUiMemory = (m: UiMemory) => writeJson(SEEN_KEY, m);
