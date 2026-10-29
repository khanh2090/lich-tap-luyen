import { Check, Clock, Pencil, Play, RotateCcw, Share2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { EXERCISE_BY_ID } from "../data/exercises";
import { CATEGORIES } from "../lib/categories";
import { relativeDayLabel } from "../lib/dates";
import { formatDistance } from "../lib/format";
import { SLOT_BY_ID, slotMap } from "../lib/slots";
import { liveProgress, statusOf } from "../lib/stats";
import { useData } from "../state/store";
import { useUi } from "../state/ui";
import type { Workout } from "../types";
import { Modal } from "./ui/Modal";
import { CategoryTag, DifficultyMeter, ProgressBar, SmartImage, StatusPill } from "./ui/primitives";

/** Re-render every `ms` so time-based progress stays live. */
export function useNow(ms = 30_000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

export function workoutImage(w: Workout): string {
  return (w.exerciseId && EXERCISE_BY_ID.get(w.exerciseId)?.image) || CATEGORIES[w.category].image;
}

export function volumeLabel(w: Workout, units: "metric" | "imperial"): string | null {
  if (w.distanceKm) return formatDistance(w.distanceKm, units);
  if (w.sets && w.reps) return `${w.sets} × ${w.reps}`;
  if (w.sets) return `${w.sets} rounds`;
  return null;
}

export function ConfirmDelete({ workout, onClose }: { workout: Workout | null; onClose(): void }) {
  const { deleteWorkout } = useData();
  return (
    <Modal
      open={!!workout}
      onClose={onClose}
      title="Delete this workout?"
      description={workout ? `“${workout.title}” on ${relativeDayLabel(workout.date)} will be removed. This can't be undone.` : undefined}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-danger"
            onClick={() => {
              if (workout) deleteWorkout(workout.id);
              onClose();
            }}
          >
            <Trash2 className="size-4" /> Delete
          </button>
        </>
      }
    >
      <span />
    </Modal>
  );
}

/** Action buttons shared by card and list layouts. */
export function WorkoutActions({ w, compact = false }: { w: Workout; compact?: boolean }) {
  const { today, data, startWorkout, completeWorkout, reopenWorkout, addPost } = useData();
  const { openWorkoutModal } = useUi();
  const status = statusOf(w, today);
  const size = compact ? "btn-sm" : "";

  if (status === "in_progress")
    return (
      <button className={`btn btn-primary ${size}`} onClick={() => completeWorkout(w.id)}>
        <Check className="size-4" strokeWidth={3} /> Complete
      </button>
    );
  if (status === "scheduled" && w.date === today)
    return (
      <button className={`btn btn-primary ${size}`} onClick={() => startWorkout(w.id)}>
        <Play className="size-4 fill-current" /> Start
      </button>
    );
  if (status === "missed")
    return (
      <span className="flex gap-2">
        <button className={`btn btn-secondary ${size}`} onClick={() => openWorkoutModal({ mode: "edit", workout: { ...w, date: today } })}>
          <RotateCcw className="size-4" /> Reschedule
        </button>
        <button className={`btn btn-ghost ${size}`} onClick={() => completeWorkout(w.id)} title="Mark as done">
          <Check className="size-4" /> Done
        </button>
      </span>
    );
  if (status === "completed")
    return (
      <span className="flex gap-2">
        <button
          className={`btn btn-secondary ${size}`}
          onClick={() =>
            addPost({
              text: `Just finished ${w.title}. ${data.profile.name.split(" ")[0]} out.`,
              workoutTitle: w.title,
              category: w.category,
              stat: [`${w.durationMin} min`, volumeLabel(w, data.profile.units), `${w.calories} kcal`].filter(Boolean).join(" · "),
            })
          }
        >
          <Share2 className="size-4" /> Share
        </button>
        <button className={`btn btn-ghost ${size}`} onClick={() => reopenWorkout(w.id)} title="Mark as not done">
          <RotateCcw className="size-4" />
          <span className="sr-only">Mark as not done</span>
        </button>
      </span>
    );
  return (
    <button className={`btn btn-secondary ${size}`} onClick={() => openWorkoutModal({ mode: "edit", workout: w })}>
      View Details
    </button>
  );
}

export function WorkoutCard({ w, onDelete }: { w: Workout; onDelete(w: Workout): void }) {
  const { data, today } = useData();
  const { openWorkoutModal } = useUi();
  const now = useNow();
  const status = statusOf(w, today);
  const progress = liveProgress(w, now);
  const volume = volumeLabel(w, data.profile.units);
  const slot = slotMap(data.workouts.filter((x) => x.date === w.date)).get(w.id) ?? null;

  return (
    <article className="card lift group flex flex-col overflow-hidden">
      <div className="relative">
        <SmartImage photo={workoutImage(w)} alt={w.title} width={640} className="aspect-[16/10]" />
        <div className="absolute inset-0 bg-linear-to-t from-navy/80 via-navy/10 to-transparent" aria-hidden />
        <div className="absolute top-3 left-3">
          <StatusPill status={status} solid />
        </div>
        <div className="absolute top-2 right-2 flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
          <button className="icon-btn !size-9 bg-navy/60 !text-snow backdrop-blur hover:!bg-navy/80" onClick={() => openWorkoutModal({ mode: "edit", workout: w })} aria-label={`Edit ${w.title}`}>
            <Pencil className="size-4" />
          </button>
          <button className="icon-btn !size-9 bg-navy/60 !text-snow backdrop-blur hover:!bg-navy/80" onClick={() => onDelete(w)} aria-label={`Delete ${w.title}`}>
            <Trash2 className="size-4" />
          </button>
        </div>
        <div className="absolute right-3 bottom-3 left-3 flex items-end justify-between gap-2 text-snow">
          <span className="flex items-center gap-1.5 text-xs font-semibold">
            <Clock className="size-3.5" /> {w.time ?? (slot ? SLOT_BY_ID[slot].label : relativeDayLabel(w.date))}
          </span>
          <span className="display text-2xl leading-none font-bold">
            {w.distanceKm ? volume : `${w.durationMin}`}
            {!w.distanceKm && <span className="ml-0.5 text-sm font-semibold opacity-80">min</span>}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-center justify-between gap-2">
          <CategoryTag category={w.category} compact />
          <DifficultyMeter level={w.difficulty} />
        </div>
        <h3 className="display mt-2 text-lg leading-tight font-bold text-ink">{w.title}</h3>
        <p className="mt-1 text-sm text-muted">
          {[w.focus, w.distanceKm ? `${w.durationMin} min` : volume].filter(Boolean).join(" · ")}
        </p>
        {status === "in_progress" && (
          <div className="mt-3">
            <div className="mb-1.5 flex justify-between text-xs font-semibold">
              <span className="text-aqua">In progress</span>
              <span className="text-ink">{progress}%</span>
            </div>
            <ProgressBar value={progress} color="var(--color-aqua)" label={`${w.title} progress`} />
          </div>
        )}
        <div className="mt-auto pt-4">
          <WorkoutActions w={w} compact />
        </div>
      </div>
    </article>
  );
}
