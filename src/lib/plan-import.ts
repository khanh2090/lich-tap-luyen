import { CATEGORIES, estimateCalories } from "./categories";
import { addDays, startOfWeek, toKey, todayKey } from "./dates";
import type { Category, Difficulty } from "../types";

// Turns a training-plan file (CSV, Excel or JSON) into workout rows.
// Column names are matched loosely in English and Vietnamese, and a plan can
// either give real dates or "week + weekday" relative to a chosen start date.

export type Cell = string | number | boolean | Date | null | undefined;

type Field = "date" | "week" | "weekday" | "time" | "title" | "category" | "duration" | "distance" | "difficulty" | "notes" | "focus" | "done";

/** Header synonyms, written already normalized (lowercase, no accents, no spaces). */
const HEADERS: Record<Field, string[]> = {
  date: ["date", "ngay", "ngaytap", "ngaythang"],
  week: ["week", "weekno", "wk", "tuan", "tuanso"],
  weekday: ["day", "weekday", "dayofweek", "thu", "thutrongtuan"],
  time: ["time", "starttime", "start", "gio", "giotap", "giobatdau", "batdau"],
  title: ["title", "name", "workout", "session", "baitap", "tenbai", "tenbaitap", "noidung", "buoitap", "ten"],
  category: ["type", "category", "sport", "discipline", "activity", "mon", "monthethao", "bomon", "loai", "loaibai"],
  duration: ["duration", "durationmin", "minutes", "mins", "min", "thoiluong", "thoigian", "phut"],
  distance: ["distance", "distancekm", "km", "culy", "quangduong"],
  difficulty: ["difficulty", "level", "intensity", "zone", "mucdo", "cuongdo", "dokho", "vung"],
  notes: ["notes", "note", "details", "description", "ghichu", "chitiet", "mota", "huongdan"],
  focus: ["focus", "target", "muctieu", "trongtam"],
  done: ["done", "completed", "status", "hoanthanh", "trangthai", "xong"],
};

export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

const compact = (s: string) => normalize(s).replace(/[^a-z0-9]/g, "");

function fieldForHeader(header: string): Field | null {
  const h = compact(header);
  if (!h) return null;
  const entries = Object.entries(HEADERS) as [Field, string[]][];
  for (const [field, names] of entries) if (names.includes(h)) return field;
  // "Thời lượng (phút)" → "thoiluongphut" starts with "thoiluong".
  for (const [field, names] of entries) if (names.some((n) => n.length >= 4 && h.startsWith(n))) return field;
  return null;
}

// ---------- cell parsers ----------

const text = (c: Cell) => (c === null || c === undefined ? "" : c instanceof Date ? "" : String(c).trim());

/** Excel stores dates as UTC midnight; read the UTC parts so the day doesn't shift. */
const utcKey = (d: Date) => toKey(new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

function excelSerialToKey(n: number): string {
  return utcKey(new Date(Math.round((n - 25569) * 86_400_000)));
}

export function parseDate(c: Cell, today = todayKey()): string | null {
  if (c instanceof Date) return Number.isNaN(c.getTime()) ? null : utcKey(c);
  if (typeof c === "number") return c > 30000 && c < 80000 ? excelSerialToKey(c) : null;
  const s = text(c);
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) return valid(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})(?:[-/.](\d{2,4}))?$/);
  if (m) {
    let [a, b] = [+m[1], +m[2]];
    // Vietnamese files are day/month; only swap when the numbers make that impossible.
    if (b > 12 && a <= 12) [a, b] = [b, a];
    const year = m[3] ? (m[3].length === 2 ? 2000 + +m[3] : +m[3]) : +today.slice(0, 4);
    return valid(year, b, a);
  }
  return null;
}

function valid(y: number, m: number, d: number): string | null {
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d ? toKey(date) : null;
}

const WEEKDAYS: Record<string, number> = {
  mon: 0, monday: 0, tue: 1, tues: 1, tuesday: 1, wed: 2, wednesday: 2, thu: 3, thur: 3, thurs: 3, thursday: 3,
  fri: 4, friday: 4, sat: 5, saturday: 5, sun: 6, sunday: 6, cn: 6, chunhat: 6,
};

