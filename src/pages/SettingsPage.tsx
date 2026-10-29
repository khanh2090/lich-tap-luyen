import { BellRing, Download, Loader2, Moon, RefreshCw, RotateCcw, Smartphone, Sun, Target, Unplug } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "../components/ui/Modal";
import { Avatar, PageHeader, Segmented } from "../components/ui/primitives";
import { CATEGORIES, CATEGORY_ORDER, DIFFICULTIES } from "../lib/categories";
import { timeAgo } from "../lib/dates";
import { initials } from "../lib/format";
import { useData } from "../state/store";
import { useUi } from "../state/ui";
import type { Category, Difficulty, Profile } from "../types";

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="card grid gap-6 p-5 sm:p-7 lg:grid-cols-[280px_minmax(0,1fr)]">
      <div>
        <h2 className="display text-lg font-bold text-ink">{title}</h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      <div>{children}</div>
    </section>
  );
}

function ProfileForm() {
  const { data, updateProfile } = useData();
  const { setGoalModal } = useUi();
  const [form, setForm] = useState<Profile>(data.profile);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Theme and goal can change elsewhere; keep the form in sync.
  useEffect(() => setForm((f) => ({ ...f, theme: data.profile.theme, weeklyGoal: data.profile.weeklyGoal })), [data.profile.theme, data.profile.weeklyGoal]);

  const toggleCategory = (c: Category) =>
    setForm((f) => ({
      ...f,
      favoriteCategories: f.favoriteCategories.includes(c) ? f.favoriteCategories.filter((x) => x !== c) : [...f.favoriteCategories, c],
    }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Your name can't be empty.");
      document.getElementById("p-name")?.focus();
      return;
    }
    setError("");
    setSaving(true);
    await new Promise((r) => setTimeout(r, 150));
    updateProfile({ ...form, name: form.name.trim(), goal: form.goal.trim() });
    setSaving(false);
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div className="flex items-center gap-4">
        <Avatar initials={initials(form.name)} size="lg" />
        <div className="text-sm text-muted">
          Your avatar uses your initials.
          <br />
          Experience: <span className="font-semibold text-ink">{form.experience}</span>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="p-name" className="field-label">
            Name
          </label>
          <input
            id="p-name"
            className="input"
            value={form.name}
            maxLength={40}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            aria-invalid={!!error}
            aria-describedby={error ? "p-name-error" : undefined}
          />
          {error && (
            <p id="p-name-error" className="mt-1.5 text-xs font-medium text-orange">
              {error}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="p-exp" className="field-label">
            Experience level
          </label>
          <select id="p-exp" className="input" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value as Difficulty })}>
            {DIFFICULTIES.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="p-goal" className="field-label">
            Training goal
          </label>
          <input id="p-goal" className="input" value={form.goal} maxLength={100} onChange={(e) => setForm({ ...form, goal: e.target.value })} />
        </div>
        <div>
          <label htmlFor="p-duration" className="field-label">
            Preferred session length
          </label>
          <select id="p-duration" className="input" value={form.preferredDurationMin} onChange={(e) => setForm({ ...form, preferredDurationMin: Number(e.target.value) })}>
            {[15, 20, 30, 35, 45, 60, 75, 90].map((m) => (
              <option key={m} value={m}>
                {m} minutes
              </option>
            ))}
          </select>
        </div>
        <div>
          <span className="field-label">Units</span>
          <Segmented
            label="Units"
            value={form.units}
            onChange={(units) => setForm({ ...form, units })}
            options={[
              { value: "metric", label: "Metric (km)" },
              { value: "imperial", label: "Imperial (mi)" },
            ]}
          />
        </div>
      </div>
      <fieldset>
        <legend className="field-label">Favorite sports</legend>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_ORDER.map((c) => (
            <button type="button" key={c} className="chip" aria-pressed={form.favoriteCategories.includes(c)} onClick={() => toggleCategory(c)}>
              {CATEGORIES[c].label}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
        <button className="btn btn-primary" disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          {saving ? "Saving…" : "Save profile"}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => setGoalModal(true)}>
          <Target className="size-4" /> Weekly goal: {data.profile.weeklyGoal.workouts} workouts · {data.profile.weeklyGoal.minutes} min
        </button>
      </div>
    </form>
  );
}

function AppearanceForm() {
  const { data, updateProfile } = useData();
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {(["dark", "light"] as const).map((t) => {
        const active = data.profile.theme === t;
        const Icon = t === "dark" ? Moon : Sun;
        return (
          <button
            key={t}
            onClick={() => updateProfile({ theme: t }, `${t === "dark" ? "Dark" : "Light"} mode on`)}
            aria-pressed={active}
            className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition-colors ${active ? "border-lime ring-1 ring-lime" : "border-line hover:border-muted"}`}
          >
            <span className={`grid size-12 place-items-center rounded-xl ${t === "dark" ? "bg-navy text-lime" : "bg-[#f6f4ee] text-navy"}`}>
              <Icon className="size-6" />
            </span>
            <span>
              <span className="block font-semibold text-ink">{t === "dark" ? "Dark" : "Light"}</span>
              <span className="text-sm text-muted">{t === "dark" ? "Default · Midnight Navy" : "Warm ivory surfaces"}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function PhoneSync() {
  const { sync } = useData();
  const [owner, setOwner] = useState(sync.settings?.owner ?? "khanh2090");
  const [repo, setRepo] = useState(sync.settings?.repo ?? "lich-tap-luyen");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const connected = !!sync.settings;

  const connect = (e: FormEvent) => {
    e.preventDefault();
    if (!owner.trim() || !repo.trim() || !token.trim()) {
      setError("Owner, repository and token are all required.");
      return;
    }
    setError("");
    sync.configure({ owner: owner.trim(), repo: repo.trim(), token: token.trim() });
    setToken("");
  };

  if (connected)
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-2xl bg-surface p-4">
          <BellRing className="mt-0.5 size-5 text-lime-ink" />
          <div className="text-sm">
            <p className="font-semibold text-ink">
              Publishing to {sync.settings!.owner}/{sync.settings!.repo}
            </p>
            <p className="text-muted">
              {sync.status === "syncing"
                ? "Syncing now…"
                : sync.status === "error"
                  ? `Last attempt failed: ${sync.message}`
                  : sync.settings!.lastSyncedAt
                    ? `Last synced ${timeAgo(sync.settings!.lastSyncedAt)}. Changes sync automatically.`
                    : "Not synced yet."}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-primary" onClick={() => sync.syncNow()} disabled={sync.status === "syncing"}>
            <RefreshCw className={`size-4 ${sync.status === "syncing" ? "animate-spin" : ""}`} /> Sync now
          </button>
          <button className="btn btn-ghost" onClick={() => sync.configure(null)}>
            <Unplug className="size-4" /> Disconnect
          </button>
        </div>
      </div>
    );

  return (
    <form onSubmit={connect} noValidate className="space-y-4">
      <ol className="list-decimal space-y-1 pl-5 text-sm text-muted">
        <li>Install the ntfy app and subscribe to your private topic.</li>
        <li>Create a fine-grained GitHub token with Contents: read &amp; write on your repo.</li>
        <li>Connect below — every morning at 5:30 your phone gets the day's plan.</li>
      </ol>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="s-owner" className="field-label">
            GitHub owner
          </label>
          <input id="s-owner" className="input" value={owner} onChange={(e) => setOwner(e.target.value)} autoComplete="off" />
        </div>
        <div>
          <label htmlFor="s-repo" className="field-label">
            Repository
          </label>
          <input id="s-repo" className="input" value={repo} onChange={(e) => setRepo(e.target.value)} autoComplete="off" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="s-token" className="field-label">
            GitHub token
          </label>
          <input id="s-token" type="password" className="input" value={token} onChange={(e) => setToken(e.target.value)} placeholder="github_pat_…" autoComplete="off" aria-describedby="s-token-hint" />
          <p id="s-token-hint" className="mt-1.5 text-xs text-muted">
            Stored only in this browser.
          </p>
        </div>
      </div>
      {error && <p className="text-sm font-medium text-orange">{error}</p>}
      <button className="btn btn-primary">
        <Smartphone className="size-4" /> Connect & sync
      </button>
    </form>
  );
}

function DataControls() {
  const { data, resetData } = useData();
  const [confirm, setConfirm] = useState(false);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pulse-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Your data is saved in this browser's local storage (not on a server). {data.workouts.length} workouts, {data.posts.length} posts.
      </p>
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-secondary" onClick={exportJson}>
          <Download className="size-4" /> Export JSON
        </button>
        <button className="btn btn-danger" onClick={() => setConfirm(true)}>
          <RotateCcw className="size-4" /> Reset to sample data
        </button>
      </div>
      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Reset all data?"
        description="Every workout, favorite, post and profile change on this device will be replaced with the sample data."
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setConfirm(false)}>
              Cancel
            </button>
            <button
              className="btn btn-danger"
              onClick={async () => {
                setConfirm(false);
                await resetData();
              }}
            >
              Reset data
            </button>
          </>
        }
      >
        <span />
      </Modal>
    </div>
  );
}

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Make it yours" title="Settings" description="Profile, preferences, phone reminders and your data." />
      <Section title="Profile & training" description="Personalise greetings, recommendations and default workout settings.">
        <ProfileForm />
      </Section>
      <Section title="Appearance" description="Dark mode is the signature PULSE look. Light mode is there when the sun is out.">
        <AppearanceForm />
      </Section>
      <Section title="Phone notifications" description="Publish your schedule to GitHub; a daily job sends the plan to your phone via ntfy.">
        <PhoneSync />
      </Section>
      <Section title="Your data" description="Export a backup or start fresh with the sample athlete.">
        <DataControls />
      </Section>
    </div>
  );
}
