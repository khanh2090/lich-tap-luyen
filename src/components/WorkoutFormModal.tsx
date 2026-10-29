import { Loader2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { EXERCISES, EXERCISE_BY_ID } from "../data/exercises";
import { CATEGORIES, CATEGORY_ORDER, DIFFICULTIES, DISTANCE_CATEGORIES, estimateCalories } from "../lib/categories";
import { useData, type WorkoutInput } from "../state/store";
import { useUi } from "../state/ui";
import type { Category, Difficulty } from "../types";
import { Modal } from "./ui/Modal";

interface FormState {
  title: string;
  category: Category;
  date: string;
  time: string;
  durationMin: string;
  difficulty: Difficulty;
  focus: string;
  sets: string;
  reps: string;
  distanceKm: string;
  notes: string;
  exerciseId: string;
}

type Errors = Partial<Record<keyof FormState, string>>;

const num = (s: string) => (s.trim() === "" ? undefined : Number(s));

function validate(f: FormState): Errors {
  const e: Errors = {};
  if (!f.title.trim()) e.title = "Give your workout a name.";
  if (!f.date) e.date = "Pick a date.";
  const d = Number(f.durationMin);
  if (!f.durationMin || !Number.isFinite(d) || d < 1 || d > 600) e.durationMin = "Enter 1–600 minutes.";
  for (const key of ["sets", "reps"] as const) {
    const v = num(f[key]);
    if (v !== undefined && (!Number.isInteger(v) || v < 1 || v > 100)) e[key] = "Whole number, 1–100.";
  }
  const km = num(f.distanceKm);
  if (km !== undefined && (!Number.isFinite(km) || km <= 0 || km > 500)) e.distanceKm = "Enter 0.1–500.";
  return e;
}

function Field({ id, label, error, children, hint }: { id: string; label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-orange">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>
      )}
    </div>
  );
}

