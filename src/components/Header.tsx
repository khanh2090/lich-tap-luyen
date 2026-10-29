import { Bell, CalendarRange, ChevronLeft, ChevronRight, Dumbbell, Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { EXERCISES } from "../data/exercises";
import { CATEGORIES } from "../lib/categories";
import { addDays, relativeDayLabel, startOfWeek, weekLabel } from "../lib/dates";
import { initials } from "../lib/format";
import { challengeProgress, currentStreak, statusOf } from "../lib/stats";
import { loadUiMemory, saveUiMemory } from "../lib/storage";
import { useData } from "../state/store";
import { useUi, type Page } from "../state/ui";
import { LogoMark } from "./Logo";
import { Avatar } from "./ui/primitives";

function useClickOutside(ref: React.RefObject<HTMLElement | null>, onOutside: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onOutside();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [ref, onOutside, active]);
}

function SearchBox({ autoFocus = false, onDone }: { autoFocus?: boolean; onDone?: () => void }) {
  const { data } = useData();
  const { navigate, setLibraryQuery, setExerciseDetail, openWorkoutModal } = useUi();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  useClickOutside(boxRef, () => setOpen(false), open);

  const term = q.trim().toLowerCase();
  const results = useMemo(() => {
    if (!term) return { exercises: [], workouts: [] };
    const exercises = EXERCISES.filter((e) =>
      [e.name, CATEGORIES[e.category].label, e.equipment, ...e.muscleGroups].some((s) => s.toLowerCase().includes(term)),
    ).slice(0, 4);
    const workouts = data.workouts
      .filter((w) => statusOf(w) !== "completed" && w.title.toLowerCase().includes(term))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 3);
    return { exercises, workouts };
  }, [term, data.workouts]);

  const finish = () => {
    setOpen(false);
    setQ("");
    onDone?.();
  };

  const submit = () => {
    setLibraryQuery(q.trim());
    navigate("library");
    finish();
  };

  return (
    <div ref={boxRef} className="relative w-full">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label htmlFor="global-search" className="sr-only">
          Search workouts and exercises
        </label>
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          id="global-search"
          autoFocus={autoFocus}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search exercises, workouts…"
          className="input !min-h-11 !rounded-full !pl-10"
          autoComplete="off"
        />
      </form>
      {open && term && (
        <div className="modal-in absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-line bg-panel shadow-pop">
          {results.exercises.length + results.workouts.length === 0 ? (
            <p className="px-4 py-5 text-sm text-muted">No matches for “{q}”.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-2">
              {results.workouts.map((w) => (
                <li key={w.id}>
                  <button
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-surface"
                    onClick={() => {
                      openWorkoutModal({ mode: "edit", workout: w });
                      finish();
                    }}
                  >
                    <CalendarRange className="size-4 text-aqua" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{w.title}</span>
                    <span className="text-xs text-muted">{relativeDayLabel(w.date)}</span>
                  </button>
                </li>
              ))}
              {results.exercises.map((e) => (
                <li key={e.id}>
                  <button
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-surface"
                    onClick={() => {
                      setExerciseDetail(e);
                      finish();
                    }}
                  >
                    <Dumbbell className="size-4 text-violet" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{e.name}</span>
                    <span className="text-xs text-muted">{CATEGORIES[e.category].label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button onClick={submit} className="w-full border-t border-line px-4 py-3 text-left text-sm font-semibold text-lime-ink hover:bg-surface">
            See all results in Exercise Library →
          </button>
        </div>
      )}
    </div>
  );
}

interface Notice {
  id: string;
  title: string;
  body: string;
  page: Page;
  tone: "lime" | "aqua" | "orange" | "violet";
}

function useNotices(): Notice[] {
  const { data, today, challenges } = useData();
  return useMemo(() => {
    const list: Notice[] = [];
    for (const w of data.workouts.filter((w) => w.date === today && w.status !== "completed")) {
      list.push({
        id: `today-${w.id}`,
        title: w.status === "in_progress" ? `${w.title} is in progress` : `${w.title} today`,
        body: w.time ? `Scheduled for ${w.time} · ${w.durationMin} min` : `${w.durationMin} min`,
        page: "workouts",
        tone: w.status === "in_progress" ? "aqua" : "lime",
      });
    }
    for (const w of data.workouts.filter((w) => statusOf(w, today) === "missed" && w.date >= addDays(today, -7))) {
      list.push({ id: `missed-${w.id}`, title: `Missed: ${w.title}`, body: `${relativeDayLabel(w.date)} — reschedule it?`, page: "schedule", tone: "orange" });
    }
    for (const ch of challenges.filter((c) => data.joinedChallenges.includes(c.id))) {
      const p = challengeProgress(ch, data.workouts, today);
      if (p.done) list.push({ id: `challenge-${ch.id}`, title: `Challenge complete: ${ch.title}`, body: "Claim your bragging rights.", page: "challenges", tone: "violet" });
    }
    const streak = currentStreak(data.workouts, today);
    if (streak >= 3) list.push({ id: `streak-${streak}`, title: `${streak}-day streak`, body: "Keep the fire going today.", page: "progress", tone: "orange" });
    return list;
  }, [data, today, challenges]);
}

const TONE_DOT = { lime: "bg-lime", aqua: "bg-aqua", orange: "bg-orange", violet: "bg-violet" };

function Notifications() {
  const notices = useNotices();
  const { navigate } = useUi();
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(() => loadUiMemory().seenNotifications);
  const ref = useRef<HTMLDivElement>(null);
  const unread = notices.filter((n) => !seen.includes(n.id)).length;

  const close = () => {
    setOpen(false);
    const ids = notices.map((n) => n.id);
    setSeen(ids);
    saveUiMemory({ ...loadUiMemory(), seenNotifications: ids });
  };
  useClickOutside(ref, close, open);

  return (
    <div ref={ref} className="relative">
      <button
        className="icon-btn relative"
        onClick={() => (open ? close() : setOpen(true))}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        aria-expanded={open}
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 grid min-w-4.5 place-items-center rounded-full bg-orange px-1 text-[0.62rem] font-bold text-navy">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="modal-in fixed inset-x-3 top-16 z-50 rounded-2xl border border-line bg-panel shadow-pop sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:w-96">
          <p className="border-b border-line px-4 py-3 text-sm font-semibold text-ink">Notifications</p>
          {notices.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted">You're all caught up.</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto py-1">
              {notices.map((n) => (
                <li key={n.id}>
                  <button
                    className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-surface"
                    onClick={() => {
                      navigate(n.page);
                      close();
                    }}
                  >
                    <span className={`mt-1.5 size-2 shrink-0 rounded-full ${TONE_DOT[n.tone]} ${seen.includes(n.id) ? "opacity-30" : ""}`} />
                    <span>
                      <span className="block text-sm font-semibold text-ink">{n.title}</span>
                      <span className="block text-xs text-muted">{n.body}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function WeekPicker() {
  const { weekStart, setWeekStart } = useUi();
  const { today } = useData();
  const current = startOfWeek(today);
  return (
    <div className="flex items-center rounded-full border border-line bg-surface" role="group" aria-label="Selected week">
      <button className="icon-btn !size-10" onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="Previous week">
        <ChevronLeft className="size-4" />
      </button>
      <button
        className="min-w-32 px-1 text-center text-sm font-semibold text-ink disabled:cursor-default"
        onClick={() => setWeekStart(current)}
        disabled={weekStart === current}
        title={weekStart === current ? "Current week" : "Back to this week"}
      >
        {weekStart === current ? "This week" : weekLabel(weekStart)}
      </button>
      <button className="icon-btn !size-10" onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label="Next week">
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}

export function Header() {
  const { data } = useData();
  const { page, navigate, openWorkoutModal } = useUi();
  const showWeek = page === "overview" || page === "schedule";
  const [mobileSearch, setMobileSearch] = useState(false);
  const first = data.profile.name.split(" ")[0] || "athlete";

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <span className="md:hidden">
          <LogoMark className="size-8" />
        </span>
        <div className="min-w-0 flex-1 lg:flex-none">
          <p className="text-xs font-medium text-muted">
            <span className="hidden sm:inline">Welcome back</span>
            <span className="sm:hidden">Let’s get moving,</span>
          </p>
          <p className="display truncate text-base font-bold text-ink sm:text-xl">
            <span className="hidden sm:inline">Let’s get moving, </span>
            {first}!
          </p>
        </div>

        <div className="hidden max-w-md flex-1 lg:block">
          <SearchBox />
        </div>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <button className="icon-btn lg:hidden" onClick={() => setMobileSearch(true)} aria-label="Search">
            <Search className="size-5" />
          </button>
          <div className={showWeek ? "hidden xl:block" : "hidden"}>
            <WeekPicker />
          </div>
          <Notifications />
          <button onClick={() => navigate("settings")} className="rounded-full" aria-label="Profile and settings">
            <Avatar initials={initials(data.profile.name)} size="sm" />
          </button>
          <button className="btn btn-primary ml-1 !px-3 sm:!px-5" onClick={() => openWorkoutModal({ mode: "create" })}>
            <Plus className="size-5" strokeWidth={2.6} />
            <span className="hidden sm:inline">Create Workout</span>
            <span className="sr-only sm:hidden">Create workout</span>
          </button>
        </div>
      </div>
      {showWeek && (
        <div className="flex justify-center border-t border-line px-4 py-2 xl:hidden">
          <WeekPicker />
        </div>
      )}

      {mobileSearch && (
        <div className="fixed inset-0 z-50 bg-bg/95 p-4 backdrop-blur lg:hidden" role="dialog" aria-modal="true" aria-label="Search">
          <div className="flex items-center gap-2">
            <SearchBox autoFocus onDone={() => setMobileSearch(false)} />
            <button className="icon-btn" onClick={() => setMobileSearch(false)} aria-label="Close search">
              <X className="size-5" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
