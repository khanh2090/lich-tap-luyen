// Workout planner: data lives in data/workouts.json of a GitHub repo and is
// read/written through the GitHub Contents API, so the daily notifier
// (GitHub Actions) and this page always share the same source of truth.

const DATA_PATH = "data/workouts.json";
const SETTINGS_KEY = "lich-tap-luyen.settings";

const TYPES = {
  run: { icon: "🏃", label: "Chạy" },
  swim: { icon: "🏊", label: "Bơi" },
  bike: { icon: "🚴", label: "Đạp xe" },
  brick: { icon: "🔁", label: "Brick" },
  strength: { icon: "🏋️", label: "Sức mạnh" },
  rest: { icon: "😴", label: "Nghỉ / hồi phục" },
  other: { icon: "⭐", label: "Khác" },
};

const state = {
  workouts: [],
  sha: null, // blob sha of data file, required by the API to update it
  filter: "upcoming",
  editingId: null,
};

const $ = (sel) => document.querySelector(sel);

// ---------- settings ----------

// On GitHub Pages (owner.github.io/repo/) the repo can be inferred from the URL.
function defaultRepo() {
  const host = location.hostname;
  if (host.endsWith(".github.io")) {
    return { owner: host.split(".")[0], repo: location.pathname.split("/")[1] || "" };
  }
  return { owner: "", repo: "" };
}

function loadSettings() {
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
  } catch {
    saved = {};
  }
  const fallback = defaultRepo();
  return {
    owner: saved.owner || fallback.owner,
    repo: saved.repo || fallback.repo,
    token: saved.token || "",
  };
}

function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    showStatus("Trình duyệt không cho lưu cài đặt.", true);
  }
}

let settings = loadSettings();

// ---------- GitHub API ----------

function encodeBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function decodeBase64(b64) {
  const binary = atob(b64.replace(/\s/g, ""));
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
}

function apiUrl() {
  return `https://api.github.com/repos/${settings.owner}/${settings.repo}/contents/${DATA_PATH}`;
}

function apiHeaders() {
  const headers = { Accept: "application/vnd.github+json" };
  if (settings.token) headers.Authorization = `Bearer ${settings.token}`;
  return headers;
}

async function fetchWorkouts() {
  const res = await fetch(`${apiUrl()}?t=${Date.now()}`, { headers: apiHeaders(), cache: "no-store" });
  if (!res.ok) throw new Error(`Không tải được dữ liệu (HTTP ${res.status}).`);
  const file = await res.json();
  const data = JSON.parse(decodeBase64(file.content));
  state.sha = file.sha;
  state.workouts = Array.isArray(data.workouts) ? data.workouts : [];
}

