/** PULSE mark: a heartbeat trace that resolves into an upward energy spike. */
export function LogoMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <rect width="40" height="40" rx="12" fill="#C6FF3D" />
      <path d="M6 22h7l3.5-9 6 17 4-11H34" fill="none" stroke="#10131F" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ showTagline = false }: { showTagline?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className="leading-none">
        <span className="display block text-xl font-bold tracking-[0.18em] text-ink">PULSE</span>
        {showTagline && <span className="mt-1 block text-[0.6rem] font-semibold tracking-[0.2em] text-muted">MOVE BETTER. GET STRONGER.</span>}
      </span>
    </span>
  );
}
