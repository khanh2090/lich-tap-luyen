import { ClipboardCheck, LibraryBig, Plus, Target } from "lucide-react";
import { weeklyGoalProgress } from "../lib/stats";
import { useData } from "../state/store";
import { useUi } from "../state/ui";

function GoalRing({ pct }: { pct: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 120 120" className="size-32 shrink-0 -rotate-90" aria-hidden>
      <circle cx="60" cy="60" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="12" />
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke="var(--color-lime)"
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - Math.min(pct, 100) / 100)}
        style={{ transition: "stroke-dashoffset 900ms var(--ease-out-soft)" }}
      />
    </svg>
  );
}

export function QuickActions() {
  const { data, today } = useData();
  const { openWorkoutModal, setGoalModal, navigate } = useUi();
  const goal = weeklyGoalProgress(data.workouts, data.profile, today);

  const actions = [
    { label: "Log Activity", icon: ClipboardCheck, onClick: () => openWorkoutModal({ mode: "log" }) },
    { label: "Set Weekly Goal", icon: Target, onClick: () => setGoalModal(true) },
    { label: "Browse Exercises", icon: LibraryBig, onClick: () => navigate("library") },
  ];

  return (
    <section className="card flex flex-col p-5 sm:p-6" aria-labelledby="goal-title">
      <p className="eyebrow mb-1">This week</p>
      <h2 id="goal-title" className="display text-xl font-bold text-ink sm:text-2xl">
        Weekly Goal
      </h2>
      <div className="mt-4 flex items-center gap-5">
        <div className="relative">
          <GoalRing pct={goal.pct} />
          <span className="absolute inset-0 grid place-items-center">
            <span className="display text-3xl font-bold text-ink">{goal.pct}%</span>
          </span>
        </div>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-muted">Workouts</dt>
            <dd className="display text-lg font-bold text-ink">
              {goal.workouts} <span className="text-sm text-muted">/ {goal.goal.workouts}</span>
            </dd>
          </div>
          <div>
            <dt className="text-muted">Active minutes</dt>
            <dd className="display text-lg font-bold text-ink">
              {goal.minutes} <span className="text-sm text-muted">/ {goal.goal.minutes}</span>
            </dd>
          </div>
        </dl>
      </div>

      <p className="eyebrow mt-6 mb-3">Quick actions</p>
      <button className="btn btn-primary w-full" onClick={() => openWorkoutModal({ mode: "create" })}>
        <Plus className="size-5" strokeWidth={2.6} /> Create Workout
      </button>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={a.onClick}
            className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-line bg-surface px-2 text-center text-xs font-semibold text-ink transition-all hover:-translate-y-0.5 hover:border-lime/60 active:scale-95"
          >
            <a.icon className="size-5 text-lime-ink" />
            {a.label}
          </button>
        ))}
      </div>
    </section>
  );
}
