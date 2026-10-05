export function LogoMark({ className = 'size-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" fill="none">
      <rect x="1" y="1" width="30" height="30" rx="9" fill="#0d1117" stroke="rgba(233,238,244,.22)" />
      {/* Monge's two projections: the folded line and the M drawn on it */}
      <path d="M6 16h20" stroke="rgba(92,210,255,.55)" strokeWidth="1" strokeDasharray="2 2" />
      <path d="M8 23V9l8 9 8-9v14" stroke="#c4ff4d" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      <span className="font-display text-[17px] font-semibold tracking-[.18em] text-on-ink">MONGE</span>
    </span>
  );
}
