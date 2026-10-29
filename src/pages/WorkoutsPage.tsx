import { Clock, Dumbbell, FileUp, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { ConfirmDelete, useNow, volumeLabel, WorkoutActions, workoutImage } from "../components/WorkoutCard";
import { CategoryTag, DifficultyMeter, EmptyState, PageHeader, ProgressBar, Segmented, SmartImage, StatusPill } from "../components/ui/primitives";
import { CATEGORIES, CATEGORY_ORDER } from "../lib/categories";
import { relativeDayLabel } from "../lib/dates";
import { sortDay } from "../lib/slots";
import { liveProgress, statusOf } from "../lib/stats";
import { useData } from "../state/store";
import { useUi } from "../state/ui";
import type { Category, Workout, WorkoutStatus } from "../types";

type Filter = "upcoming" | "completed" | "missed" | "all";

function WorkoutRow({ w, onDelete }: { w: Workout; onDelete(w: Workout): void }) {
  const { data, today } = useData();
  const { openWorkoutModal } = useUi();
  const now = useNow();
  const status = statusOf(w, today);
  const volume = volumeLabel(w, data.profile.units);

  return (
    <li className="card lift group flex flex-col gap-4 p-3 sm:flex-row sm:items-center sm:p-4">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <SmartImage photo={workoutImage(w)} alt="" width={200} className="size-16 shrink-0 rounded-2xl sm:size-20" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={status} />
            <CategoryTag category={w.category} compact />
          </div>
          <h3 className="display mt-1.5 truncate text-lg font-bold text-ink">{w.title}</h3>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" /> {w.time ?? "Any time"} · {w.durationMin} min
            </span>
            {volume && <span>{volume}</span>}
            <span>{w.calories} kcal</span>
            <DifficultyMeter level={w.difficulty} />
          </p>
          {status === "in_progress" && (
            <div className="mt-2 max-w-xs">
              <ProgressBar value={liveProgress(w, now)} color="var(--color-aqua)" label={`${w.title} progress`} />
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 sm:shrink-0">
        <WorkoutActions w={w} compact />
        <button className="icon-btn ml-auto sm:ml-1" onClick={() => openWorkoutModal({ mode: "edit", workout: w })} aria-label={`Edit ${w.title}`}>
          <Pencil className="size-4" />
        </button>
        <button className="icon-btn" onClick={() => onDelete(w)} aria-label={`Delete ${w.title}`}>
          <Trash2 className="size-4" />
        </button>
      </div>
    </li>
  );
}

const MATCH: Record<Filter, (s: WorkoutStatus) => boolean> = {
  upcoming: (s) => s === "scheduled" || s === "in_progress",
  completed: (s) => s === "completed",
  missed: (s) => s === "missed",
  all: () => true,
};

export function WorkoutsPage() {
  const { data, today } = useData();
  const { openWorkoutModal, setImportOpen } = useUi();
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [toDelete, setToDelete] = useState<Workout | null>(null);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { upcoming: 0, completed: 0, missed: 0, all: data.workouts.length };
    for (const w of data.workouts) {
      const s = statusOf(w, today);
      if (MATCH.upcoming(s)) c.upcoming++;
      if (s === "completed") c.completed++;
      if (s === "missed") c.missed++;
    }
    return c;
  }, [data.workouts, today]);

  const groups = useMemo(() => {
    const term = query.trim().toLowerCase();
    const list = data.workouts
      .filter((w) => MATCH[filter](statusOf(w, today)))
      .filter((w) => category === "all" || w.category === category)
      .filter((w) => !term || [w.title, w.focus ?? "", w.notes ?? ""].some((s) => s.toLowerCase().includes(term)))
      .sort((a, b) => {
        const dir = filter === "upcoming" ? 1 : -1;
        return dir * (a.date.localeCompare(b.date) || (a.time ?? "99").localeCompare(b.time ?? "99"));
      });
    const map = new Map<string, Workout[]>();
    for (const w of list) map.set(w.date, [...(map.get(w.date) ?? []), w]);
    return [...map.entries()].map(([d, ws]) => [d, sortDay(ws)] as const);
  }, [data.workouts, filter, category, query, today]);

  return (
    <div>
      <PageHeader
        eyebrow="Plan · Track · Repeat"
        title="My Workouts"
        description="Everything you've planned and everything you've crushed, in one place."
        action={
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-secondary" onClick={() => setImportOpen(true)}>
              <FileUp className="size-5" /> Import plan
            </button>
            <button className="btn btn-primary" onClick={() => openWorkoutModal({ mode: "create" })}>
              <Plus className="size-5" /> Create Workout
            </button>
          </div>
        }
      />

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="scrollbar-none -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <Segmented
            label="Workout status"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "upcoming", label: `Upcoming ${counts.upcoming}` },
              { value: "completed", label: `Completed ${counts.completed}` },
              { value: "missed", label: `Missed ${counts.missed}` },
              { value: "all", label: `All ${counts.all}` },
            ]}
          />
        </div>
        <div className="flex flex-1 gap-3">
          <div className="relative flex-1">
            <label htmlFor="workout-search" className="sr-only">
              Search workouts
            </label>
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
            <input id="workout-search" className="input !rounded-full !pl-10" placeholder="Search workouts" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <label htmlFor="workout-category" className="sr-only">
            Filter by type
          </label>
          <select id="workout-category" className="input !w-auto !rounded-full" value={category} onChange={(e) => setCategory(e.target.value as Category | "all")}>
            <option value="all">All types</option>
            {CATEGORY_ORDER.map((c) => (
              <option key={c} value={c}>
                {CATEGORIES[c].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon={<Dumbbell className="size-6" />}
          title="No workouts here"
          body={query || category !== "all" ? "Try a different search or type filter." : "Plan your next session and it will show up here."}
          action={
            <button className="btn btn-primary" onClick={() => openWorkoutModal({ mode: "create" })}>
              <Plus className="size-5" /> Create Workout
            </button>
          }
        />
      ) : (
        <div className="space-y-8">
          {groups.map(([date, ws]) => (
            <section key={date} aria-label={relativeDayLabel(date, today)}>
              <h2 className={`eyebrow mb-3 ${date === today ? "!text-lime-ink" : ""}`}>
                {relativeDayLabel(date, today)}
                {date !== today && <span className="ml-2 font-normal tracking-normal normal-case">{new Date(date + "T00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>}
              </h2>
              <ul className="space-y-3">
                {ws.map((w) => (
                  <WorkoutRow key={w.id} w={w} onDelete={setToDelete} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
      <ConfirmDelete workout={toDelete} onClose={() => setToDelete(null)} />
    </div>
  );
}
