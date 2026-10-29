import { Check, ChevronLeft, ChevronRight, Clock, Plus, X } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import { CATEGORIES, CATEGORY_ORDER } from "../lib/categories";
import { addDays, addMonths, daysBetween, formatDay, fromKey, rangeKeys, startOfMonth, startOfWeek } from "../lib/dates";
import { arrangeDay, SLOTS, type SlotGroup } from "../lib/slots";
import { statusOf } from "../lib/stats";
import { useData } from "../state/store";
import { useUi } from "../state/ui";
import type { Slot, Workout, WorkoutStatus } from "../types";
import { Segmented, SlotLabel, StatusPill } from "./ui/primitives";
import { PlanTimeline } from "./PlanTimeline";
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
      title={`${w.time ? `${w.time} · ` : ""}${w.title} · ${w.durationMin} min`}
    >
      <Icon className={`size-3 shrink-0 ${status === "completed" ? "text-lime-ink" : status === "missed" ? "text-orange" : "text-muted"}`} strokeWidth={3} />
      <span className="truncate">{w.title}</span>
    </button>
  );
}

/** Colored dots for phones, where a pill would not fit in a day column. */
function Dots({ ws }: { ws: Workout[] }) {
  const { today } = useData();
  return (
    <span className="flex flex-wrap justify-center gap-1">
      {ws.map((w) => (
        <span key={w.id} className={`size-2 rounded-full ${statusOf(w, today) === "missed" ? "opacity-40" : ""}`} style={{ background: CATEGORIES[w.category].color }} />
      ))}
    </span>
  );
}