async function pushWorkouts(workouts, message) {
  if (!settings.token) throw new Error("Cần nhập GitHub token trong Cài đặt để lưu.");
  const body = {
    message,
    content: encodeBase64(JSON.stringify({ workouts }, null, 2) + "\n"),
    sha: state.sha,
  };
  const res = await fetch(apiUrl(), {
    method: "PUT",
    headers: { ...apiHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.status === 409 || res.status === 422) {
    throw new Error("Dữ liệu vừa bị thay đổi ở nơi khác. Đã tải lại, hãy thử lại.");
  }
  if (!res.ok) throw new Error(`Lưu thất bại (HTTP ${res.status}).`);
  const result = await res.json();
  state.sha = result.content.sha;
  state.workouts = workouts;
}

// Apply a change to a copy of the list, save it, and re-sync on conflict.
async function commit(nextWorkouts, message) {
  setBusy(true);
  try {
    await pushWorkouts(nextWorkouts, message);
    showStatus("Đã lưu.");
  } catch (err) {
    showStatus(err.message, true);
    await reload();
  } finally {
    setBusy(false);
    render();
  }
}

async function reload() {
  if (!settings.owner || !settings.repo) {
    showStatus("Mở Cài đặt ⚙️ để nhập repo GitHub.", true);
    return;
  }
  try {
    await fetchWorkouts();
  } catch (err) {
    showStatus(err.message, true);
  }
  render();
}

// ---------- helpers ----------

function todayStr() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatDay(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const label = date.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
  const today = todayStr();
  if (dateStr === today) return `Hôm nay · ${label}`;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date.toDateString() === tomorrow.toDateString()) return `Ngày mai · ${label}`;
  return label;
}

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

let statusTimer;
function showStatus(text, isError = false) {
  const el = $("#status");
  el.textContent = text;
  el.classList.toggle("error", isError);
  el.hidden = false;
  clearTimeout(statusTimer);
  if (!isError) statusTimer = setTimeout(() => (el.hidden = true), 2500);
}

function setBusy(busy) {
  document.querySelectorAll("button").forEach((b) => (b.disabled = busy));
}

// ---------- rendering ----------

function visibleWorkouts() {
  const today = todayStr();
  const list = state.workouts.filter((w) => {
    if (state.filter === "upcoming") return w.date >= today;
    if (state.filter === "past") return w.date < today;
    return true;
  });
  const dir = state.filter === "past" ? -1 : 1;
  return list.sort((a, b) => dir * a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderCard(w) {
  const type = TYPES[w.type] || TYPES.other;
  const card = el("article", "card" + (w.done ? " done" : ""));

  const check = document.createElement("input");
  check.type = "checkbox";
  check.checked = !!w.done;
  check.setAttribute("aria-label", "Đã hoàn thành");
  check.addEventListener("change", () => toggleDone(w.id));

  const body = el("div", "body");
  body.append(el("div", "title", `${type.icon} ${w.title}`));
  const meta = [type.label];
  if (w.duration) meta.push(`${w.duration} phút`);
  if (w.distance) meta.push(`${w.distance} km`);
  body.append(el("div", "meta", meta.join(" · ")));
  if (w.details) body.append(el("div", "details", w.details));

  const tools = el("div", "tools");
  const editBtn = el("button", "", "✏️");
  editBtn.setAttribute("aria-label", "Sửa");
  editBtn.addEventListener("click", () => openForm(w));
  const delBtn = el("button", "", "🗑️");
  delBtn.setAttribute("aria-label", "Xoá");
  delBtn.addEventListener("click", () => removeWorkout(w));
  tools.append(editBtn, delBtn);

  card.append(check, body, tools);
  return card;
}

function render() {
  const list = $("#list");
  list.replaceChildren();
  const items = visibleWorkouts();
  if (items.length === 0) {
    list.append(el("p", "empty", "Chưa có bài tập nào. Bấm ＋ để thêm."));
    return;
  }
  const today = todayStr();
  let group;
  let current;
  for (const w of items) {
    if (w.date !== current) {
      current = w.date;
      group = el("div", "day" + (w.date === today ? " is-today" : ""));
      group.append(el("h3", "", formatDay(w.date)));
      list.append(group);
    }
    group.append(renderCard(w));
  }
}

// ---------- actions ----------

function openForm(workout) {
  const form = $("#form-workout");
  form.reset();
  state.editingId = workout ? workout.id : null;
  $("#form-title").textContent = workout ? "Sửa bài tập" : "Thêm bài tập";
  form.date.value = workout ? workout.date : todayStr();
  form.type.value = workout ? workout.type : "run";
  form.title.value = workout ? workout.title : "";
  form.duration.value = workout && workout.duration ? workout.duration : "";
  form.distance.value = workout && workout.distance ? workout.distance : "";
  form.details.value = workout ? workout.details || "" : "";
  $("#dlg-workout").showModal();
}

function readForm() {
  const form = $("#form-workout");
  return {
    date: form.date.value,
    type: form.type.value,
    title: form.title.value.trim(),
    duration: form.duration.value ? Number(form.duration.value) : null,
    distance: form.distance.value ? Number(form.distance.value) : null,
    details: form.details.value.trim(),
  };
}

async function saveForm() {
  const fields = readForm();
  let next;
  let message;
  if (state.editingId) {
    next = state.workouts.map((w) => (w.id === state.editingId ? { ...w, ...fields } : w));
    message = `Sửa bài tập ${fields.date}: ${fields.title}`;
  } else {
    next = [...state.workouts, { id: newId(), ...fields, done: false }];
    message = `Thêm bài tập ${fields.date}: ${fields.title}`;
  }
  $("#dlg-workout").close();
  await commit(next, message);
}

async function toggleDone(id) {
  const next = state.workouts.map((w) => (w.id === id ? { ...w, done: !w.done } : w));
  const w = next.find((x) => x.id === id);
  await commit(next, `${w.done ? "Hoàn thành" : "Bỏ hoàn thành"} ${w.date}: ${w.title}`);
}

async function removeWorkout(workout) {
  if (!confirm(`Xoá "${workout.title}"?`)) return;
  const next = state.workouts.filter((w) => w.id !== workout.id);
  await commit(next, `Xoá bài tập ${workout.date}: ${workout.title}`);
}

function openSettings() {
  const form = $("#form-settings");
  form.owner.value = settings.owner;
  form.repo.value = settings.repo;
  form.token.value = settings.token;
  $("#dlg-settings").showModal();
}

// ---------- wiring ----------

$("#btn-add").addEventListener("click", () => openForm(null));
$("#btn-cancel").addEventListener("click", () => $("#dlg-workout").close());
$("#form-workout").addEventListener("submit", (e) => {
  e.preventDefault();
  saveForm();
});

$("#btn-settings").addEventListener("click", openSettings);
$("#btn-settings-cancel").addEventListener("click", () => $("#dlg-settings").close());
$("#form-settings").addEventListener("submit", (e) => {
  e.preventDefault();
  const form = e.target;
  settings = { owner: form.owner.value.trim(), repo: form.repo.value.trim(), token: form.token.value.trim() };
  saveSettings(settings);
  $("#dlg-settings").close();
  reload();
});

document.querySelectorAll(".tab").forEach((tab) =>
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t === tab));
    state.filter = tab.dataset.filter;
    render();
  })
);

reload();
