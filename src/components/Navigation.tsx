import {
  CalendarDays,
  Dumbbell,
  LayoutDashboard,
  LibraryBig,
  MoreHorizontal,
  Settings,
  TrendingUp,
  Trophy,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { useData } from "../state/store";
import { useUi, type Page } from "../state/ui";
import { weeklyGoalProgress } from "../lib/stats";
import { Logo, LogoMark } from "./Logo";
import { ProgressBar } from "./ui/primitives";

export const NAV: { page: Page; label: string; icon: LucideIcon }[] = [
  { page: "overview", label: "Overview", icon: LayoutDashboard },
  { page: "workouts", label: "My Workouts", icon: Dumbbell },
  { page: "library", label: "Exercise Library", icon: LibraryBig },
  { page: "schedule", label: "Schedule", icon: CalendarDays },
  { page: "progress", label: "Progress", icon: TrendingUp },
  { page: "challenges", label: "Challenges", icon: Trophy },
  { page: "community", label: "Community", icon: Users },
  { page: "settings", label: "Settings", icon: Settings },
];

function NavItem({ item }: { item: (typeof NAV)[number] }) {
  const { page, navigate } = useUi();
  const active = page === item.page;
  const Icon = item.icon;
  return (
    <button
      onClick={() => navigate(item.page)}
      aria-current={active ? "page" : undefined}
      title={item.label}
      className={`flex min-h-11 w-full items-center justify-center gap-3 rounded-2xl px-3 text-sm font-semibold transition-colors xl:justify-start ${
        active ? "bg-lime text-navy" : "text-muted hover:bg-surface hover:text-ink"
      }`}
    >
      <Icon className="size-5 shrink-0" strokeWidth={active ? 2.4 : 2} />
      <span className="sr-only xl:not-sr-only">{item.label}</span>
    </button>
  );
}

/** Fixed sidebar: full width on desktop (xl), icon rail on tablet (md–xl). */
export function Sidebar() {
  const { data } = useData();
  const { navigate } = useUi();
  const goal = weeklyGoalProgress(data.workouts, data.profile);
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-20 flex-col border-r border-line bg-panel px-3 py-5 md:flex xl:w-64 xl:px-4">
      <div className="mb-8 flex justify-center xl:justify-start xl:px-2">
        <span className="xl:hidden">
          <LogoMark />
        </span>
        <span className="hidden xl:block">
          <Logo showTagline />
        </span>
      </div>
      <nav aria-label="Main" className="flex flex-1 flex-col gap-1">
        {NAV.map((item) => (
          <NavItem key={item.page} item={item} />
        ))}
      </nav>
      <button
        onClick={() => navigate("progress")}
        className="mt-4 hidden rounded-2xl border border-line bg-surface p-4 text-left transition-colors hover:border-lime/50 xl:block"
      >
        <p className="eyebrow">Weekly goal</p>
        <p className="display mt-1 text-2xl font-bold text-ink">
          {goal.pct}
          <span className="text-base text-muted">%</span>
        </p>
        <p className="mb-3 text-xs text-muted">
          {goal.workouts}/{goal.goal.workouts} workouts · {goal.minutes}/{goal.goal.minutes} min
        </p>
        <ProgressBar value={goal.pct} label="Weekly goal progress" />
      </button>
    </aside>
  );
}

const PRIMARY_MOBILE: Page[] = ["overview", "workouts", "schedule", "progress"];

/** Bottom tab bar on phones, with a sheet for the remaining sections. */
export function MobileNav() {
  const { page, navigate } = useUi();
  const [moreOpen, setMoreOpen] = useState(false);
  const primary = NAV.filter((n) => PRIMARY_MOBILE.includes(n.page));
  const more = NAV.filter((n) => !PRIMARY_MOBILE.includes(n.page));
  const moreActive = more.some((n) => n.page === page);

  return (
    <>
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-panel/90 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-5">
          {primary.map((item) => {
            const Icon = item.icon;
            const active = page === item.page;
            return (
              <button
                key={item.page}
                onClick={() => navigate(item.page)}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[0.68rem] font-semibold ${active ? "text-lime-ink" : "text-muted"}`}
              >
                <span className={`grid h-7 w-12 place-items-center rounded-full transition-colors ${active ? "bg-lime text-navy" : ""}`}>
                  <Icon className="size-5" />
                </span>
                {item.label.replace("My ", "")}
              </button>
            );
          })}
          <button
            onClick={() => setMoreOpen(true)}
            aria-expanded={moreOpen}
            className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[0.68rem] font-semibold ${moreActive ? "text-lime-ink" : "text-muted"}`}
          >
            <span className={`grid h-7 w-12 place-items-center rounded-full ${moreActive ? "bg-lime text-navy" : ""}`}>
              <MoreHorizontal className="size-5" />
            </span>
            More
          </button>
        </div>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="More sections">
          <div className="fade-in absolute inset-0 bg-navy/70 backdrop-blur-sm" onClick={() => setMoreOpen(false)} />
          <div className="modal-in absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-line bg-panel p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            <div className="mb-4 flex items-center justify-between">
              <Logo showTagline />
              <button className="icon-btn" onClick={() => setMoreOpen(false)} aria-label="Close menu">
                <X className="size-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {more.map((item) => {
                const Icon = item.icon;
                const active = page === item.page;
                return (
                  <button
                    key={item.page}
                    onClick={() => {
                      navigate(item.page);
                      setMoreOpen(false);
                    }}
                    className={`flex min-h-14 items-center gap-3 rounded-2xl border px-4 text-sm font-semibold ${
                      active ? "border-lime bg-lime text-navy" : "border-line bg-surface text-ink"
                    }`}
                  >
                    <Icon className="size-5" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
