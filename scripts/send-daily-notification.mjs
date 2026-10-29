// Sends today's workouts (plus a preview of tomorrow) to an ntfy topic.
// Usage: NTFY_TOPIC=<topic> node scripts/send-daily-notification.mjs
// Optional: NTFY_SERVER (default https://ntfy.sh), TZ_NAME (default Asia/Ho_Chi_Minh).

import { readFile } from "node:fs/promises";

// Keys match the PULSE web app categories (src/lib/categories.ts).
const TYPES = {
  strength: "🏋️ Sức mạnh",
  cardio: "❤️ Cardio",
  hiit: "⚡ HIIT",
  yoga: "🧘 Yoga & Mobility",
  running: "🏃 Chạy bộ",
  cycling: "🚴 Đạp xe",
  recovery: "🔋 Hồi phục",
  other: "⭐ Khác",
};

const topic = process.env.NTFY_TOPIC;
const server = process.env.NTFY_SERVER || "https://ntfy.sh";
const timeZone = process.env.TZ_NAME || "Asia/Ho_Chi_Minh";

if (!topic) {
  console.error("Missing NTFY_TOPIC");
  process.exit(1);
}

// en-CA formats dates as YYYY-MM-DD, matching the stored format.
function dateInZone(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(d);
}

function describe(w) {
  const parts = [TYPES[w.type] || TYPES.other, w.title];
  const extra = [];
  if (w.duration) extra.push(`${w.duration}′`);
  if (w.distance) extra.push(`${w.distance} km`);
  let line = `• ${w.time ? `${w.time} ` : ""}${parts.join(": ")}${extra.length ? ` (${extra.join(", ")})` : ""}`;
  if (w.details) line += `\n   ${w.details.replace(/\n/g, "\n   ")}`;
  return line;
}

const { workouts = [] } = JSON.parse(await readFile(new URL("../data/workouts.json", import.meta.url), "utf8"));
const today = dateInZone(0);
const tomorrow = dateInZone(1);

const todays = workouts.filter((w) => w.date === today && !w.done);
const tomorrows = workouts.filter((w) => w.date === tomorrow);

let title;
let message;
if (todays.length) {
  title = `Hôm nay có ${todays.length} bài tập 💪`;
  message = todays.map(describe).join("\n");
} else {
  title = "Hôm nay không có bài tập";
  message = "Nghỉ ngơi hoặc thêm bài mới trên web.";
}
if (tomorrows.length) {
  message += `\n\nNgày mai: ${tomorrows.map((w) => w.title).join(", ")}`;
}

const res = await fetch(server, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ topic, title, message, tags: ["calendar"], click: process.env.SITE_URL || undefined }),
});

if (!res.ok) {
  console.error(`ntfy responded ${res.status}: ${await res.text()}`);
  process.exit(1);
}
console.log(`Sent for ${today}: ${todays.length} workout(s).`);
