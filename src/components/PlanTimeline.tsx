import { CalendarRange, Check, Clock, Download, FileUp, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CATEGORIES, CATEGORY_ORDER } from "../lib/categories";
import { addDays, daysBetween, formatDay, fromKey, rangeKeys, startOfWeek } from "../lib/dates";
import { formatDistance, formatMinutes } from "../lib/format";
import { arrangeDay, SLOT_BY_ID, sortByDateAndSlot } from "../lib/slots";
import { statusOf, totals } from "../lib/stats";
import { CHART_THEME, prefersReducedMotion } from "../lib/theme";
import { useData } from "../state/store";
import { useUi } from "../state/ui";
import type { Category, Workout } from "../types";
import { downloadTemplate } from "./ImportPlanModal";
import { Modal } from "./ui/Modal";
import { EmptyState, ProgressBar } from "./ui/primitives";

function SessionChip({ w }: { w: Workout }) {
  const { today, data } = useData();
  const { openWorkoutModal } = useUi();
  const status = statusOf(w, today);
  return (
    <button
      onClick={() => openWorkoutModal({ mode: "edit", workout: w })}
      className={`flex w-full flex-col rounded-lg px-2 py-1.5 text-left transition-transform hover:-translate-y-px ${
        status === "missed" ? "bg-orange/10" : status === "completed" ? "bg-lime/10" : "bg-surface-2"
      }`}
      style={{ boxShadow: `inset 3px 0 0 ${CATEGORIES[w.category].color}` }}
      title={[w.title, w.notes].filter(Boolean).join(" — ")}
    >
      <span className="flex items-center gap-1 text-[0.72rem] leading-tight font-semibold text-ink">
        {status === "completed" && <Check className="size-3 shrink-0 text-lime-ink" strokeWidth={3} />}
        {status === "missed" && <X className="size-3 shrink-0 text-orange" strokeWidth={3} />}
        <span className="line-clamp-2">{w.title}</span>
      </span>
      <span className="mt-0.5 text-[0.66rem] text-muted">
        {w.durationMin}′{w.distanceKm ? ` · ${formatDistance(w.distanceKm, data.profile.units)}` : ""}
      </span>
    </button>
  );
}

/** A day's sessions split into parts of the day, each under a small Sáng/Trưa/Chiều/Tối label. */
function DaySlots({ ws }: { ws: Workout[] }) {
  return (
    <div className="space-y-1.5">
      {arrangeDay(ws).map((g) => {
        const meta = g.slot ? SLOT_BY_ID[g.slot] : null;
        const Icon = meta?.icon ?? Clock;
        return (
          <div key={g.slot ?? "any"} className="space-y-1">
            <p className="flex items-center gap-1 text-[0.62rem] font-bold tracking-wide text-muted uppercase" title={meta ? `${meta.label} · ${meta.hint}` : "No time set"}>
              <Icon className="size-3 text-lime-ink" aria-hidden />
              {meta ? meta.vi : "Bất kỳ"}
            </p>
            {g.workouts.map((s) => (
              <SessionChip key={s.id} w={s} />
            ))}
          </div>
        );
      })}
    </div>
  );
}

const SPORT_ORDER: Category[] = ["swimming", "cycling", "running", ...CATEGORY_ORDER.filter((c) => !["swimming", "cycling", "running"].includes(c))];

