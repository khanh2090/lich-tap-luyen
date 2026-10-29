import { ArrowDownRight, ArrowUpRight, Lock } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { computeAchievements } from "../lib/achievements";
import { CATEGORIES, CATEGORY_ORDER } from "../lib/categories";
import { addDays, addMonths, startOfMonth } from "../lib/dates";
import { formatDistance, formatMinutes, formatNumber } from "../lib/format";
import { bestStreak, completedIn, currentStreak, monthlySeries, percentChange, totals, weeklySeries } from "../lib/stats";
import { ACCENTS, CHART_THEME, prefersReducedMotion } from "../lib/theme";
import { useData } from "../state/store";
import { ProgressBar, SectionHeader } from "./ui/primitives";

function ChartTip({ active, payload, label, unit }: { active?: boolean; payload?: { value: number }[]; label?: string; unit: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-panel px-3 py-2 shadow-pop">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-sm font-bold text-ink">
        {formatNumber(payload[0].value)} {unit}
      </p>
    </div>
  );
}

export function KpiStrip() {
  const { data, today } = useData();
  const done = data.workouts.filter((w) => w.status === "completed");
  const all = totals(done);
  const weeks = weeklySeries(data.workouts, 8, data.profile, today);
  const items = [
    { label: "Total hours", value: (all.minutes / 60).toFixed(1), sub: `${formatNumber(all.calories)} kcal burned` },
    { label: "Current streak", value: `${currentStreak(data.workouts, today)}d`, sub: `Best: ${bestStreak(data.workouts)} days` },
    { label: "Goals completed", value: `${weeks.filter((w) => w.goalMet).length}/8`, sub: "weekly goals, last 8 weeks" },
    { label: "All-time workouts", value: formatNumber(all.workouts), sub: `${formatDistance(all.distanceKm, data.profile.units, 0)} covered` },
  ];
  return (
    <section className="card grid grid-cols-2 divide-line lg:grid-cols-4 lg:divide-x" aria-label="Lifetime totals">
      {items.map((it, i) => (
        <div key={it.label} className={`p-5 sm:p-6 ${i < 2 ? "max-lg:border-b max-lg:border-line" : ""} ${i % 2 === 0 ? "max-lg:border-r max-lg:border-line" : ""}`}>
          <p className="eyebrow">{it.label}</p>
          <p className="display mt-2 text-4xl font-bold text-ink sm:text-5xl">{it.value}</p>
          <p className="mt-1 text-xs text-muted">{it.sub}</p>
        </div>
      ))}
    </section>
  );
}

export function ProgressCharts() {
  const { data, today } = useData();
  const theme = CHART_THEME[data.profile.theme];
  const animate = !prefersReducedMotion();
  const months = monthlySeries(data.workouts, 6, today);
  const weeks = weeklySeries(data.workouts, 8, data.profile, today);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="card p-5 sm:p-6" aria-labelledby="monthly-title">
        <p className="eyebrow mb-1">Last 6 months</p>
        <h2 id="monthly-title" className="display text-xl font-bold text-ink">
          Workouts per month
        </h2>
        <div className="mt-4 h-60" role="img" aria-label={months.map((m) => `${m.label}: ${m.workouts} workouts`).join(", ")}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={months} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={theme.grid} strokeDasharray="4 6" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: theme.axis, fontSize: 12, fontWeight: 600 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: theme.axis, fontSize: 11 }} allowDecimals={false} />
              <Tooltip cursor={{ fill: theme.cursor }} content={(p) => <ChartTip {...(p as object)} unit="workouts" />} />
              <Bar dataKey="workouts" fill={ACCENTS.violet} radius={[10, 10, 4, 4]} maxBarSize={48} isAnimationActive={animate} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card p-5 sm:p-6" aria-labelledby="weekly-title">
        <p className="eyebrow mb-1">Last 8 weeks</p>
        <h2 id="weekly-title" className="display text-xl font-bold text-ink">
          Training time per week
        </h2>
        <div className="mt-4 h-60" role="img" aria-label={weeks.map((w) => `Week of ${w.label}: ${w.minutes} minutes`).join(", ")}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeks} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="aqua-fill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor={ACCENTS.aqua} stopOpacity={0.4} />
                  <stop offset="1" stopColor={ACCENTS.aqua} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={theme.grid} strokeDasharray="4 6" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: theme.axis, fontSize: 11, fontWeight: 600 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: theme.axis, fontSize: 11 }} />
              <Tooltip content={(p) => <ChartTip {...(p as object)} unit="min" />} />
              <ReferenceLine
                y={data.profile.weeklyGoal.minutes}
                stroke={ACCENTS.lime}
                strokeDasharray="6 6"
                label={{ value: "Goal", position: "insideTopRight", fill: theme.axis, fontSize: 11 }}
              />
              <Area dataKey="minutes" type="monotone" stroke={ACCENTS.aqua} strokeWidth={2.5} fill="url(#aqua-fill)" isAnimationActive={animate} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

