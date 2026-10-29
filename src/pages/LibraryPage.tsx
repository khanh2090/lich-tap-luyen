import { Heart, Search, SearchX, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ExerciseCard } from "../components/ExerciseCard";
import { EmptyState, PageHeader } from "../components/ui/primitives";
import { EXERCISES } from "../data/exercises";
import { CATEGORIES, CATEGORY_ORDER, DIFFICULTIES } from "../lib/categories";
import { useData } from "../state/store";
import { useUi } from "../state/ui";
import type { Category, Difficulty } from "../types";

const PAGE_SIZE = 9;
const DURATIONS = {
  any: { label: "Any duration", test: () => true },
  short: { label: "≤ 15 min", test: (m: number) => m <= 15 },
  medium: { label: "16–30 min", test: (m: number) => m > 15 && m <= 30 },
  long: { label: "31–45 min", test: (m: number) => m > 30 && m <= 45 },
  xl: { label: "45+ min", test: (m: number) => m > 45 },
} as const;
type DurationKey = keyof typeof DURATIONS;
type Sort = "popular" | "shortest" | "longest" | "az";

const MUSCLES = [...new Set(EXERCISES.flatMap((e) => e.muscleGroups))].sort();
const EQUIPMENT = [...new Set(EXERCISES.map((e) => e.equipment))].sort();

export function LibraryPage() {
  const { data } = useData();
  const { libraryQuery, setLibraryQuery } = useUi();
  const [query, setQuery] = useState(libraryQuery);
  const [category, setCategory] = useState<Category | "all" | "saved">("all");
  const [muscle, setMuscle] = useState("any");
  const [equipment, setEquipment] = useState("any");
  const [difficulty, setDifficulty] = useState<Difficulty | "any">("any");
  const [duration, setDuration] = useState<DurationKey>("any");
  const [sort, setSort] = useState<Sort>("popular");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [showFilters, setShowFilters] = useState(false);

  // Pick up a search handed over from the header, then clear the hand-off.
  useEffect(() => {
    if (libraryQuery) {
      setQuery(libraryQuery);
      setLibraryQuery("");
    }
  }, [libraryQuery, setLibraryQuery]);

  useEffect(() => setVisible(PAGE_SIZE), [query, category, muscle, equipment, difficulty, duration, sort]);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    const list = EXERCISES.filter(
      (e) =>
        (category === "all" || (category === "saved" ? data.favorites.includes(e.id) : e.category === category)) &&
        (muscle === "any" || e.muscleGroups.includes(muscle)) &&
        (equipment === "any" || e.equipment === equipment) &&
        (difficulty === "any" || e.difficulty === difficulty) &&
        DURATIONS[duration].test(e.durationMin) &&
        (!term || [e.name, e.description, e.equipment, CATEGORIES[e.category].label, ...e.muscleGroups].some((s) => s.toLowerCase().includes(term))),
    );
    const sorters: Record<Sort, (a: (typeof list)[number], b: (typeof list)[number]) => number> = {
      popular: (a, b) => b.popularity - a.popularity,
      shortest: (a, b) => a.durationMin - b.durationMin,
      longest: (a, b) => b.durationMin - a.durationMin,
      az: (a, b) => a.name.localeCompare(b.name),
    };
    return list.sort(sorters[sort]);
  }, [query, category, muscle, equipment, difficulty, duration, sort, data.favorites]);

  const activeFilters = [muscle !== "any", equipment !== "any", difficulty !== "any", duration !== "any"].filter(Boolean).length;
  const clearAll = () => {
    setQuery("");
    setCategory("all");
    setMuscle("any");
    setEquipment("any");
    setDifficulty("any");
    setDuration("any");
  };

  const selects = (
    <>
      <div>
        <label htmlFor="f-muscle" className="field-label">
          Muscle group
        </label>
        <select id="f-muscle" className="input" value={muscle} onChange={(e) => setMuscle(e.target.value)}>
          <option value="any">Any muscle</option>
          {MUSCLES.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="f-equipment" className="field-label">
          Equipment
        </label>
        <select id="f-equipment" className="input" value={equipment} onChange={(e) => setEquipment(e.target.value)}>
          <option value="any">Any equipment</option>
          {EQUIPMENT.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="f-difficulty" className="field-label">
          Difficulty
        </label>
        <select id="f-difficulty" className="input" value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty | "any")}>
          <option value="any">Any level</option>
          {DIFFICULTIES.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="f-duration" className="field-label">
          Duration
        </label>
        <select id="f-duration" className="input" value={duration} onChange={(e) => setDuration(e.target.value as DurationKey)}>
          {Object.entries(DURATIONS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
      </div>
    </>
  );

  return (
    <div>
      <PageHeader
        eyebrow={`${EXERCISES.length} coached sessions`}
        title="Exercise Library"
        description="Find your next favorite session. Filter by what you've got, what you want to train and how long you have."
      />

      <div className="scrollbar-none -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Category">
        <button className="chip shrink-0" aria-pressed={category === "all"} onClick={() => setCategory("all")}>
          All
        </button>
        {CATEGORY_ORDER.map((c) => {
          const Icon = CATEGORIES[c].icon;
          return (
            <button key={c} className="chip shrink-0" aria-pressed={category === c} onClick={() => setCategory(c)}>
              <Icon className="size-4" style={{ color: category === c ? undefined : CATEGORIES[c].color }} />
              {CATEGORIES[c].label}
            </button>
          );
        })}
        <button className="chip shrink-0" aria-pressed={category === "saved"} onClick={() => setCategory("saved")}>
          <Heart className="size-4" /> Saved ({data.favorites.length})
        </button>
      </div>

      <div className="card mb-6 p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <label htmlFor="library-search" className="sr-only">
              Search exercises
            </label>
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
            <input id="library-search" className="input !pl-10" placeholder="Search by name, muscle or equipment" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button className="btn btn-secondary lg:hidden" onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters}>
              <SlidersHorizontal className="size-4" /> Filters{activeFilters ? ` (${activeFilters})` : ""}
            </button>
            <label htmlFor="library-sort" className="sr-only">
              Sort
            </label>
            <select id="library-sort" className="input !w-auto flex-1" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
              <option value="popular">Most popular</option>
              <option value="shortest">Shortest first</option>
              <option value="longest">Longest first</option>
              <option value="az">A – Z</option>
            </select>
          </div>
        </div>
        <div className={`mt-4 grid-cols-2 gap-3 lg:grid lg:grid-cols-4 ${showFilters ? "grid" : "hidden"}`}>{selects}</div>
      </div>

      <div className="mb-4 flex items-center justify-between text-sm text-muted">
        <p aria-live="polite">
          <span className="font-semibold text-ink">{results.length}</span> {results.length === 1 ? "exercise" : "exercises"}
        </p>
        {(activeFilters > 0 || query || category !== "all") && (
          <button className="btn btn-ghost btn-sm" onClick={clearAll}>
            <X className="size-4" /> Clear all
          </button>
        )}
      </div>

      {results.length === 0 ? (
        <EmptyState
          icon={<SearchX className="size-6" />}
          title="No exercises match"
          body={category === "saved" ? "Tap the heart on any exercise to save it here." : "Loosen a filter or try a broader search term."}
          action={
            <button className="btn btn-secondary" onClick={clearAll}>
              Reset filters
            </button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {results.slice(0, visible).map((e) => (
              <ExerciseCard key={e.id} exercise={e} />
            ))}
          </div>
          {visible < results.length && (
            <div className="mt-8 flex justify-center">
              <button className="btn btn-secondary" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                Load more ({results.length - visible} left)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
