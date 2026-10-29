import type { Units } from "../types";

const KM_TO_MI = 0.621371;

/** Lowercase, accent-free text for matching Vietnamese and English keywords ("Đạp" → "dap"). */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

export const formatNumber = (n: number) => n.toLocaleString("en-US");

export function formatDistance(km: number, units: Units, digits = 1): string {
  return units === "imperial" ? `${(km * KM_TO_MI).toFixed(digits)} mi` : `${km.toFixed(digits)} km`;
}

export function formatMinutes(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export function newId(prefix = "w"): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}
