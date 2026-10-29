import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from "recharts";
import { addDays, daysBetween, startOfWeek, weekLabel } from "../lib/dates";
import { formatNumber } from "../lib/format";
import { dailySeries, metricOf, completedIn, percentChange, type Metric } from "../lib/stats";
import { ACCENTS, CHART_THEME, prefersReducedMotion } from "../lib/theme";
import { useData } from "../state/store";
import { useUi } from "../state/ui";
import { Segmented } from "./ui/primitives";

const METRICS: { value: Metric; label: string; unit: string }[] = [
  { value: "calories", label: "Calories", unit: "kcal" },
  { value: "minutes", label: "Duration", unit: "min" },
  { value: "workouts", label: "Workouts", unit: "sessions" },
];

interface Row {
  label: string;
  date: string;
  current: number;
  previous: number;
  isToday: boolean;
}

function ChartTooltip({ active, payload, unit }: TooltipContentProps<number, string> & { unit: string }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as Row;
  return (
    <div className="rounded-xl border border-line bg-panel px-3 py-2 shadow-pop">
      <p className="text-xs font-semibold text-muted">{new Date(row.date + "T00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</p>
      <p className="mt-1 flex items-center gap-2 text-sm font-bold text-ink">
        <span className="size-2.5 rounded-sm bg-lime" /> {formatNumber(row.current)} {unit}
      </p>
      <p className="flex items-center gap-2 text-xs text-muted">
        <span className="h-0.5 w-2.5 bg-aqua" /> Prev. week: {formatNumber(row.previous)} {unit}
      </p>
    </div>
  );
}

export function ActivityChart() {
  const { data, today } = useData();
  const { weekStart } = useUi();
  const [metric, setMetric] = useState<Metric>("calories");
  const theme = CHART_THEME[data.profile.theme];
  const unit = METRICS.find((m) => m.value === metric)!.unit;

  const current = dailySeries(data.workouts, weekStart, 7, metric, today);
  const previous = dailySeries(data.workouts, addDays(weekStart, -7), 7, metric, today);
  const rows: Row[] = current.map((p, i) => ({ label: p.label, date: p.date, current: p.value, previous: previous[i].value, isToday: p.isToday }));

  const isCurrentWeek = weekStart === startOfWeek(today);
  // Mid-week, compare against the same days of last week so the trend is fair.
  const span = isCurrentWeek ? daysBetween(weekStart, today) : 6;
  const total = metricOf(completedIn(data.workouts, weekStart, addDays(weekStart, 6)), metric);
  const prevTotal = metricOf(completedIn(data.workouts, addDays(weekStart, -7), addDays(weekStart, span - 7)), metric);
  const change = percentChange(total, prevTotal);

  return (
    <section className="card p-5 sm:p-6" aria-labelledby="activity-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow mb-1">{isCurrentWeek ? "This week" : weekLabel(weekStart)}</p>
          <h2 id="activity-title" className="display text-xl font-bold text-ink sm:text-2xl">
            Weekly Activity
          </h2>
        </div>
        <Segmented label="Chart metric" options={METRICS} value={metric} onChange={setMetric} />
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-2">
        <p className="display text-4xl leading-none font-bold text-ink">
          {formatNumber(total)} <span className="text-base font-semibold text-muted">{unit}</span>
        </p>
        {change !== null && (
          <p className={`flex items-center gap-1 text-sm font-semibold ${change >= 0 ? "text-lime-ink" : "text-orange"}`}>
            {change >= 0 ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
            {Math.abs(change)}% {isCurrentWeek ? "vs same days last week" : "vs previous week"}
          </p>
        )}
        <div className="ml-auto flex items-center gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-lime" /> Selected week
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 bg-aqua" /> Previous week
          </span>
        </div>
      </div>

      <div className="mt-4 h-64 sm:h-72" role="img" aria-label={`${METRICS.find((m) => m.value === metric)!.label} per day: ${rows.map((r) => `${r.label} ${r.current}`).join(", ")}`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 8, right: 4, left: -12, bottom: 0 }} barCategoryGap="22%">
            <CartesianGrid vertical={false} stroke={theme.grid} strokeDasharray="4 6" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: theme.axis, fontSize: 12, fontWeight: 600 }} dy={6} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: theme.axis, fontSize: 11 }} allowDecimals={false} width={44} />
            <Tooltip cursor={{ fill: theme.cursor, radius: 12 }} content={(props) => <ChartTooltip {...(props as TooltipContentProps<number, string>)} unit={unit} />} />
            <Bar dataKey="current" fill={ACCENTS.lime} radius={[10, 10, 4, 4]} maxBarSize={44} isAnimationActive={!prefersReducedMotion()} animationDuration={700} />
            <Line
              dataKey="previous"
              type="monotone"
              stroke={ACCENTS.aqua}
              strokeWidth={2.5}
              strokeDasharray="5 5"
              dot={{ r: 3, fill: ACCENTS.aqua, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              isAnimationActive={!prefersReducedMotion()}
              animationDuration={900}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
