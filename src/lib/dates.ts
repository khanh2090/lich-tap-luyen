// Date helpers working on local calendar days encoded as "YYYY-MM-DD" keys.

const pad = (n: number) => String(n).padStart(2, "0");

export function toKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey(): string {
  return toKey(new Date());
}

export function addDays(key: string, days: number): string {
  const d = fromKey(key);
  d.setDate(d.getDate() + days);
  return toKey(d);
}

/** Monday of the week containing `key`. */
export function startOfWeek(key: string): string {
  const d = fromKey(key);
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return toKey(d);
}

export function startOfMonth(key: string): string {
  const d = fromKey(key);
  return toKey(new Date(d.getFullYear(), d.getMonth(), 1));
}

export function addMonths(key: string, months: number): string {
  const d = fromKey(key);
  return toKey(new Date(d.getFullYear(), d.getMonth() + months, 1));
}

export function daysBetween(a: string, b: string): number {
  return Math.round((fromKey(b).getTime() - fromKey(a).getTime()) / 86_400_000);
}

export function rangeKeys(start: string, days: number): string[] {
  return Array.from({ length: days }, (_, i) => addDays(start, i));
}

export function inRange(key: string, start: string, endInclusive: string): boolean {
  return key >= start && key <= endInclusive;
}

export function formatDay(key: string, opts: Intl.DateTimeFormatOptions): string {
  return fromKey(key).toLocaleDateString("en-US", opts);
}

export function weekdayShort(key: string): string {
  return formatDay(key, { weekday: "short" });
}

export function weekLabel(weekStart: string): string {
  const end = addDays(weekStart, 6);
  const sameMonth = fromKey(weekStart).getMonth() === fromKey(end).getMonth();
  const left = formatDay(weekStart, { month: "short", day: "numeric" });
  const right = sameMonth ? formatDay(end, { day: "numeric" }) : formatDay(end, { month: "short", day: "numeric" });
  return `${left} – ${right}`;
}

export function relativeDayLabel(key: string, today = todayKey()): string {
  const diff = daysBetween(today, key);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return formatDay(key, { weekday: "short", month: "short", day: "numeric" });
}

export function timeAgo(iso: string, now = Date.now()): string {
  const mins = Math.round((now - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}