function DayPanel({ date, groups, onClose }: { date: string; groups: SlotGroup[]; onClose(): void }) {
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
      {groups.length === 0 ? (
        <p className="text-sm text-muted">No sessions on this day yet.</p>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <section key={g.slot ?? "any"} aria-label={g.slot ?? "Any time"}>
              <SlotLabel slot={g.slot} className="mb-1" />
              <ul className="divide-y divide-line">
                {g.workouts.map((w) => (
                  <li key={w.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
                    <span className="size-3 shrink-0 rounded-full max-sm:hidden" style={{ background: CATEGORIES[w.category].color }} aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ink">{w.title}</p>
                      <p className="text-sm text-muted">
                        {w.time ? `${w.time} · ` : ""}
                        {w.durationMin} min · {CATEGORIES[w.category].label}
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
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

/** Week view: one row per part of the day (Morning … Evening), one column per day. */
function WeekSlotGrid({ groupsByDate, selected, onSelect }: { groupsByDate: Map<string, SlotGroup[]>; selected: string | null; onSelect(d: string | null): void }) {
  const { today } = useData();
  const { weekStart, openWorkoutModal } = useUi();
  const days = rangeKeys(weekStart, 7);
  const cell = (d: string, slot: Slot | null) => groupsByDate.get(d)?.find((g) => g.slot === slot)?.workouts ?? [];
  const hasUnslotted = days.some((d) => cell(d, null).length > 0);
  const rows: (Slot | null)[] = [...SLOTS.map((s) => s.id), ...(hasUnslotted ? [null] : [])];

  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-[2.25rem_repeat(7,minmax(0,1fr))] sm:grid-cols-[7.5rem_repeat(7,minmax(0,1fr))]">
        <div className="border-b border-line bg-surface/50" />
        {days.map((d) => {
          const isToday = d === today;
          const isSelected = d === selected;
          return (
            <button
              key={d}
              onClick={() => onSelect(isSelected ? null : d)}
              aria-pressed={isSelected}
              aria-label={`${formatDay(d, { weekday: "long", month: "long", day: "numeric" })}, show details`}
              className={`flex flex-col items-center gap-1 border-b border-l border-line bg-surface/50 py-2 transition-colors hover:bg-surface ${isSelected ? "bg-lime/[0.08]" : ""}`}
            >
              <span className="text-[0.66rem] font-bold tracking-wider text-muted uppercase">
                <span className="sm:hidden">{formatDay(d, { weekday: "narrow" })}</span>
                <span className="max-sm:hidden">{formatDay(d, { weekday: "short" })}</span>
              </span>
              <span
                className={`grid size-7 place-items-center rounded-full text-sm font-bold ${
                  isToday ? "bg-lime text-navy" : isSelected ? "text-ink ring-2 ring-lime" : "text-ink"
                }`}
              >
                {fromKey(d).getDate()}
              </span>
            </button>
          );
        })}

        {rows.map((slot) => (
          <Fragment key={slot ?? "any"}>
            <div className="flex items-start border-b border-line px-1.5 py-3 sm:px-3">
              <SlotLabel slot={slot} withHint />
            </div>
            {days.map((d) => {
              const ws = cell(d, slot);
              return (
                <div
                  key={d}
                  className={`group relative min-h-12 border-b border-l border-line p-1 sm:min-h-20 sm:p-1.5 ${d === today ? "bg-lime/[0.04]" : ""} ${d === selected ? "bg-lime/[0.08]" : ""}`}
                >
                  <div className="hidden flex-col gap-1 sm:flex">
                    {ws.map((w) => (
                      <EventPill key={w.id} w={w} onClick={() => openWorkoutModal({ mode: "edit", workout: w })} />
                    ))}
                  </div>
                  <button className="block w-full py-1 sm:hidden" onClick={() => onSelect(d)} aria-label={`${ws.length} sessions, ${formatDay(d, { weekday: "long" })}`}>
                    <Dots ws={ws} />
                  </button>
                  <button
                    onClick={() => openWorkoutModal({ mode: "create", prefill: { date: d, ...(slot ? { slot } : {}) } })}
                    className="absolute right-1 bottom-1 hidden size-6 place-items-center rounded-full bg-surface-2 text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:text-ink focus-visible:opacity-100 sm:grid"
                    aria-label={`Add ${slot ?? ""} session on ${formatDay(d, { month: "long", day: "numeric" })}`}
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

export function CalendarView() {
  const { data, today } = useData();
  const { weekStart, setWeekStart, openWorkoutModal, scheduleView: view, setScheduleView: setView } = useUi();
  const [month, setMonth] = useState(() => startOfMonth(today));
  const [selected, setSelected] = useState<string | null>(today);

  // Each day's sessions grouped by part of the day (Morning, Midday, …).
  const groupsByDate = useMemo(() => {
    const raw = new Map<string, Workout[]>();
    for (const w of data.workouts) raw.set(w.date, [...(raw.get(w.date) ?? []), w]);
    return new Map([...raw].map(([d, ws]) => [d, arrangeDay(ws)]));
  }, [data.workouts]);
  const dayList = (d: string) => (groupsByDate.get(d) ?? []).flatMap((g) => g.workouts);

  const monthDays = useMemo(() => {
    const first = startOfWeek(month);
    const last = addDays(addMonths(month, 1), -1);
    const weeks = Math.ceil((daysBetween(first, last) + 1) / 7);
    return rangeKeys(first, weeks * 7);
  }, [month]);

  const inMonth = (d: string) => fromKey(d).getMonth() === fromKey(month).getMonth();
  const title =
    view === "week"
      ? `${formatDay(weekStart, { month: "short", day: "numeric" })} – ${formatDay(addDays(weekStart, 6), { month: "short", day: "numeric", year: "numeric" })}`
      : formatDay(month, { month: "long", year: "numeric" });

  const shift = (dir: 1 | -1) => (view === "week" ? setWeekStart(addDays(weekStart, 7 * dir)) : setMonth(addMonths(month, dir)));
  const goToday = () => {
    setWeekStart(startOfWeek(today));
    setMonth(startOfMonth(today));
    setSelected(today);
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {view !== "plan" && (
          <>
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
          </>
        )}
        <div className="ml-auto">
          <Segmented
            label="Calendar view"
            value={view}
            onChange={setView}
            options={[
              { value: "week", label: "Week" },
              { value: "month", label: "Month" },
              { value: "plan", label: `Full plan${data.plans.length ? ` (${data.plans.length})` : ""}` },
            ]}
          />
        </div>
      </div>

      {view === "plan" ? (
        <PlanTimeline />
      ) : (
        <>
          {view === "week" ? (
            <WeekSlotGrid groupsByDate={groupsByDate} selected={selected} onSelect={setSelected} />
          ) : (
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
                {monthDays.map((d) => {
                  const ws = dayList(d);
                  const isToday = d === today;
                  const isSelected = d === selected;
                  const limit = 2;
                  return (
                    <div
                      key={d}
                      className={`group relative flex min-h-20 flex-col border-r border-b border-line p-1 last:border-r-0 sm:min-h-28 sm:p-2 [&:nth-child(7n)]:border-r-0 ${
                        isSelected ? "bg-lime/[0.06]" : ""
                      } ${inMonth(d) ? "" : "opacity-40"}`}
                    >
                      <button
                        onClick={() => setSelected(isSelected ? null : d)}
                        aria-label={`${formatDay(d, { weekday: "long", month: "long", day: "numeric" })}, ${ws.length} sessions`}
                        aria-pressed={isSelected}
                        className="absolute inset-0 z-0"
                      />
                      <span
                        className={`relative z-10 mb-1 grid size-7 place-items-center self-start rounded-full text-sm font-bold sm:size-8 ${
                          isToday ? "bg-lime text-navy" : isSelected ? "text-ink ring-2 ring-lime" : "text-ink"
                        }`}
                      >
                        {fromKey(d).getDate()}
                      </span>
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
                      <div className="pointer-events-none relative z-10 px-1 sm:hidden">
                        <Dots ws={ws} />
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
          )}

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

          {selected && <DayPanel date={selected} groups={groupsByDate.get(selected) ?? []} onClose={() => setSelected(null)} />}
        </>
      )}
    </div>
  );
}