export function WorkoutFormModal() {
  const { workoutModal, closeWorkoutModal } = useUi();
  const { data, today, createWorkout, updateWorkout } = useData();
  const [form, setForm] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  // Initialise the form whenever the modal opens.
  useEffect(() => {
    if (!workoutModal) return;
    const p = data.profile;
    const base =
      workoutModal.mode === "edit"
        ? workoutModal.workout
        : {
            title: "",
            category: p.favoriteCategories[0] ?? "strength",
            date: today,
            durationMin: p.preferredDurationMin,
            difficulty: p.experience,
            ...(workoutModal.mode === "create" ? workoutModal.prefill : {}),
          };
    setForm({
      title: base.title ?? "",
      category: base.category ?? "strength",
      date: base.date ?? today,
      time: ("time" in base && base.time) || "",
      durationMin: String(base.durationMin ?? 30),
      difficulty: base.difficulty ?? "Intermediate",
      focus: ("focus" in base && base.focus) || "",
      sets: "sets" in base && base.sets ? String(base.sets) : "",
      reps: "reps" in base && base.reps ? String(base.reps) : "",
      distanceKm: "distanceKm" in base && base.distanceKm ? String(base.distanceKm) : "",
      notes: ("notes" in base && base.notes) || "",
      exerciseId: ("exerciseId" in base && base.exerciseId) || "",
    });
    setErrors({});
    setSubmitting(false);
  }, [workoutModal, data.profile, today]);

  if (!workoutModal || !form) return null;

  const mode = workoutModal.mode;
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm({ ...form, [key]: value });
  const duration = Number(form.durationMin) || 0;
  const calories = estimateCalories(form.category, duration, form.difficulty);

  const applyExercise = (id: string) => {
    const ex = EXERCISE_BY_ID.get(id);
    if (!ex) return set("exerciseId", "");
    setForm({
      ...form,
      exerciseId: id,
      title: form.title || ex.name,
      category: ex.category,
      durationMin: String(ex.durationMin),
      difficulty: ex.difficulty,
      focus: form.focus || ex.muscleGroups.join(" · "),
      sets: ex.sets ? String(ex.sets) : "",
      reps: ex.reps ? String(ex.reps) : "",
      distanceKm: ex.distanceKm ? String(ex.distanceKm) : "",
    });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) {
      document.getElementById(`wf-${Object.keys(errs)[0]}`)?.focus();
      return;
    }
    setSubmitting(true);
    const input: WorkoutInput = {
      title: form.title.trim(),
      category: form.category,
      date: form.date,
      time: form.time || undefined,
      durationMin: Math.round(duration),
      difficulty: form.difficulty,
      calories,
      focus: form.focus.trim() || undefined,
      sets: num(form.sets),
      reps: num(form.reps),
      distanceKm: num(form.distanceKm),
      notes: form.notes.trim() || undefined,
      exerciseId: form.exerciseId || undefined,
    };
    // Persistence goes through the repository; yield once so the saving state paints.
    await new Promise((r) => setTimeout(r, 150));
    if (mode === "edit") updateWorkout(workoutModal.workout.id, input);
    else createWorkout({ ...input, status: mode === "log" ? "completed" : "scheduled" });
    closeWorkoutModal();
  };

  const titles = { create: "Create workout", edit: "Workout details", log: "Log activity" };
  const descriptions = {
    create: "Plan a session — it shows up on your schedule and in your daily phone reminder.",
    edit: "Update the plan or fix what you logged.",
    log: "Record something you already did. It counts toward streaks and goals.",
  };
  const showDistance = DISTANCE_CATEGORIES.includes(form.category) || !!form.distanceKm;
  const err = (k: keyof FormState) => (errors[k] ? { "aria-invalid": true as const, "aria-describedby": `wf-${k}-error` } : {});

  return (
    <Modal
      open
      onClose={closeWorkoutModal}
      title={titles[mode]}
      description={descriptions[mode]}
      size="lg"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={closeWorkoutModal}>
            Cancel
          </button>
          <button type="submit" form="workout-form" className="btn btn-primary" disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {submitting ? "Saving…" : mode === "edit" ? "Save changes" : mode === "log" ? "Log activity" : "Create workout"}
          </button>
        </>
      }
    >
      <form id="workout-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field id="wf-exerciseId" label="Start from the library (optional)">
            <select id="wf-exerciseId" className="input" value={form.exerciseId} onChange={(e) => applyExercise(e.target.value)}>
              <option value="">Custom workout</option>
              {CATEGORY_ORDER.map((c) => (
                <optgroup key={c} label={CATEGORIES[c].label}>
                  {EXERCISES.filter((x) => x.category === c).map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field id="wf-title" label="Workout name" error={errors.title}>
            <input id="wf-title" className="input" value={form.title} maxLength={80} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Upper Body Strength" {...err("title")} />
          </Field>
        </div>
        <Field id="wf-category" label="Type">
          <select id="wf-category" className="input" value={form.category} onChange={(e) => set("category", e.target.value as Category)}>
            {CATEGORY_ORDER.map((c) => (
              <option key={c} value={c}>
                {CATEGORIES[c].label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="wf-difficulty" label="Difficulty">
          <select id="wf-difficulty" className="input" value={form.difficulty} onChange={(e) => set("difficulty", e.target.value as Difficulty)}>
            {DIFFICULTIES.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </Field>
        <Field id="wf-date" label="Date" error={errors.date}>
          <input id="wf-date" type="date" className="input" value={form.date} onChange={(e) => set("date", e.target.value)} {...err("date")} />
        </Field>
        <Field id="wf-time" label="Start time (optional)">
          <input id="wf-time" type="time" className="input" value={form.time} onChange={(e) => set("time", e.target.value)} />
        </Field>
        <Field id="wf-durationMin" label="Duration (min)" error={errors.durationMin} hint={duration ? `≈ ${calories} kcal estimated` : undefined}>
          <input id="wf-durationMin" type="number" inputMode="numeric" min={1} className="input" value={form.durationMin} onChange={(e) => set("durationMin", e.target.value)} {...err("durationMin")} />
        </Field>
        {showDistance ? (
          <Field id="wf-distanceKm" label="Distance (km)" error={errors.distanceKm}>
            <input id="wf-distanceKm" type="number" inputMode="decimal" step="0.1" min={0} className="input" value={form.distanceKm} onChange={(e) => set("distanceKm", e.target.value)} {...err("distanceKm")} />
          </Field>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Field id="wf-sets" label="Sets" error={errors.sets}>
              <input id="wf-sets" type="number" inputMode="numeric" min={1} className="input" value={form.sets} onChange={(e) => set("sets", e.target.value)} {...err("sets")} />
            </Field>
            <Field id="wf-reps" label="Reps" error={errors.reps}>
              <input id="wf-reps" type="number" inputMode="numeric" min={1} className="input" value={form.reps} onChange={(e) => set("reps", e.target.value)} {...err("reps")} />
            </Field>
          </div>
        )}
        <div className="sm:col-span-2">
          <Field id="wf-focus" label="Focus / muscle groups (optional)">
            <input id="wf-focus" className="input" value={form.focus} maxLength={80} onChange={(e) => set("focus", e.target.value)} placeholder="e.g. Chest · Back · Arms" />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field id="wf-notes" label="Notes (optional)">
            <textarea id="wf-notes" className="input min-h-20" rows={3} maxLength={500} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Targets, pace, how it felt…" />
          </Field>
        </div>
      </form>
    </Modal>
  );
}
