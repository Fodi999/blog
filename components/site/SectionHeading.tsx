import { eyebrowClass } from '@/components/site/classes';

export function SectionHeading({
  eyebrow,
  title,
  lead,
  cta,
  dark = true,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  cta?: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <div className="mb-12 flex animate-reveal flex-wrap items-end justify-between gap-6 md:mb-16">
      <div>
        <p className={eyebrowClass}>{eyebrow}</p>
        <h2 className={`mt-3 font-display text-[clamp(28px,3.6vw,48px)] leading-[1.05] font-medium ${dark ? 'text-on-ink' : 'text-on-bone'}`}>
          {title}
        </h2>
        {lead ? <p className={`mt-4 max-w-[54ch] text-[15.5px] leading-[1.65] ${dark ? 'text-on-ink-muted' : 'text-on-bone-muted'}`}>{lead}</p> : null}
      </div>
      {cta}
    </div>
  );
}
