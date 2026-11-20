import Link from 'next/link';
import { fmtNum } from '@/lib/status';
import { localPath, type Dict, type Locale } from '@/lib/i18n';
import { families, standards, standardTitle } from '@/lib/standards';

/** The standards tables by family: id, title, rows — each a link to its full table. */
export function StandardsFamilies({ locale, t }: { locale: Locale; t: Dict }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {families.map((f) => {
        const list = standards.filter((s) => s.family === f);
        return (
          <section key={f} aria-labelledby={`family-${f}`} className="rounded-xl border border-hairline-ink-strong bg-ink-2/60 p-5 md:p-6">
            <div className="flex items-baseline justify-between gap-4">
              <h3 id={`family-${f}`} className="font-display text-[21px] font-semibold text-on-ink">
                {t.library.families[f]}
              </h3>
              <span className="font-mono text-[12px] text-on-ink-muted">{list.length}</span>
            </div>
            <ul className="mt-4 border-t border-hairline-ink">
              {list.map((s) => (
                <li key={s.id} className="border-b border-hairline-ink">
                  <Link
                    href={localPath(locale, `/library/standards/${s.slug}`)}
                    className="group grid grid-cols-[minmax(116px,auto)_1fr_auto] items-baseline gap-x-4 py-3 transition-colors hover:bg-white/[.03]"
                  >
                    <span className="font-mono text-[13px] whitespace-nowrap text-steel">{s.id}</span>
                    <span className="text-[14.5px] leading-snug text-on-ink group-hover:text-on-ink">{standardTitle(s, locale)}</span>
                    <span className="font-mono text-[12px] whitespace-nowrap text-on-ink-muted tabular-nums">
                      {fmtNum(locale, s.rows.length)} {t.standards.rows}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
