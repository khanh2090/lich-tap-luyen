import { useState, type ReactNode } from "react";
import { CATEGORIES, unsplash } from "../../lib/categories";
import type { Category, Difficulty, WorkoutStatus } from "../../types";

/** Image with a shimmer placeholder until it loads; never stretches (object-cover). */
export function SmartImage({ photo, alt, width = 800, className = "" }: { photo: string; alt: string; width?: number; className?: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!loaded && <div className="skeleton absolute inset-0" aria-hidden />}
      <img
        src={unsplash(photo, width)}
        srcSet={`${unsplash(photo, Math.round(width / 2))} ${Math.round(width / 2)}w, ${unsplash(photo, width)} ${width}w`}
        sizes={`(max-width: 640px) 100vw, ${width}px`}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`zoom-img size-full object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}

export function CategoryTag({ category, compact = false }: { category: Category; compact?: boolean }) {
  const meta = CATEGORIES[category];
  return (
    <span className="tag">
      <span className="size-2 rounded-full" style={{ background: meta.color }} aria-hidden />
      {compact ? meta.label.split(" ")[0] : meta.label}
    </span>
  );
}

const DIFFICULTY_BARS: Record<Difficulty, number> = { Beginner: 1, Intermediate: 2, Advanced: 3 };

export function DifficultyMeter({ level }: { level: Difficulty }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted" title={level}>
      <span className="flex items-end gap-0.5" aria-hidden>
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={`w-1 rounded-sm ${i <= DIFFICULTY_BARS[level] ? "bg-lime-ink" : "bg-surface-2"}`}
            style={{ height: 4 + i * 3 }}
          />
        ))}
      </span>
      {level}
    </span>
  );
}

const STATUS_STYLE: Record<WorkoutStatus, { label: string; className: string }> = {
  scheduled: { label: "Upcoming", className: "bg-surface-2 text-ink" },
  in_progress: { label: "In Progress", className: "bg-aqua/15 text-aqua" },
  completed: { label: "Completed", className: "bg-lime/15 text-lime-ink" },
  missed: { label: "Missed", className: "bg-orange/15 text-orange" },
};

const STATUS_SOLID: Record<WorkoutStatus, string> = {
  scheduled: "bg-navy/70 text-snow backdrop-blur",
  in_progress: "bg-aqua text-navy",
  completed: "bg-lime text-navy",
  missed: "bg-orange text-navy",
};

/** `solid` is for pills placed on top of photos, where tinted backgrounds lose contrast. */
export function StatusPill({ status, solid = false }: { status: WorkoutStatus; solid?: boolean }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-bold tracking-wide uppercase ${solid ? STATUS_SOLID[status] : s.className}`}>
      {status === "in_progress" && <span className={`live-dot size-1.5 rounded-full ${solid ? "bg-navy" : "bg-aqua"}`} aria-hidden />}
      {s.label}
    </span>
  );
}

export function ProgressBar({ value, color = "var(--color-lime)", label }: { value: number; color?: string; label: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label={label}>
      <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export function SectionHeader({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h2 className="display text-xl font-bold text-ink sm:text-2xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
      <div className="max-w-2xl">
        <p className="eyebrow mb-2 !text-lime-ink">{eyebrow}</p>
        <h1 className="display text-3xl leading-none font-bold text-ink uppercase sm:text-5xl">{title}</h1>
        {description && <p className="mt-3 text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-surface-2 text-lime-ink">{icon}</div>
      <p className="display text-lg font-bold text-ink">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: NoInfer<T>; label: string }[];
  value: T;
  onChange(v: NoInfer<T>): void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex rounded-full border border-line bg-surface p-1">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={o.value === value}
          onClick={() => onChange(o.value)}
          className={`min-h-9 rounded-full px-3.5 text-xs font-semibold transition-colors sm:text-sm ${
            o.value === value ? "bg-lime text-navy" : "text-muted hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Avatar({ initials, size = "md", tone = "lime" }: { initials: string; size?: "sm" | "md" | "lg"; tone?: "lime" | "violet" | "aqua" | "orange" }) {
  const sizes = { sm: "size-9 text-xs", md: "size-11 text-sm", lg: "size-20 text-2xl" };
  const tones = {
    lime: "from-lime to-aqua",
    violet: "from-violet to-aqua",
    aqua: "from-aqua to-lime",
    orange: "from-orange to-violet",
  };
  return (
    <span className={`display grid shrink-0 place-items-center rounded-full bg-linear-to-br font-bold text-navy ${sizes[size]} ${tones[tone]}`} aria-hidden>
      {initials}
    </span>
  );
}
