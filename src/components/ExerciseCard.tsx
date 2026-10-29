import { CalendarPlus, Heart, Repeat, Timer, Users, Wrench } from "lucide-react";
import { CATEGORIES } from "../lib/categories";
import { formatDistance, formatNumber } from "../lib/format";
import { useData } from "../state/store";
import { useUi } from "../state/ui";
import type { Exercise } from "../types";
import { Modal } from "./ui/Modal";
import { CategoryTag, DifficultyMeter, SmartImage } from "./ui/primitives";

function FavoriteButton({ exercise, className = "" }: { exercise: Exercise; className?: string }) {
  const { data, toggleFavorite } = useData();
  const saved = data.favorites.includes(exercise.id);
  return (
    <button
      onClick={() => toggleFavorite(exercise.id)}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${exercise.name} from favorites` : `Save ${exercise.name} to favorites`}
      className={`grid size-10 place-items-center rounded-full backdrop-blur transition-transform active:scale-90 ${
        saved ? "bg-lime text-navy" : "bg-navy/55 text-snow hover:bg-navy/75"
      } ${className}`}
    >
      <Heart className={`size-5 ${saved ? "fill-current" : ""}`} />
    </button>
  );
}

export function exerciseVolume(e: Exercise, units: "metric" | "imperial"): string {
  if (e.distanceKm) return formatDistance(e.distanceKm, units);
  if (e.sets && e.reps) return `${e.sets} × ${e.reps}`;
  if (e.sets) return `${e.sets} rounds`;
  return `${e.durationMin} min`;
}

export function ExerciseCard({ exercise, variant = "grid" }: { exercise: Exercise; variant?: "grid" | "feature" }) {
  const { data } = useData();
  const { setExerciseDetail } = useUi();
  return (
    <article className="card lift group relative flex flex-col overflow-hidden">
      <div className="relative">
        <SmartImage photo={exercise.image} alt={exercise.name} width={variant === "feature" ? 900 : 640} className={variant === "feature" ? "aspect-[4/3]" : "aspect-[4/3] sm:aspect-[5/4]"} />
        <div className="absolute inset-0 bg-linear-to-t from-navy via-navy/30 to-transparent" aria-hidden />
        <FavoriteButton exercise={exercise} className="absolute top-3 right-3" />
        <div className="absolute top-3 left-3">
          <span className="tag !bg-navy/60 !text-snow backdrop-blur">
            <span className="size-2 rounded-full" style={{ background: CATEGORIES[exercise.category].color }} aria-hidden />
            {CATEGORIES[exercise.category].label}
          </span>
        </div>
        <div className="absolute right-4 bottom-3 left-4 text-snow">
          <h3 className="display text-xl leading-tight font-bold">{exercise.name}</h3>
          <p className="mt-1 flex items-center gap-3 text-xs font-medium text-snow/80">
            <span className="flex items-center gap-1">
              <Timer className="size-3.5" /> {exercise.durationMin} min
            </span>
            <span className="flex items-center gap-1">
              <Repeat className="size-3.5" /> {exerciseVolume(exercise, data.profile.units)}
            </span>
          </p>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2">
          <DifficultyMeter level={exercise.difficulty} />
          <span className="flex items-center gap-1 text-xs text-muted" title="Athletes who saved this">
            <Users className="size-3.5" /> {formatNumber(exercise.popularity)}
          </span>
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-muted">{exercise.description}</p>
        <button className="btn btn-secondary btn-sm mt-4 self-start" onClick={() => setExerciseDetail(exercise)}>
          View Details
        </button>
      </div>
    </article>
  );
}

export function ExerciseDetailModal() {
  const { exerciseDetail: ex, setExerciseDetail, openWorkoutModal } = useUi();
  const { data } = useData();
  if (!ex) return null;
  const close = () => setExerciseDetail(null);
  const facts = [
    { icon: Timer, label: "Duration", value: `${ex.durationMin} min` },
    { icon: Repeat, label: "Volume", value: exerciseVolume(ex, data.profile.units) },
    { icon: Wrench, label: "Equipment", value: ex.equipment },
    { icon: Users, label: "Saved by", value: formatNumber(ex.popularity) },
  ];
  return (
    <Modal
      open
      onClose={close}
      title={ex.name}
      size="lg"
      footer={
        <>
          <button className="btn btn-ghost" onClick={close}>
            Close
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              close();
              openWorkoutModal({
                mode: "create",
                prefill: {
                  title: ex.name,
                  category: ex.category,
                  durationMin: ex.durationMin,
                  difficulty: ex.difficulty,
                  sets: ex.sets,
                  reps: ex.reps,
                  distanceKm: ex.distanceKm,
                  focus: ex.muscleGroups.join(" · "),
                  exerciseId: ex.id,
                },
              });
            }}
          >
            <CalendarPlus className="size-4" /> Add to plan
          </button>
        </>
      }
    >
      <div className="relative -mx-5 mb-5 sm:-mx-7">
        <SmartImage photo={ex.image} alt={ex.name} width={1000} className="aspect-[16/8]" />
        <FavoriteButton exercise={ex} className="absolute top-3 right-3" />
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <CategoryTag category={ex.category} />
        <DifficultyMeter level={ex.difficulty} />
      </div>
      <p className="text-ink">{ex.description}</p>
      <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {facts.map((f) => (
          <div key={f.label} className="rounded-2xl bg-surface p-3">
            <dt className="flex items-center gap-1.5 text-xs text-muted">
              <f.icon className="size-3.5" /> {f.label}
            </dt>
            <dd className="mt-1 text-sm font-semibold text-ink">{f.value}</dd>
          </div>
        ))}
      </dl>
      <p className="eyebrow mt-5 mb-2">Muscle groups</p>
      <div className="flex flex-wrap gap-2">
        {ex.muscleGroups.map((m) => (
          <span key={m} className="tag">
            {m}
          </span>
        ))}
      </div>
    </Modal>
  );
}
