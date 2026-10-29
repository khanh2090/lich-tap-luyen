import { Check, ChevronLeft, ChevronRight, Clock, Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { CATEGORIES, CATEGORY_ORDER } from "../lib/categories";
import { addDays, addMonths, daysBetween, formatDay, fromKey, rangeKeys, startOfMonth, startOfWeek } from "../lib/dates";
import { statusOf } from "../lib/stats";
import { useData } from "../state/store";
import { useUi } from "../state/ui";
import type { Workout, WorkoutStatus } from "../types";
import { Segmented, StatusPill } from "./ui/primitives";
import { WorkoutActions } from "./WorkoutCard";

const STATUS_ICON: Partial<Record<WorkoutStatus, typeof Check>> = { completed: Check, missed: X, scheduled: Clock, in_progress: Clock };

function EventPill({ w, onClick }: { w: Workout; onClick(): void }) {
  const { today } = useData();
  const status = statusOf(w, today);
  const Icon = STATUS_ICON[status]!;
  const meta = CATEGORIES[w.category];
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-1.5 rounded-lg px-2 py-1 text-left text-[0.72rem] font-semibold transition-transform hover:-translate-y-px ${
        status === "missed" ? "bg-orange/10 text-muted line-through" : "bg-surface-2 text-ink"
      }`}
      style={{ boxShadow: `inset 3px 0 0 ${meta.color}` }}
      title={`${w.title} · ${status}`}
    >
      <Icon className={`size-3 shrink-0 ${status === "completed" ? "text-lime-ink" : status === "missed" ? "text-orange" : "text-muted"}`} strokeWidth={3} />
      <span className="truncate">{w.title}</span>
    </button>
  );
}

function DayPanel({ date, workouts, onClose }: { date: string; workouts: Workout[]; onClose(): void }) {
  const { openWorkoutModal } = useUi();
  const { today } = useData();
  return (
    <div className="card modal-in mt-4 p-5" aria-live="polite">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow">{date === today ? "Today" : formatDay(date, { weekday: "long" })}</p>
          <h3 className="display text-xl font-bold text-ink">{formatDay(date, { month: "long", day: "numeric", year: "numeric" })}</h3>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-primary btn-sm" onClick={() => openWorkoutModal({ mode: "create", prefill: { date } })}>
            <Plus className="size-4" /> Add session
          </button>
          <button className="icon-btn" onClick={onClose} aria-label="Close day details">
            <X className="size-5" />
          </button>
        </div>
      </div>
      {workouts.length === 0 ? (
        <p className="text-sm text-muted">No sessions on this day yet.</p>
      ) : (
        <ul className="divide-y divide-line">
          {workouts.map((w) => (
            <li key={w.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
              <span className="size-3 shrink-0 rounded-full max-sm:hidden" style={{ background: CATEGORIES[w.category].color }} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{w.title}</p>
                <p className="text-sm text-muted">
                  {w.time ?? "Any time"} · {w.durationMin} min · {CATEGORIES[w.category].label}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill status={statusOf(w, today)} />
                <WorkoutActions w={w} compact />
                <button className="btn btn-ghost btn-sm" onClick={() => openWorkoutModal({ mode: "edit", workout: w })}>
                  Details
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CalendarView() {
  const { data, today } = useData();
  const { weekStart, setWeekStart, openWorkoutModal } = useUi();
  const [view, setView] = useState<"week" | "month">("week");
  const [month, setMonth] = useState(() => startOfMonth(today));
  const [selected, setSelected] = useState<string | null>(today);

  const byDate = useMemo(() => {
    const map = new Map<string, Workout[]>();
    for (const w of [...data.workouts].sort((a, b) => (a.time ?? "99").localeCompare(b.time ?? "99"))) map.set(w.date, [...(map.get(w.date) ?? []), w]);
    return map;
  }, [data.workouts]);

  const monthDays = useMemo(() => {
    const first = startOfWeek(month);
    const last = addDays(addMonths(month, 1), -1);
    const weeks = Math.ceil((daysBetween(first, last) + 1) / 7);
    return rangeKeys(first, weeks * 7);
  }, [month]);

  const days = view === "week" ? rangeKeys(weekStart, 7) : monthDays;
  const inMonth = (d: string) => fromKey(d).getMonth() === fromKey(month).getMonth();
  const title = view === "week" ? `${formatDay(weekStart, { month: "short", day: "numeric" })} – ${formatDay(addDays(weekStart, 6), { month: "short", day: "numeric", year: "numeric" })}` : formatDay(month, { month: "long", year: "numeric" });

  const shift = (dir: 1 | -1) => (view === "week" ? setWeekStart(addDays(weekStart, 7 * dir)) : setMonth(addMonths(month, dir)));
  const goToday = () => {
    setWeekStart(startOfWeek(today));
    setMonth(startOfMonth(today));
    setSelected(today);
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <button className="icon-btn" onClick={() => shift(-1)} aria-label={`Previous ${view}`}>
            <ChevronLeft className="size-5" />
          </button>
          <button className="icon-btn" onClick={() => shift(1)} aria-label={`Next ${view}`}>
            <ChevronRight className="size-5" />
          </button>
        </div>
        <h2 className="display text-lg font-bold text-ink sm:text-xl" aria-live="polite">
          {title}
        </h2>
        <button className="btn btn-ghost btn-sm" onClick={goToday}>
          Today
        </button>
        <div className="ml-auto">
          <Segmented
            label="Calendar view"
            value={view}
            onChange={setView}
            options={[
              { value: "week", label: "Week" },
              { value: "month", label: "Month" },
            ]}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-line bg-surface/50">
          {rangeKeys(startOfWeek(today), 7).map((d) => (
            <div key={d} className="py-2.5 text-center text-[0.7rem] font-bold tracking-wider text-muted uppercase">
              <span className="sm:hidden">{formatDay(d, { weekday: "narrow" })}</span>
              <span className="max-sm:hidden">{formatDay(d, { weekday: "short" })}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d) => {
            const ws = byDate.get(d) ?? [];
            const isToday = d === today;
            const isSelected = d === selected;
            const muted = view === "month" && !inMonth(d);
            const limit = view === "week" ? 6 : 2;
            return (
              <div
                key={d}
                className={`group relative flex flex-col border-r border-b border-line p-1 last:border-r-0 sm:p-2 [&:nth-child(7n)]:border-r-0 ${view === "week" ? "min-h-40 sm:min-h-56" : "min-h-20 sm:min-h-28"} ${
                  isSelected ? "bg-lime/[0.06]" : ""
                } ${muted ? "opacity-40" : ""}`}
              >
                <button
                  onClick={() => setSelected(isSelected ? null : d)}
                  aria-label={`${formatDay(d, { weekday: "long", month: "long", day: "numeric" })}, ${ws.length} sessions`}
                  aria-pressed={isSelected}
                  className="absolute inset-0 z-0"
                />
                <span
                  className={`relative z-10 mb-1 grid size-7 place-items-center self-start rounded-full text-sm font-bold sm:size-8 ${
                    isToday ? "bg-lime text-navy" : isSelected ? "ring-2 ring-lime text-ink" : "text-ink"
                  }`}
                >
                  {fromKey(d).getDate()}
                </span>
                {/* Pills on larger screens; colored dots on phones */}
                <div className="relative z-10 hidden flex-col gap-1 sm:flex">
                  {ws.slice(0, limit).map((w) => (
                    <EventPill key={w.id} w={w} onClick={() => openWorkoutModal({ mode: "edit", workout: w })} />
                  ))}
                  {ws.length > limit && (
                    <button onClick={() => setSelected(d)} className="px-2 text-left text-[0.7rem] font-semibold text-muted hover:text-ink">
                      +{ws.length - limit} more
                    </button>
                  )}
                </div>
                <div className="pointer-events-none relative z-10 flex flex-wrap gap-1 px-1 sm:hidden">
                  {ws.map((w) => (
                    <span
                      key={w.id}
                      className={`size-2 rounded-full ${statusOf(w, today) === "missed" ? "opacity-40" : ""}`}
                      style={{ background: CATEGORIES[w.category].color }}
                    />
                  ))}
                </div>
                <button
                  onClick={() => openWorkoutModal({ mode: "create", prefill: { date: d } })}
                  className="absolute right-1.5 bottom-1.5 z-10 hidden size-7 place-items-center rounded-full bg-surface-2 text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-ink focus-visible:opacity-100 sm:grid"
                  aria-label={`Add session on ${formatDay(d, { month: "long", day: "numeric" })}`}
                >
                  <Plus className="size-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
        {CATEGORY_ORDER.map((c) => (
          <span key={c} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full" style={{ background: CATEGORIES[c].color }} /> {CATEGORIES[c].label}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <Check className="size-3.5 text-lime-ink" strokeWidth={3} /> Completed
        </span>
        <span className="flex items-center gap-1.5">
          <X className="size-3.5 text-orange" strokeWidth={3} /> Missed
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="size-3.5" strokeWidth={3} /> Scheduled
        </span>
      </div>

      {selected && <DayPanel date={selected} workouts={byDate.get(selected) ?? []} onClose={() => setSelected(null)} />}
    </div>
  );
}
