import { Heart, Loader2, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { volumeLabel } from "../components/WorkoutCard";
import { Avatar, CategoryTag, PageHeader } from "../components/ui/primitives";
import { addDays, startOfWeek, timeAgo } from "../lib/dates";
import { initials } from "../lib/format";
import { completedIn, totals } from "../lib/stats";
import { useData } from "../state/store";

// Sample club members for the weekly leaderboard; your own minutes are real.
const CLUB = [
  { name: "Maya Chen", minutes: 312 },
  { name: "Jordan Reyes", minutes: 268 },
  { name: "Kenji Watanabe", minutes: 241 },
  { name: "Sofia Lindqvist", minutes: 187 },
  { name: "Amara Okafor", minutes: 154 },
];
const TONES = ["violet", "aqua", "orange", "lime"] as const;

function Composer() {
  const { data, today, addPost } = useData();
  const [text, setText] = useState("");
  const [attach, setAttach] = useState("");
  const [error, setError] = useState("");
  const [posting, setPosting] = useState(false);
  const recent = data.workouts
    .filter((w) => w.status === "completed" && w.date >= addDays(today, -7))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (text.trim().length < 3) {
      setError("Write at least a few words.");
      return;
    }
    setError("");
    setPosting(true);
    await new Promise((r) => setTimeout(r, 150));
    const w = recent.find((x) => x.id === attach);
    addPost({
      text: text.trim(),
      workoutTitle: w?.title,
      category: w?.category,
      stat: w ? [`${w.durationMin} min`, volumeLabel(w, data.profile.units), `${w.calories} kcal`].filter(Boolean).join(" · ") : undefined,
    });
    setText("");
    setAttach("");
    setPosting(false);
  };

  return (
    <form onSubmit={submit} className="card p-4 sm:p-5" noValidate>
      <div className="flex gap-3">
        <Avatar initials={initials(data.profile.name)} />
        <div className="flex-1">
          <label htmlFor="post-text" className="sr-only">
            Share an update
          </label>
          <textarea
            id="post-text"
            className="input min-h-24 resize-y"
            placeholder="How did training go today?"
            maxLength={280}
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-invalid={!!error}
            aria-describedby={error ? "post-error" : undefined}
          />
          {error && (
            <p id="post-error" className="mt-1.5 text-xs font-medium text-orange">
              {error}
            </p>
          )}
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <label htmlFor="post-attach" className="sr-only">
              Attach a workout
            </label>
            <select id="post-attach" className="input sm:!w-auto sm:flex-1" value={attach} onChange={(e) => setAttach(e.target.value)}>
              <option value="">No workout attached</option>
              {recent.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.title} · {new Date(w.date + "T00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </option>
              ))}
            </select>
            <span className="text-xs text-muted sm:ml-auto">{text.length}/280</span>
            <button className="btn btn-primary" disabled={posting}>
              {posting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              {posting ? "Posting…" : "Post"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

export function CommunityPage() {
  const { data, today, toggleKudos } = useData();
  const myMinutes = totals(completedIn(data.workouts, startOfWeek(today), today)).minutes;
  const board = [...CLUB, { name: `${data.profile.name} (you)`, initials: initials(data.profile.name), minutes: myMinutes, me: true }].sort((a, b) => b.minutes - a.minutes);

  return (
    <div>
      <PageHeader eyebrow="PULSE Run & Lift Club" title="Community" description="Share wins, hand out kudos and keep each other honest. Feed posts are stored on this device." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <Composer />
          <ul className="space-y-4">
            {data.posts.map((p, i) => (
              <li key={p.id} className="card p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <Avatar initials={p.initials} tone={TONES[i % TONES.length]} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">{p.author}</p>
                    <p className="text-xs text-muted">{timeAgo(p.createdAt)}</p>
                  </div>
                  {p.category && <CategoryTag category={p.category} compact />}
                </div>
                <p className="mt-3 text-ink">{p.text}</p>
                {(p.workoutTitle || p.stat) && (
                  <div className="mt-3 rounded-2xl bg-surface px-4 py-3">
                    {p.workoutTitle && <p className="text-sm font-semibold text-ink">{p.workoutTitle}</p>}
                    {p.stat && <p className="display text-lg font-bold text-lime-ink">{p.stat}</p>}
                  </div>
                )}
                <div className="mt-3 flex items-center">
                  <button
                    onClick={() => toggleKudos(p.id)}
                    aria-pressed={p.kudoed}
                    className={`btn btn-sm ${p.kudoed ? "bg-lime/15 text-lime-ink" : "btn-ghost"}`}
                  >
                    <Heart className={`size-4 ${p.kudoed ? "fill-current" : ""}`} /> {p.kudos} kudos
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <aside className="card h-fit p-5 lg:sticky lg:top-24" aria-labelledby="board-title">
          <p className="eyebrow mb-1">This week · active minutes</p>
          <h2 id="board-title" className="display text-xl font-bold text-ink">
            Club leaderboard
          </h2>
          <ol className="mt-4 space-y-2">
            {board.map((m, i) => (
              <li key={m.name} className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 ${"me" in m ? "bg-lime/10 ring-1 ring-lime/40" : ""}`}>
                <span className={`display w-5 text-center font-bold ${i < 3 ? "text-lime-ink" : "text-muted"}`}>{i + 1}</span>
                <Avatar initials={"initials" in m ? m.initials : initials(m.name)} size="sm" tone={"me" in m ? "lime" : TONES[i % TONES.length]} />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{m.name}</span>
                <span className="text-sm font-bold text-ink">{m.minutes}</span>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  );
}