export function PlanTimeline() {
  const { data, today, deletePlan } = useData();
  const { selectedPlanId, setSelectedPlanId, setImportOpen } = useUi();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const currentWeekRef = useRef<HTMLElement>(null);
  const theme = CHART_THEME[data.profile.theme];

  const plan = data.plans.find((p) => p.id === selectedPlanId) ?? data.plans[data.plans.length - 1];
  const sessions = useMemo(
    () => (plan ? sortByDateAndSlot(data.workouts.filter((w) => w.planId === plan.id)) : []),
    [data.workouts, plan],
  );

  const weeks = useMemo(() => {
    if (!sessions.length) return [];
    const first = startOfWeek(sessions[0].date);
    const count = Math.floor(daysBetween(first, startOfWeek(sessions[sessions.length - 1].date)) / 7) + 1;
    return Array.from({ length: count }, (_, i) => {
      const start = addDays(first, i * 7);
      const end = addDays(start, 6);
      const ws = sessions.filter((w) => w.date >= start && w.date <= end);
      return { index: i + 1, start, end, sessions: ws, totals: totals(ws), isCurrent: today >= start && today <= end };
    });
  }, [sessions, today]);

  // Jump to the current week when the plan opens.
  useEffect(() => {
    currentWeekRef.current?.scrollIntoView({ block: "center", behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [plan?.id]);

  if (!plan || !sessions.length) {
    return (
      <EmptyState
        icon={<CalendarRange className="size-6" />}
        title={plan ? "This plan has no sessions left" : "No training plan yet"}
        body="Import a whole plan from Excel, CSV or JSON and see it here from the first week to race day."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <button className="btn btn-primary" onClick={() => setImportOpen(true)}>
              <FileUp className="size-4" /> Import plan
            </button>
            <button className="btn btn-secondary" onClick={downloadTemplate}>
              <Download className="size-4" /> Template
            </button>
          </div>
        }
      />
    );
  }

  const all = totals(sessions);
  const done = sessions.filter((w) => w.status === "completed").length;
  const first = sessions[0].date;
  const last = sessions[sessions.length - 1].date;
  const current = weeks.find((w) => w.isCurrent);
  const phase =
    today < first ? `Starts in ${daysBetween(today, first)} days` : today > last ? "Plan finished" : `Week ${current?.index ?? "—"} of ${weeks.length}`;
  const sports = SPORT_ORDER.map((c) => ({ c, t: totals(sessions.filter((w) => w.category === c)) })).filter((s) => s.t.workouts > 0);
  const chart = weeks.map((w) => {
    const row: Record<string, number | string> = { label: `W${w.index}`, start: w.start };
    for (const { c } of sports) row[c] = Math.round((totals(w.sessions.filter((s) => s.category === c)).minutes / 60) * 10) / 10;
    return row;
  });

  return (
    <div className="space-y-6">
      <section className="card overflow-hidden" aria-labelledby="plan-title">
        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {data.plans.length > 1 ? (
                <>
                  <label htmlFor="plan-select" className="sr-only">
                    Choose plan
                  </label>
                  <select id="plan-select" className="input !w-auto !min-h-9 !py-1 text-sm" value={plan.id} onChange={(e) => setSelectedPlanId(e.target.value)}>
                    {data.plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <p className="eyebrow">Training plan</p>
              )}
              <span className="tag !bg-lime/15 !text-lime-ink">{phase}</span>
            </div>
            <h2 id="plan-title" className="display mt-3 text-2xl font-bold text-ink uppercase sm:text-3xl">
              {plan.name}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {formatDay(first, { weekday: "short", month: "short", day: "numeric", year: "numeric" })} →{" "}
              {formatDay(last, { weekday: "short", month: "short", day: "numeric", year: "numeric" })} · from {plan.sourceFile}
            </p>

            <dl className="mt-5 grid grid-cols-3 gap-3">
              <div>
                <dt className="text-xs text-muted">Weeks</dt>
                <dd className="display text-2xl font-bold text-ink">{weeks.length}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Sessions</dt>
                <dd className="display text-2xl font-bold text-ink">{sessions.length}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Training time</dt>
                <dd className="display text-2xl font-bold text-ink">{Math.round(all.minutes / 60)}h</dd>
              </div>
            </dl>

            <div className="mt-5">
              <div className="mb-1.5 flex justify-between text-xs font-semibold">
                <span className="text-muted">Completed</span>
                <span className="text-ink">
                  {done}/{sessions.length}
                </span>
              </div>
              <ProgressBar value={(done / sessions.length) * 100} label="Plan completion" />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {sports.map(({ c, t }) => (
                <span key={c} className="flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-xs">
                  <span className="size-2.5 rounded-full" style={{ background: CATEGORIES[c].color }} />
                  <span className="font-semibold text-ink">{CATEGORIES[c].label}</span>
                  <span className="text-muted">
                    {formatMinutes(t.minutes)}
                    {t.distanceKm > 0 && ` · ${formatDistance(t.distanceKm, data.profile.units, 0)}`}
                  </span>
                </span>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button className="btn btn-secondary btn-sm" onClick={() => setImportOpen(true)}>
                <FileUp className="size-4" /> Import another / update
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="size-4" /> Delete plan
              </button>
            </div>
          </div>

          <div>
            <p className="eyebrow mb-2">Weekly volume (hours)</p>
            <div className="h-56" role="img" aria-label={`Weekly training hours across ${weeks.length} weeks`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={theme.grid} strokeDasharray="4 6" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: theme.axis, fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: theme.axis, fontSize: 11 }} />
                  <Tooltip
                    cursor={{ fill: theme.cursor }}
                    content={({ active, payload, label }) =>
                      active && payload?.length ? (
                        <div className="rounded-xl border border-line bg-panel px-3 py-2 text-xs shadow-pop">
                          <p className="mb-1 font-semibold text-ink">
                            {String(label).replace("W", "Week ")} · {formatDay(String(payload[0].payload.start), { month: "short", day: "numeric" })}
                          </p>
                          {payload.filter((p) => Number(p.value) > 0).map((p) => (
                            <p key={String(p.dataKey)} className="flex items-center gap-2 text-muted">
                              <span className="size-2 rounded-full" style={{ background: CATEGORIES[p.dataKey as Category].color }} />
                              {CATEGORIES[p.dataKey as Category].label}: <span className="font-semibold text-ink">{p.value}h</span>
                            </p>
                          ))}
                        </div>
                      ) : null
                    }
                  />
                  {current && <ReferenceLine x={`W${current.index}`} stroke="var(--color-lime)" strokeDasharray="4 4" />}
                  {sports.map(({ c }, i) => (
                    <Bar
                      key={c}
                      dataKey={c}
                      stackId="h"
                      fill={CATEGORIES[c].color}
                      radius={i === sports.length - 1 ? [6, 6, 0, 0] : 0}
                      maxBarSize={28}
                      isAnimationActive={!prefersReducedMotion()}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      <ol className="space-y-4" aria-label="Plan weeks">
        {weeks.map((w) => (
          <li key={w.start}>
            <section
              ref={w.isCurrent ? currentWeekRef : undefined}
              className={`card scroll-mt-32 overflow-hidden ${w.isCurrent ? "ring-2 ring-lime" : ""} ${w.end < today && !w.isCurrent ? "opacity-80" : ""}`}
              aria-label={`Week ${w.index}`}
            >
              <header className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line px-4 py-3 sm:px-5">
                <h3 className="display text-lg font-bold text-ink">Week {w.index}</h3>
                <span className="text-sm text-muted">
                  {formatDay(w.start, { month: "short", day: "numeric" })} – {formatDay(w.end, { month: "short", day: "numeric" })}
                </span>
                {w.isCurrent && <span className="tag !bg-lime !text-navy">This week</span>}
                <span className="ml-auto text-xs font-semibold text-muted">
                  {w.totals.workouts} sessions · {formatMinutes(w.totals.minutes)}
                  {w.totals.distanceKm > 0 && ` · ${formatDistance(w.totals.distanceKm, data.profile.units, 0)}`}
                </span>
              </header>

              {/* Seven day columns on tablet+, a compact day list on phones */}
              <div className="hidden grid-cols-7 md:grid">
                {rangeKeys(w.start, 7).map((d) => {
                  const ds = w.sessions.filter((s) => s.date === d);
                  return (
                    <div key={d} className={`min-h-28 border-r border-line p-2 last:border-r-0 ${d === today ? "bg-lime/[0.06]" : ""}`}>
                      <p className={`mb-1.5 text-[0.7rem] font-bold uppercase ${d === today ? "text-lime-ink" : "text-muted"}`}>
                        {formatDay(d, { weekday: "short" })} {fromKey(d).getDate()}
                      </p>
                      <div className="space-y-1">
                        {ds.length ? <DaySlots ws={ds} /> : <p className="text-[0.7rem] text-muted/60">Rest</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <ul className="divide-y divide-line md:hidden">
                {rangeKeys(w.start, 7).map((d) => {
                  const ds = w.sessions.filter((s) => s.date === d);
                  return (
                    <li key={d} className={`flex gap-3 px-4 py-2.5 ${d === today ? "bg-lime/[0.06]" : ""}`}>
                      <span className={`w-12 shrink-0 pt-1 text-xs font-bold uppercase ${d === today ? "text-lime-ink" : "text-muted"}`}>
                        {formatDay(d, { weekday: "short" })}
                        <span className="block text-base text-ink">{fromKey(d).getDate()}</span>
                      </span>
                      <div className="flex-1 space-y-1">{ds.length ? <DaySlots ws={ds} /> : <p className="pt-1.5 text-xs text-muted/60">Rest day</p>}</div>
                    </li>
                  );
                })}
              </ul>
            </section>
          </li>
        ))}
      </ol>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this plan?"
        description={`“${plan.name}” and all ${sessions.length} of its sessions (including completed ones) will be removed.`}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setConfirmDelete(false)}>
              Cancel
            </button>
            <button
              className="btn btn-danger"
              onClick={() => {
                setConfirmDelete(false);
                setSelectedPlanId(null);
                deletePlan(plan.id);
              }}
            >
              <Trash2 className="size-4" /> Delete plan
            </button>
          </>
        }
      >
        <span />
      </Modal>
    </div>
  );
}
