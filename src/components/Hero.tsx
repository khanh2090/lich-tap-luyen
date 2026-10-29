import { ArrowRight, Flame, Play, Target, TrendingUp } from "lucide-react";
import { currentStreak, weeklyGoalProgress } from "../lib/stats";
import { useData } from "../state/store";
import { useUi } from "../state/ui";
import { useToast } from "../state/toast";
import { SmartImage } from "./ui/primitives";

const HERO_PHOTO = "1574680096145-d05b474e2155";

export function Hero() {
  const { data, today, startWorkout } = useData();
  const { navigate, openWorkoutModal } = useUi();
  const toast = useToast();
  const streak = currentStreak(data.workouts, today);
  const goal = weeklyGoalProgress(data.workouts, data.profile, today);
  const totalDone = data.workouts.filter((w) => w.status === "completed").length;
  const level = Math.floor(totalDone / 10) + 1;
  const toNext = 10 - (totalDone % 10);

  const startNext = () => {
    const todays = data.workouts.filter((w) => w.date === today).sort((a, b) => (a.time ?? "99").localeCompare(b.time ?? "99"));
    const running = todays.find((w) => w.status === "in_progress");
    if (running) {
      toast("info", `${running.title} is already running`, "Finish it from Today's Plan when you're done.");
      document.getElementById("todays-plan")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    const next = todays.find((w) => w.status === "scheduled");
    if (next) startWorkout(next.id);
    else openWorkoutModal({ mode: "create", prefill: { date: today } });
  };

  return (
    <section className="card relative overflow-hidden" aria-labelledby="hero-title">
      <div className="grid lg:grid-cols-[1.05fr_1fr]">
        <div className="grid-lines relative flex flex-col justify-center p-6 sm:p-10 lg:p-12">
          {/* Geometric motion accent */}
          <svg className="pointer-events-none absolute top-8 right-8 hidden h-14 w-44 text-lime/30 sm:block" viewBox="0 0 300 100" aria-hidden>
            <path d="M0 60h70l18-40 28 70 22-50 14 20h148" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="eyebrow mb-4 flex items-center gap-2 !text-lime-ink">
            <span className="live-dot size-2 rounded-full bg-lime" aria-hidden /> Level {level} · {toNext} workouts to level {level + 1}
          </p>
          <h1 id="hero-title" className="display text-[2.6rem] leading-[0.92] font-bold text-ink uppercase sm:text-6xl xl:text-7xl">
            Your <span className="relative inline-block text-navy">
              <span className="absolute inset-x-[-0.12em] inset-y-[0.08em] -skew-x-6 rounded-md bg-lime" aria-hidden />
              <span className="relative">next level</span>
            </span>
            <br />
            starts now.
          </h1>
          <p className="mt-5 max-w-md text-lg text-muted">Every rep counts. Every day is a new record.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button className="btn btn-primary !min-h-12 !px-6 text-base" onClick={startNext}>
              <Play className="size-5 fill-current" /> Start Workout
            </button>
            <button className="btn btn-secondary !min-h-12 !px-6 text-base" onClick={() => navigate("library")}>
              Explore Exercises <ArrowRight className="size-5" />
            </button>
          </div>
        </div>

        <div className="relative min-h-72 sm:min-h-96">
          <div className="absolute inset-0">
            <SmartImage photo={HERO_PHOTO} alt="Athlete lifting a barbell in a dark gym" width={1200} className="size-full" />
          </div>
          <div className="absolute inset-0 bg-linear-to-r from-panel via-transparent to-transparent max-lg:bg-linear-to-t max-lg:from-panel/70" aria-hidden />

          <div className="absolute top-5 left-5 flex items-center gap-2 rounded-2xl border border-white/10 bg-navy/60 px-3.5 py-2.5 text-snow backdrop-blur-md">
            <Flame className="size-5 text-orange" />
            <span>
              <span className="block text-[0.62rem] font-bold tracking-[0.16em] text-snow/70">STREAK</span>
              <span className="display block text-lg leading-none font-bold">{streak} DAYS</span>
            </span>
          </div>

          <div className="absolute right-5 bottom-5 w-48 rounded-2xl border border-white/10 bg-navy/60 p-3.5 text-snow backdrop-blur-md">
            <span className="flex items-center justify-between text-[0.62rem] font-bold tracking-[0.16em] text-snow/70">
              WEEKLY GOAL <Target className="size-4 text-lime" />
            </span>
            <span className="display mt-1 block text-2xl leading-none font-bold">{goal.pct}%</span>
            <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-white/15">
              <span className="progress-fill block h-full rounded-full bg-lime" style={{ width: `${goal.pct}%` }} />
            </span>
          </div>

          <div className="absolute bottom-5 left-5 hidden items-center gap-2 rounded-full bg-lime px-3.5 py-2 text-navy sm:flex">
            <TrendingUp className="size-4" strokeWidth={2.6} />
            <span className="display text-sm font-bold tracking-wide">LEVEL UP</span>
          </div>
        </div>
      </div>
    </section>
  );
}
