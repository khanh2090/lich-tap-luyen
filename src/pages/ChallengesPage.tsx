import { CalendarClock, CheckCircle2, Trophy, Users } from "lucide-react";
import { useState } from "react";
import { EmptyState, PageHeader, ProgressBar, Segmented } from "../components/ui/primitives";
import { CATEGORIES } from "../lib/categories";
import { daysBetween } from "../lib/dates";
import { formatNumber } from "../lib/format";
import { challengeProgress } from "../lib/stats";
import { ACCENTS } from "../lib/theme";
import { useData } from "../state/store";
import type { Challenge } from "../types";

const UNIT: Record<Challenge["metric"], string> = { workouts: "workouts", minutes: "min", distance: "km", streak: "days" };

function ChallengeCard({ ch }: { ch: Challenge }) {
  const { data, today, toggleChallenge } = useData();
  const joined = data.joinedChallenges.includes(ch.id);
  const p = challengeProgress(ch, data.workouts, today);
  const left = daysBetween(today, ch.endDate);
  const color = ACCENTS[ch.accent];

  return (
    <article className="card lift relative flex flex-col overflow-hidden p-5 sm:p-6">
      <span className="absolute inset-x-0 top-0 h-1" style={{ background: color }} aria-hidden />
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-12 place-items-center rounded-2xl" style={{ background: `${color}22`, color }}>
          {p.done ? <CheckCircle2 className="size-6" /> : <Trophy className="size-6" />}
        </span>
        {joined && <span className="tag !bg-lime/15 !text-lime-ink">Joined</span>}
      </div>
      <h2 className="display mt-4 text-xl font-bold text-ink">{ch.title}</h2>
      <p className="mt-1 text-sm text-muted">{ch.description}</p>
      {ch.category && <p className="mt-2 text-xs text-muted">Counts: {CATEGORIES[ch.category].label}</p>}

      <div className="mt-5">
        <div className="mb-2 flex items-end justify-between">
          <p className="display text-2xl font-bold text-ink">
            {formatNumber(p.value)}
            <span className="text-sm text-muted">
              {" "}
              / {formatNumber(ch.target)} {UNIT[ch.metric]}
            </span>
          </p>
          <p className="text-sm font-semibold" style={{ color }}>
            {p.pct}%
          </p>
        </div>
        <ProgressBar value={p.pct} color={color} label={`${ch.title} progress`} />
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <span className="flex items-center gap-1">
          <CalendarClock className="size-3.5" /> {left > 0 ? `${left} days left` : left === 0 ? "Ends today" : "Ended"}
        </span>
        <span className="flex items-center gap-1">
          <Users className="size-3.5" /> {formatNumber(ch.participants + (joined ? 1 : 0))} athletes
        </span>
      </div>

      <div className="mt-auto pt-5">
        <button className={`btn w-full ${joined ? "btn-secondary" : "btn-primary"}`} onClick={() => toggleChallenge(ch.id)} disabled={left < 0}>
          {joined ? "Leave challenge" : "Join challenge"}
        </button>
      </div>
    </article>
  );
}

export function ChallengesPage() {
  const { data, challenges } = useData();
  const [tab, setTab] = useState<"all" | "joined">("all");
  const list = tab === "joined" ? challenges.filter((c) => data.joinedChallenges.includes(c.id)) : challenges;

  return (
    <div>
      <PageHeader
        eyebrow="Compete with yourself — and everyone else"
        title="Challenges"
        description="Progress is tracked automatically from the workouts you complete inside each challenge window."
        action={
          <Segmented
            label="Challenge filter"
            value={tab}
            onChange={setTab}
            options={[
              { value: "all", label: `All ${challenges.length}` },
              { value: "joined", label: `Joined ${data.joinedChallenges.length}` },
            ]}
          />
        }
      />
      {list.length === 0 ? (
        <EmptyState icon={<Trophy className="size-6" />} title="No challenges joined yet" body="Pick one from All and start climbing." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((ch) => (
            <ChallengeCard key={ch.id} ch={ch} />
          ))}
        </div>
      )}
    </div>
  );
}
