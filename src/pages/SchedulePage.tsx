import { Plus } from "lucide-react";
import { CalendarView } from "../components/CalendarView";
import { PageHeader } from "../components/ui/primitives";
import { addDays } from "../lib/dates";
import { statusOf } from "../lib/stats";
import { useData } from "../state/store";
import { useUi } from "../state/ui";

export function SchedulePage() {
  const { data, today } = useData();
  const { openWorkoutModal } = useUi();
  const next7 = data.workouts.filter((w) => w.date >= today && w.date <= addDays(today, 6) && statusOf(w, today) !== "completed").length;

  return (
    <div>
      <PageHeader
        eyebrow={`${next7} sessions in the next 7 days`}
        title="Training Calendar"
        description="See the week at a glance, spot gaps, and move sessions around. Tap a day for details."
        action={
          <button className="btn btn-primary" onClick={() => openWorkoutModal({ mode: "create" })}>
            <Plus className="size-5" /> Add session
          </button>
        }
      />
      <CalendarView />
    </div>
  );
}
