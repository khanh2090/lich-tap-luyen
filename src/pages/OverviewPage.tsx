import { ArrowRight, Coffee } from "lucide-react";
import { useState } from "react";
import { ActivityChart } from "../components/ActivityChart";
import { ExerciseCard } from "../components/ExerciseCard";
import { Hero } from "../components/Hero";
import { QuickActions } from "../components/QuickActions";
import { StatCards } from "../components/StatCards";
import { ConfirmDelete, WorkoutCard } from "../components/WorkoutCard";
import { EmptyState, SectionHeader } from "../components/ui/primitives";
import { EXERCISES } from "../data/exercises";
import { formatDay } from "../lib/dates";
import { sortDay } from "../lib/slots";
import { useData } from "../state/store";
import { useUi } from "../state/ui";
import type { Workout } from "../types";

export function OverviewPage() {
  const { data, today } = useData();
  const { navigate, openWorkoutModal } = useUi();
  const [toDelete, setToDelete] = useState<Workout | null>(null);

  const todays = sortDay(data.workouts.filter((w) => w.date === today));
  const doneToday = todays.filter((w) => w.status === "completed").length;
  const recommended = EXERCISES.filter((e) => data.profile.favoriteCategories.includes(e.category) && !data.favorites.includes(e.id))
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 3);

  return (
    <div className="space-y-6 lg:space-y-8">
      <Hero />
      <StatCards />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <ActivityChart />
        <QuickActions />
      </div>

      <section id="todays-plan" aria-labelledby="plan-title" className="scroll-mt-28">
        <SectionHeader
          eyebrow={`${formatDay(today, { weekday: "long", month: "long", day: "numeric" })} · ${doneToday}/${todays.length} done`}
          title="Today's Workout Plan"
          action={
            <button className="btn btn-ghost btn-sm" onClick={() => navigate("workouts")}>
              All workouts <ArrowRight className="size-4" />
            </button>
          }
        />
        {todays.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {todays.map((w) => (
              <WorkoutCard key={w.id} w={w} onDelete={setToDelete} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Coffee className="size-6" />}
            title="Rest day"
            body="Nothing planned today. Recovery builds strength too — or add a quick session."
            action={
              <button className="btn btn-primary" onClick={() => openWorkoutModal({ mode: "create", prefill: { date: today } })}>
                Plan a workout
              </button>
            }
          />
        )}
      </section>

      {recommended.length > 0 && (
        <section aria-labelledby="rec-title">
          <SectionHeader
            eyebrow="Based on your favorite sports"
            title="Recommended For You"
            action={
              <button className="btn btn-ghost btn-sm" onClick={() => navigate("library")}>
                Explore library <ArrowRight className="size-4" />
              </button>
            }
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((e) => (
              <ExerciseCard key={e.id} exercise={e} />
            ))}
          </div>
        </section>
      )}

      <ConfirmDelete workout={toDelete} onClose={() => setToDelete(null)} />
    </div>
  );
}
