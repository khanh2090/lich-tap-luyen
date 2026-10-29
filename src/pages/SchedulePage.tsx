import { FileUp, Plus } from "lucide-react";
import { CalendarView } from "../components/CalendarView";
import { PageHeader } from "../components/ui/primitives";
import { addDays } from "../lib/dates";
import { statusOf } from "../lib/stats";
import { useData } from "../state/store";
import { useUi } from "../state/ui";

export function SchedulePage() {
  const { data, today } = useData();
  const { openWorkoutModal, setImportOpen } = useUi();
  const next7 = data.workouts.filter((w) => w.date >= today && w.date <= addDays(today, 6) && statusOf(w, today) !== "completed").length;

  return (
    <div>
      <PageHeader
        eyebrow={`${next7} sessions in the next 7 days`}
        title="Training Calendar"
        description="See the week at a glance, spot gaps, and move sessions around. Import a whole plan to see it from start to finish."
        action={
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-secondary" onClick={() => setImportOpen(true)}>
              <FileUp className="size-5" /> Import plan
            </button>
            <button className="btn btn-primary" onClick={() => openWorkoutModal({ mode: "create" })}>
              <Plus className="size-5" /> Add session
            </button>
          </div>
        }
      />
      <CalendarView />
    </div>
  );
}
