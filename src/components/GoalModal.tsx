import { Loader2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useData } from "../state/store";
import { useUi } from "../state/ui";
import { Modal } from "./ui/Modal";

export function GoalModal() {
  const { goalModal, setGoalModal } = useUi();
  const { data, updateProfile } = useData();
  const [workouts, setWorkouts] = useState("");
  const [minutes, setMinutes] = useState("");
  const [errors, setErrors] = useState<{ workouts?: string; minutes?: string }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!goalModal) return;
    setWorkouts(String(data.profile.weeklyGoal.workouts));
    setMinutes(String(data.profile.weeklyGoal.minutes));
    setErrors({});
    setSaving(false);
  }, [goalModal, data.profile.weeklyGoal]);

  const close = () => setGoalModal(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const w = Number(workouts);
    const m = Number(minutes);
    const errs: typeof errors = {};
    if (!Number.isInteger(w) || w < 1 || w > 21) errs.workouts = "Choose 1–21 workouts per week.";
    if (!Number.isInteger(m) || m < 10 || m > 2000) errs.minutes = "Choose 10–2000 minutes per week.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 150));
    updateProfile({ weeklyGoal: { workouts: w, minutes: m } }, "Weekly goal updated");
    close();
  };

  return (
    <Modal
      open={goalModal}
      onClose={close}
      title="Set weekly goal"
      description="Ambitious but repeatable beats heroic and abandoned."
      footer={
        <>
          <button className="btn btn-ghost" onClick={close}>
            Cancel
          </button>
          <button type="submit" form="goal-form" className="btn btn-primary" disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {saving ? "Saving…" : "Save goal"}
          </button>
        </>
      }
    >
      <form id="goal-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="goal-workouts" className="field-label">
            Workouts per week
          </label>
          <input
            id="goal-workouts"
            type="number"
            inputMode="numeric"
            className="input"
            value={workouts}
            onChange={(e) => setWorkouts(e.target.value)}
            aria-invalid={!!errors.workouts}
            aria-describedby={errors.workouts ? "goal-workouts-error" : undefined}
          />
          {errors.workouts && (
            <p id="goal-workouts-error" className="mt-1.5 text-xs font-medium text-orange">
              {errors.workouts}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="goal-minutes" className="field-label">
            Active minutes per week
          </label>
          <input
            id="goal-minutes"
            type="number"
            inputMode="numeric"
            className="input"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            aria-invalid={!!errors.minutes}
            aria-describedby={errors.minutes ? "goal-minutes-error" : undefined}
          />
          {errors.minutes && (
            <p id="goal-minutes-error" className="mt-1.5 text-xs font-medium text-orange">
              {errors.minutes}
            </p>
          )}
        </div>
      </form>
    </Modal>
  );
}