export function PeriodComparison() {
  const { data, today } = useData();
  const thisStart = startOfMonth(today);
  const lastStart = addMonths(thisStart, -1);
  const dayOfMonth = Number(today.slice(8));
  // Compare month-to-date against the same number of days last month, so it's fair mid-month.
  const lastEnd = addDays(lastStart, Math.min(dayOfMonth, 31) - 1);
  const cur = totals(completedIn(data.workouts, thisStart, today));
  const prev = totals(completedIn(data.workouts, lastStart, lastEnd < thisStart ? lastEnd : addDays(thisStart, -1)));
  const rows = [
    { label: "Workouts", cur: cur.workouts, prev: prev.workouts, fmt: (n: number) => formatNumber(n) },
    { label: "Active time", cur: cur.minutes, prev: prev.minutes, fmt: formatMinutes },
    { label: "Calories", cur: cur.calories, prev: prev.calories, fmt: (n: number) => `${formatNumber(n)} kcal` },
    { label: "Distance", cur: cur.distanceKm, prev: prev.distanceKm, fmt: (n: number) => formatDistance(n, data.profile.units) },
    {
      label: "Avg. session",
      cur: cur.workouts ? Math.round(cur.minutes / cur.workouts) : 0,
      prev: prev.workouts ? Math.round(prev.minutes / prev.workouts) : 0,
      fmt: (n: number) => `${n} min`,
    },
  ];

  return (
    <section className="card p-5 sm:p-6" aria-labelledby="compare-title">
      <p className="eyebrow mb-1">Month to date · first {dayOfMonth} days</p>
      <h2 id="compare-title" className="display text-xl font-bold text-ink">
        This month vs last month
      </h2>
      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted">
            <th className="pb-2 font-semibold">Metric</th>
            <th className="pb-2 text-right font-semibold">This month</th>
            <th className="pb-2 text-right font-semibold max-sm:hidden">Last month</th>
            <th className="pb-2 text-right font-semibold">Change</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r) => {
            const pct = percentChange(r.cur, r.prev);
            return (
              <tr key={r.label}>
                <td className="py-3 text-muted">{r.label}</td>
                <td className="py-3 text-right font-semibold text-ink">{r.fmt(r.cur)}</td>
                <td className="py-3 text-right text-muted max-sm:hidden">{r.fmt(r.prev)}</td>
                <td className="py-3 text-right">
                  {pct === null ? (
                    <span className="text-xs text-muted">new</span>
                  ) : (
                    <span className={`inline-flex items-center gap-0.5 font-semibold ${pct >= 0 ? "text-lime-ink" : "text-orange"}`}>
                      {pct >= 0 ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
                      {Math.abs(pct)}%
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

export function CategoryBreakdown() {
  const { data, today } = useData();
  const recent = completedIn(data.workouts, addDays(today, -29), today);
  const total = totals(recent).minutes || 1;
  const rows = CATEGORY_ORDER.map((c) => ({ c, minutes: totals(recent.filter((w) => w.category === c)).minutes }))
    .filter((r) => r.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes);
  return (
    <section className="card p-5 sm:p-6" aria-labelledby="mix-title">
      <p className="eyebrow mb-1">Last 30 days</p>
      <h2 id="mix-title" className="display text-xl font-bold text-ink">
        Training mix
      </h2>
      <ul className="mt-5 space-y-4">
        {rows.map(({ c, minutes }) => (
          <li key={c}>
            <div className="mb-1.5 flex justify-between text-sm">
              <span className="font-medium text-ink">{CATEGORIES[c].label}</span>
              <span className="text-muted">
                {formatMinutes(minutes)} · {Math.round((minutes / total) * 100)}%
              </span>
            </div>
            <ProgressBar value={(minutes / total) * 100} color={CATEGORIES[c].color} label={`${CATEGORIES[c].label} share`} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Badges() {
  const { data, today } = useData();
  const badges = computeAchievements(data.workouts, data.profile, today);
  const earned = badges.filter((b) => b.earned).length;
  return (
    <section aria-labelledby="badges-title">
      <SectionHeader eyebrow={`${earned} of ${badges.length} unlocked`} title="Achievements" />
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        {badges.map((b, i) => (
          <li key={b.id} className={`card lift flex flex-col items-center p-5 text-center ${b.earned ? "" : "opacity-80"}`}>
            <span
              className={`relative grid size-20 place-items-center rounded-[28%] ${b.earned ? "badge-pop" : ""}`}
              style={{
                animationDelay: `${i * 60}ms`,
                background: b.earned ? `linear-gradient(135deg, ${b.colors[0]}, ${b.colors[1]})` : "var(--surface-2)",
              }}
            >
              <b.icon className={`size-9 ${b.earned ? "text-navy" : "text-muted"}`} strokeWidth={2.2} />
              {!b.earned && (
                <span className="absolute -right-1 -bottom-1 grid size-7 place-items-center rounded-full border-2 border-panel bg-surface text-muted">
                  <Lock className="size-3.5" />
                </span>
              )}
            </span>
            <p className="display mt-4 font-bold text-ink">{b.title}</p>
            <p className="mt-1 text-xs text-muted">{b.description}</p>
            {!b.earned && (
              <div className="mt-3 w-full">
                <ProgressBar value={(b.value / b.target) * 100} label={`${b.title} progress`} />
                <p className="mt-1.5 text-[0.7rem] text-muted">
                  {formatNumber(b.value)} / {formatNumber(b.target)}
                </p>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
