import type { Dict } from '@/lib/i18n';
import { INSTAGRAM_URL, TELEGRAM_URL } from '@/lib/seo';

const instagram = (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
  </svg>
);
const telegram = (
  <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
    <path d="M21.4 4.2 2.9 11.3c-1 .4-1 1.6.1 1.9l4.6 1.4 1.8 5.6c.2.7 1.1.9 1.6.4l2.6-2.5 4.9 3.6c.6.4 1.4.1 1.6-.6l3.2-15.4c.2-1-.8-1.8-1.7-1.5zM9.9 14.6l-.4 3.5-1.3-4.2 9.6-6.2-7.9 6.9z" />
  </svg>
);

/** "Or message me directly": Instagram and Telegram, next to every sign-up form. */
export function DirectContacts({ t, className = '' }: { t: Dict['contacts']; className?: string }) {
  const links = [
    { href: INSTAGRAM_URL, icon: instagram, name: t.instagram, handle: '@fodifood' },
    { href: TELEGRAM_URL, icon: telegram, name: t.telegram, handle: '@fodi999' },
  ];
  return (
    <div className={className}>
      <p className="text-[15px] text-on-ink-muted">{t.title}</p>
      <ul className="mt-3 flex flex-wrap gap-3">
        {links.map((l) => (
          <li key={l.href}>
            <a
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 rounded-md border border-hairline-ink-strong px-4 py-2.5 text-[15px] text-on-ink transition-colors hover:border-on-ink/60"
            >
              {l.icon}
              <span>
                {l.name} <span className="text-on-ink-muted">{l.handle}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
