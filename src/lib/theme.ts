import type { Theme } from "../types";

/** Concrete chart colors per theme (SVG attributes can't rely on CSS variables everywhere). */
export const CHART_THEME: Record<Theme, { grid: string; axis: string; cursor: string; barMuted: string }> = {
  dark: { grid: "rgba(248,250,252,0.07)", axis: "#9AA3B8", cursor: "rgba(248,250,252,0.05)", barMuted: "#2A2F45" },
  light: { grid: "rgba(16,19,31,0.08)", axis: "#586074", cursor: "rgba(16,19,31,0.05)", barMuted: "#E4E2DA" },
};

export const ACCENTS = {
  lime: "#C6FF3D",
  orange: "#FF6B35",
  violet: "#A78BFA",
  aqua: "#42E8E0",
} as const;

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
