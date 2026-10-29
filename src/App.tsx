import { useEffect } from "react";
import { ExerciseDetailModal } from "./components/ExerciseCard";
import { GoalModal } from "./components/GoalModal";
import { Header } from "./components/Header";
import { MobileNav, Sidebar } from "./components/Navigation";
import { WorkoutFormModal } from "./components/WorkoutFormModal";
import { ChallengesPage } from "./pages/ChallengesPage";
import { CommunityPage } from "./pages/CommunityPage";
import { LibraryPage } from "./pages/LibraryPage";
import { OverviewPage } from "./pages/OverviewPage";
import { ProgressPage } from "./pages/ProgressPage";
import { SchedulePage } from "./pages/SchedulePage";
import { SettingsPage } from "./pages/SettingsPage";
import { WorkoutsPage } from "./pages/WorkoutsPage";
import { useStore } from "./state/store";
import { useUi, type Page } from "./state/ui";

const PAGES: Record<Page, () => React.ReactElement> = {
  overview: OverviewPage,
  workouts: WorkoutsPage,
  library: LibraryPage,
  schedule: SchedulePage,
  progress: ProgressPage,
  challenges: ChallengesPage,
  community: CommunityPage,
  settings: SettingsPage,
};

function LoadingSkeleton() {
  return (
    <div className="min-h-dvh md:pl-20 xl:pl-64" aria-busy="true" aria-label="Loading your dashboard">
      <div className="fixed inset-y-0 left-0 hidden w-20 border-r border-line bg-panel md:block xl:w-64" />
      <div className="mx-auto max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="skeleton h-14 rounded-2xl" />
        <div className="skeleton h-80 rounded-[var(--radius-card)]" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-44 rounded-[var(--radius-card)]" />
          ))}
        </div>
        <div className="skeleton h-72 rounded-[var(--radius-card)]" />
      </div>
    </div>
  );
}

export default function App() {
  const { data } = useStore();
  const { page } = useUi();
  const theme = data?.profile.theme ?? "dark";

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#10131F" : "#F6F4EE");
  }, [theme]);

  if (!data) return <LoadingSkeleton />;

  const Current = PAGES[page];
  return (
    <div className="min-h-dvh md:pl-20 xl:pl-64">
      <a href="#main" className="sr-only z-[80] rounded-full bg-lime px-4 py-2 font-semibold text-navy focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Skip to content
      </a>
      <Sidebar />
      <Header />
      <main id="main" className="mx-auto max-w-[1440px] px-4 pt-6 pb-28 sm:px-6 md:pb-12 lg:px-8 lg:pt-8">
        <div key={page} className="page-in">
          <Current />
        </div>
      </main>
      <MobileNav />
      <WorkoutFormModal />
      <GoalModal />
      <ExerciseDetailModal />
    </div>
  );
}
