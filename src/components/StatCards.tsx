import { ArrowDownRight, ArrowUpRight, Dumbbell, Flame, Timer, Zap } from "lucide-react";
import { addDays, rangeKeys } from "../lib/dates";
import { formatNumber } from "../lib/format";
import { bestStreak, completedIn, currentStreak, dailySeries, last30Summary, percentChange } from "../lib/stats";
import { useData } from "../state/store";
import { ProgressBar } from "./ui/primitives";

function Delta({ current, previous, suffix = "vs prev. 30 days" }: { current: number; previous: number; suffix?: string }) {
  const pct = percentChange(current, previous);
  if (pct === null) return <span className="text-xs text-muted">New this period</span>;
  const up = pct >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted">
      <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-bold ${up ? "bg-lime/15 text-lime-ink" : "bg-orange/15 text-orange"}`}>
        <Icon className="size-3.5" strokeWidth={2.6} />
        {Math.abs(pct)}%
      </span>
      {suffix}
    </span>
  );
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const w = 160;
  const h = 44;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 4 - (v / max) * (h - 8)] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-11 w-full" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="spark-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.35" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${w},${h} L0,${h} Z`} fill="url(#spark-fill)" />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function CardShell({ icon: Icon, label, children, iconClass }: { icon: typeof Dumbbell; label: string; children: React.ReactNode; iconClass: string }) {
  return (
    <div className="card lift flex flex-col p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="eyebrow">{label}</p>
        <span className={`grid size-9 place-items-center rounded-xl ${iconClass}`}>
          <Icon className="size-[18px]" />
        </span>
      </div>
      {children}
    </div>
  );
}

export function StatCards() {
  const { data, today } = useData();
  const { current, previous } = last30Summary(data.workouts, today);
  const streak = currentStreak(data.workouts, today);
  const best = bestStreak(data.workouts);
  const monthlyMinuteTarget = Math.round((data.profile.weeklyGoal.minutes * 30) / 7);
  const minutesPct = Math.round((current.minutes / monthlyMinuteTarget) * 100);
  const window30 = rangeKeys(addDays(today, -29), 30);
  const activeDays = new Set(completedIn(data.workouts, window30[0], today).map((w) => w.date));
  const calorieSeries = dailySeries(data.workouts, addDays(today, -13), 14, "calories", today).map((p) => p.value);
  const last7 = rangeKeys(addDays(today, -6), 7);

  return (
    <section aria-label="Last 30 days at a glance" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <CardShell icon={Dumbbell} label="Total workouts" iconClass="bg-violet/15 text-violet">
        <p className="display text-5xl leading-none font-bold text-ink">{current.workouts}</p>
        <p className="mt-1 text-sm text-muted">sessions in the last 30 days</p>
        {/* One tick per day: filled when you trained */}
        <div className="mt-4 flex gap-[3px]" aria-hidden>
          {window30.map((d) => (
            <span key={d} className={`h-5 flex-1 rounded-[3px] ${activeDays.has(d) ? "bg-violet" : "bg-surface-2"}`} />
          ))}
        </div>
        <div className="mt-3">
          <Delta current={current.workouts} previous={previous.workouts} />
        </div>
      </CardShell>

      <CardShell icon={Timer} label="Active minutes" iconClass="bg-aqua/15 text-aqua">
        <p className="display text-5xl leading-none font-bold text-ink">{formatNumber(current.minutes)}</p>
        <p className="mt-1 text-sm text-muted">of {formatNumber(monthlyMinuteTarget)} min monthly target</p>
        <div className="mt-auto pt-5">
          <div className="mb-2 flex justify-between text-xs font-semibold">
            <span className="text-aqua">{minutesPct}% of target</span>
            <span className="text-muted">{Math.round(current.minutes / 60)} h</span>
          </div>
          <ProgressBar value={minutesPct} color="var(--color-aqua)" label="Active minutes toward monthly target" />
        </div>
      </CardShell>

      <CardShell icon={Flame} label="Calories burned" iconClass="bg-orange/15 text-orange">
        <p className="display text-5xl leading-none font-bold text-ink">
          {formatNumber(current.calories)}
          <span className="ml-1 text-lg text-muted">kcal</span>
        </p>
        <div className="mt-3">
          <Sparkline values={calorieSeries} color="#FF6B35" />
          <p className="mt-1 text-[0.7rem] text-muted">Daily burn, last 14 days</p>
        </div>
        <div className="mt-2">
          <Delta current={current.calories} previous={previous.calories} />
        </div>
      </CardShell>

      <div className="lift relative flex flex-col overflow-hidden rounded-[var(--radius-card)] bg-linear-to-br from-lime via-lime to-aqua p-5 text-navy shadow-card">
        <svg className="pointer-events-none absolute -top-4 -right-6 h-32 w-32 text-navy/10" viewBox="0 0 24 24" aria-hidden>
          <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" />
        </svg>
        <div className="mb-4 flex items-center justify-between">
          <p className="display text-[0.72rem] font-bold tracking-[0.14em] uppercase">Current streak</p>
          <span className="grid size-9 place-items-center rounded-xl bg-navy text-lime">
            <Zap className="size-[18px]" />
          </span>
        </div>
        <p className="display text-6xl leading-none font-bold">
          {streak}
          <span className="ml-1.5 text-xl">days</span>
        </p>
        <p className="mt-1 text-sm font-medium text-navy/70">Best ever: {best} days</p>
        <div className="mt-auto flex gap-1.5 pt-5" aria-label="Last 7 days">
          {last7.map((d) => {
            const done = completedIn(data.workouts, d, d).length > 0;
            return (
              <span key={d} className="flex flex-1 flex-col items-center gap-1">
                <span className={`grid size-7 place-items-center rounded-full ${done ? "bg-navy text-lime" : "border-2 border-dashed border-navy/30"}`}>
                  {done && <Flame className="size-3.5" />}
                </span>
                <span className="text-[0.62rem] font-bold uppercase">{new Date(d + "T00:00").toLocaleDateString("en-US", { weekday: "narrow" })}</span>
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