/**
 * 0 = Monday … 6 = Sunday. Accepts "Thứ 2", "T2", "CN", "Mon". Bare numbers are
 * Vietnamese-style (2 = Monday, 8 = Sunday) when `vietnamese`, otherwise ISO (1 = Monday).
 */
export function parseWeekday(c: Cell, vietnamese = false): number | null {
  const s = compact(typeof c === "number" ? String(c) : text(c));
  if (s in WEEKDAYS) return WEEKDAYS[s];
  const vn = s.match(/^(?:thu|t)([2-8])$/);
  if (vn) return +vn[1] === 8 ? 6 : +vn[1] - 2;
  if (vietnamese && /^[2-8]$/.test(s)) return +s === 8 ? 6 : +s - 2;
  if (!vietnamese && /^[1-7]$/.test(s)) return +s - 1;
  return null;
}

export function parseWeek(c: Cell): number | null {
  if (typeof c === "number") return Number.isInteger(c) && c > 0 ? c : null;
  const m = text(c).match(/(\d+)/);
  return m && +m[1] > 0 ? +m[1] : null;
}

const toNumber = (s: string) => Number(s.replace(/(\d),(\d)/, "$1.$2"));

/** Minutes from "45", "45 phút", "1h30", "1:30", "1.5h", "90'", or an Excel time cell. */
export function parseDuration(c: Cell): number | null {
  if (c instanceof Date) return c.getUTCHours() * 60 + c.getUTCMinutes() || null;
  if (typeof c === "number") return c > 0 && c < 1 ? Math.round(c * 24 * 60) : c > 0 ? Math.round(c) : null;
  const s = normalize(text(c)).replace(/\s+/g, "");
  if (!s) return null;
  let m = s.match(/^(\d+)[h:g](\d{1,2})?(?:m|p|phut|min)?$/);
  if (m) {
    const [a, b] = [+m[1], m[2] ? +m[2] : 0];
    // "45:00" reads as minutes:seconds, "1:30" as hours:minutes.
    return s.includes(":") && a >= 10 ? a : a * 60 + b;
  }
  m = s.match(/^(\d+(?:[.,]\d+)?)(h|gio|hr|hrs|hour|hours)$/);
  if (m) return Math.round(toNumber(m[1]) * 60);
  m = s.match(/^(\d+(?:[.,]\d+)?)(?:'|m|min|mins|minutes|p|phut)?$/);
  if (m) return Math.round(toNumber(m[1]));
  return null;
}

/** Kilometres from "10", "10km", "1,5 km", "1500m". Swim distances over 100 are read as metres. */
export function parseDistance(c: Cell, category: Category): number | null {
  if (typeof c === "number") return c > 0 ? (category === "swimming" && c >= 100 ? c / 1000 : c) : null;
  const s = normalize(text(c)).replace(/\s+/g, "");
  const m = s.match(/^(\d+(?:[.,]\d+)?)(km|k|m|met|meters|mi)?$/);
  if (!m) return null;
  const n = toNumber(m[1]);
  if (m[2] === "m" || m[2] === "met" || m[2] === "meters") return n / 1000;
  if (m[2] === "mi") return n * 1.60934;
  return category === "swimming" && !m[2] && n >= 100 ? n / 1000 : n;
}

export function parseTime(c: Cell): string | null {
  if (c instanceof Date) return `${String(c.getUTCHours()).padStart(2, "0")}:${String(c.getUTCMinutes()).padStart(2, "0")}`;
  if (typeof c === "number" && c >= 0 && c < 1) {
    const mins = Math.round(c * 24 * 60);
    return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
  }
  const s = normalize(text(c)).replace(/\s+/g, "");
  const m = s.match(/^(\d{1,2})[:h](\d{2})?(am|pm)?$/);
  if (!m) return null;
  let h = +m[1];
  if (m[3] === "pm" && h < 12) h += 12;
  if (m[3] === "am" && h === 12) h = 0;
  const min = m[2] ? +m[2] : 0;
  return h < 24 && min < 60 ? `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}` : null;
}

// Keywords: short ones must match a whole word, longer ones may appear anywhere.
const CATEGORY_KEYWORDS: [Category, string[]][] = [
  ["swimming", ["boi", "swim", "swimming", "open water", "pool", "ow"]],
  ["cycling", ["brick", "dap", "dap xe", "xe dap", "bike", "cycling", "cycle", "ride", "trainer", "zwift"]],
  ["running", ["chay", "chay bo", "run", "running", "jog", "track", "trail"]],
  ["hiit", ["hiit", "tabata", "circuit", "crossfit"]],
  ["strength", ["gym", "suc manh", "strength", "weights", "ta", "core", "lift", "squat", "deadlift"]],
  ["yoga", ["yoga", "pilates", "mobility", "stretch", "gian co", "keo gian"]],
  ["recovery", ["recovery", "hoi phuc", "massage", "foam", "phuc hoi"]],
  ["cardio", ["cardio", "elliptical", "rowing", "cheo", "nhay day", "jump rope"]],
];
const REST_WORDS = ["nghi", "rest", "off", "day off", "nghi ngoi", "rest day"];

function matches(haystack: string, words: string[]): boolean {
  const tokens = new Set(haystack.split(/[^a-z0-9]+/).filter(Boolean));
  return words.some((w) => (w.includes(" ") || w.length >= 5 ? ` ${haystack} `.includes(w) : tokens.has(w)));
}

export function detectCategory(...texts: string[]): Category | null {
  for (const t of texts) {
    const n = normalize(t);
    if (!n) continue;
    for (const [cat, words] of CATEGORY_KEYWORDS) if (matches(n, words)) return cat;
  }
  return null;
}

const isRest = (t: string) => {
  const n = normalize(t).trim();
  return REST_WORDS.includes(n) || REST_WORDS.some((w) => n === w || n.startsWith(`${w} `));
};

export function parseDifficulty(c: Cell, fallback: Difficulty): Difficulty {
  const n = normalize(text(c));
  if (!n) return fallback;
  if (matches(n, ["easy", "de", "nhe", "z1", "z2", "zone 1", "zone 2", "beginner", "thap", "recovery"])) return "Beginner";
  if (matches(n, ["hard", "kho", "nang", "cao", "z4", "z5", "zone 4", "zone 5", "advanced", "interval", "threshold", "max"])) return "Advanced";
  return "Intermediate";
}

const parseDone = (c: Cell) =>
  c === true || (typeof c === "number" && c === 1) || matches(normalize(text(c)), ["x", "yes", "y", "true", "done", "xong", "co", "roi", "hoan thanh", "completed", "✓", "v"]);

// ---------- file reading ----------

function detectDelimiter(line: string): string {
  const counts = { ",": 0, ";": 0, "\t": 0 };
  let quoted = false;
  for (const ch of line) {
    if (ch === '"') quoted = !quoted;
    else if (!quoted && ch in counts) counts[ch as keyof typeof counts]++;
  }
  const [best, count] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return count > 0 ? best : ",";
}

/** RFC 4180 CSV with quoted fields; delimiter auto-detected (Excel in some locales uses ";"). */
export function parseCsv(input: string): Cell[][] {
  const textIn = input.replace(/^﻿/, "");
  const delimiter = detectDelimiter(textIn.split(/\r?\n/).find((l) => l.trim()) ?? "");
  const rows: Cell[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < textIn.length; i++) {
    const ch = textIn[i];
    if (quoted) {
      if (ch === '"' && textIn[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && textIn[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** UTF-8 first; fall back to the Vietnamese Windows code page for CSVs saved by older Excel. */
function decode(buffer: ArrayBuffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder("windows-1258").decode(buffer);
  }
}

function tableFromJson(value: unknown): Cell[][] {
  const list = Array.isArray(value) ? value : (value as { workouts?: unknown[] })?.workouts;
  if (!Array.isArray(list) || list.length === 0) throw new Error("The JSON file should be a list of sessions (or { \"workouts\": [...] }).");
  if (Array.isArray(list[0])) return list as Cell[][];
  const keys = [...new Set(list.flatMap((o) => Object.keys(o as object)))];
  return [keys, ...list.map((o) => keys.map((k) => (o as Record<string, Cell>)[k]))];
}

export async function readTable(file: File): Promise<Cell[][]> {
  const ext = file.name.toLowerCase().split(".").pop();
  if (ext === "xlsx") {
    const { default: readXlsxFile } = await import("read-excel-file/browser");
    const sheets = await readXlsxFile(file);
    // Use the first sheet that has any rows.
    const sheet = sheets.find((s) => s.data.length > 1) ?? sheets[0];
    return (sheet?.data ?? []) as Cell[][];
  }
  if (ext === "xls") throw new Error("Old .xls files aren't supported — in Excel use File › Save As › Excel Workbook (.xlsx) or CSV UTF-8.");
  const content = decode(await file.arrayBuffer());
  if (ext === "json") {
    try {
      return tableFromJson(JSON.parse(content));
    } catch (e) {
      throw new Error(e instanceof SyntaxError ? "This JSON file couldn't be read — check it's valid JSON." : (e as Error).message);
    }
  }
  return parseCsv(content);
}

// ---------- rows → sessions ----------

export interface ImportRow {
  /** Row number as seen in a spreadsheet (header row included) */
  line: number;
  date: string | null;
  week: number | null;
  weekday: number | null;
  time?: string;
  title: string;
  category: Category;
  durationMin: number;
  distanceKm?: number;
  difficulty: Difficulty;
  calories: number;
  focus?: string;
  notes?: string;
  done: boolean;
  warnings: string[];
  errors: string[];
}

export interface ParsedPlan {
  rows: ImportRow[];
  restDays: number;
  /** True when rows are positioned by week + weekday and need a start date */
  usesWeeks: boolean;
  recognized: Field[];
}

const PACE_MIN_PER_KM: Partial<Record<Category, number>> = { running: 6, cycling: 2.4, swimming: 25 };

export function parsePlan(table: Cell[][], defaults: { difficulty: Difficulty; durationMin: number }): ParsedPlan {
  const headerIndex = table.slice(0, 15).findIndex((r) => r.filter((c) => fieldForHeader(text(c))).length >= 2);
  if (headerIndex < 0) {
    throw new Error("Couldn't find a header row. The first row should name the columns, e.g. Date / Week, Day, Workout, Type, Duration.");
  }
  // A field may come from several columns (e.g. JSON rows mixing "duration" and "durationMin").
  const columns = new Map<Field, number[]>();
  table[headerIndex].forEach((c, i) => {
    const f = fieldForHeader(text(c));
    if (f) columns.set(f, [...(columns.get(f) ?? []), i]);
  });
  if (!columns.has("date") && !(columns.has("week") && columns.has("weekday"))) {
    throw new Error("Add a Date column, or both Week and Day columns, so each session can be placed on the calendar.");
  }

  const filled = (c: Cell) => c instanceof Date || typeof c === "number" || typeof c === "boolean" || text(c) !== "";
  const get = (r: Cell[], f: Field): Cell => {
    const idx = columns.get(f);
    if (!idx) return undefined;
    return r[idx.find((i) => filled(r[i])) ?? idx[0]];
  };
  // In a Vietnamese "Thứ" column a bare 2 means Monday (Thứ 2), not ISO Tuesday.
  const vietnameseWeekdays = columns.has("weekday") && compact(text(table[headerIndex][columns.get("weekday")![0]])).startsWith("thu");
  const rows: ImportRow[] = [];
  let restDays = 0;

  table.slice(headerIndex + 1).forEach((r, i) => {
    const line = headerIndex + i + 2;
    if (r.every((c) => text(c) === "" && !(c instanceof Date) && typeof c !== "number")) return;
    const errors: string[] = [];
    const warnings: string[] = [];

    const titleText = text(get(r, "title"));
    const categoryText = text(get(r, "category"));
    const notes = text(get(r, "notes")) || undefined;
    const rawDuration = get(r, "duration");
    const duration = parseDuration(rawDuration);

    if ((isRest(categoryText) || (!categoryText && isRest(titleText))) && !duration) {
      restDays++;
      return;
    }

    // Date: a real date, or week + weekday. A "Ngày" column holding "Thứ 2" counts as weekday.
    const rawDate = get(r, "date");
    const date = rawDate === undefined ? null : parseDate(rawDate);
    let weekday = parseWeekday(get(r, "weekday"), vietnameseWeekdays);
    if (!date && rawDate !== undefined && weekday === null) weekday = parseWeekday(rawDate, true);
    const week = parseWeek(get(r, "week"));
    if (!date && (week === null || weekday === null)) {
      errors.push(text(rawDate) ? `Unrecognised date “${text(rawDate)}”` : "Missing date (or week + day)");
    }

    let category = detectCategory(categoryText) ?? detectCategory(titleText, notes ?? "");
    if (!category) {
      category = "cardio";
      warnings.push(categoryText ? `Unknown type “${categoryText}”, using Cardio` : "No type given, using Cardio");
    } else if (categoryText && !detectCategory(categoryText)) {
      warnings.push(`Type “${categoryText}” guessed as ${CATEGORIES[category].label} from the title`);
    }

    const distance = get(r, "distance") !== undefined ? parseDistance(get(r, "distance"), category) : null;
    if (text(get(r, "distance")) && distance === null) warnings.push(`Ignored distance “${text(get(r, "distance"))}”`);

    let durationMin = duration;
    if (durationMin === null) {
      if (text(rawDuration)) errors.push(`Unrecognised duration “${text(rawDuration)}”`);
      else if (distance && PACE_MIN_PER_KM[category]) {
        durationMin = Math.round(distance * PACE_MIN_PER_KM[category]!);
        warnings.push("Duration estimated from distance");
      } else {
        durationMin = defaults.durationMin;
        warnings.push(`No duration, using ${defaults.durationMin} min`);
      }
    }
    if (durationMin !== null && (durationMin < 1 || durationMin > 600)) errors.push("Duration must be 1–600 minutes");

    const rawTime = get(r, "time");
    const time = parseTime(rawTime) ?? undefined;
    if (text(rawTime) && !time) warnings.push(`Ignored start time “${text(rawTime)}”`);

    const difficulty = parseDifficulty(get(r, "difficulty"), defaults.difficulty);
    const minutes = durationMin ?? defaults.durationMin;
    const title =
      titleText || `${CATEGORIES[category].label}${distance ? ` ${+distance.toFixed(2)} km` : ` ${minutes} min`}`;

    rows.push({
      line,
      date,
      week,
      weekday,
      time,
      title: title.slice(0, 80),
      category,
      durationMin: minutes,
      distanceKm: distance ?? undefined,
      difficulty,
      calories: estimateCalories(category, minutes, difficulty),
      focus: text(get(r, "focus")) || (titleText && categoryText && !detectCategory(categoryText) ? categoryText : undefined),
      notes: notes?.slice(0, 500),
      done: get(r, "done") !== undefined && parseDone(get(r, "done")),
      warnings,
      errors,
    });
  });

  return {
    rows,
    restDays,
    usesWeeks: rows.some((r) => !r.date && r.week !== null && r.weekday !== null),
    recognized: [...columns.keys()],
  };
}

/** Week 1 starts on the Monday of the week containing `startDate`. */
export function resolveDate(row: ImportRow, startDate: string): string | null {
  if (row.date) return row.date;
  if (row.week === null || row.weekday === null) return null;
  return addDays(startOfWeek(startDate), (row.week - 1) * 7 + row.weekday);
}

/** Monday on or after today: the natural default for a new plan. */
export function nextMonday(today = todayKey()): string {
  const monday = startOfWeek(today);
  return monday === today ? today : addDays(monday, 7);
}

export const TEMPLATE_CSV = [
  "Tuần,Thứ,Giờ,Bài tập,Môn,Thời lượng (phút),Cự ly (km),Cường độ,Ghi chú",
  "1,Thứ 2,05:30,Bơi kỹ thuật,Bơi,45,1.5,Nhẹ,Drill + 10x100m",
  "1,Thứ 3,05:30,Chạy Zone 2,Chạy,50,8,Nhẹ,Giữ nhịp tim Z2",
  "1,Thứ 4,18:00,Gym toàn thân,Gym,45,,Trung bình,Squat - Deadlift - Core",
  "1,Thứ 5,05:30,Đạp interval,Đạp xe,75,30,Nặng,5x5 phút ngưỡng",
  "1,Thứ 6,,Nghỉ,Nghỉ,,,,",
  "1,Thứ 7,05:30,Brick đạp + chạy,Brick,120,45,Trung bình,Đạp 90 phút + chạy 30 phút",
  "1,CN,06:00,Chạy dài,Chạy,90,15,Nhẹ,",
].join("\r\n");
