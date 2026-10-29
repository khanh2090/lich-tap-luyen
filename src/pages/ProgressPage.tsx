import { Target } from "lucide-react";
import { Badges, CategoryBreakdown, KpiStrip, PeriodComparison, ProgressCharts } from "../components/ProgressSection";
import { PageHeader } from "../components/ui/primitives";
import { useUi } from "../state/ui";

export function ProgressPage() {
  const { setGoalModal } = useUi();
  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        eyebrow="Make progress visible"
        title="Progress"
        description="Trends, streaks and milestones — all calculated from the workouts you've logged."
        action={
          <button className="btn btn-secondary" onClick={() => setGoalModal(true)}>
            <Target className="size-4" /> Set weekly goal
          </button>
        }
      />
      <KpiStrip />
      <ProgressCharts />
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <PeriodComparison />
        <CategoryBreakdown />
      </div>
      <Badges />
    </div>
  );
}
