/** The mark of demonstration data: on the page and on every table and criterion made from it. */
export function DemoBadge({ label, className = '' }: { label: string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border border-dashed border-[#ffb648]/60 px-2 py-0.5 text-[11.5px] leading-snug font-medium text-[#ffc56e] ${className}`}>
      <svg viewBox="0 0 16 16" className="size-3 shrink-0" fill="none" aria-hidden="true">
        <path d="M8 2.2l6.2 11.3H1.8L8 2.2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M8 6.6v3.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="8" cy="11.7" r=".8" fill="currentColor" />
      </svg>
      {label}
    </span>
  );
}
