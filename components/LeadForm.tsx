'use client';

import Link from 'next/link';
import { useState } from 'react';
import { trackEvent } from '@/components/AnalyticsEvents';
import { siteButtonVariants } from '@/components/site/Button';
import { localPath, type Dict, type Locale } from '@/lib/i18n';

type Kind = keyof Dict['form']['kinds'];
const kinds: Kind[] = ['early_access', 'pilot', 'custom', 'other'];

const field =
  'w-full rounded-2xl border border-hairline-ink-strong bg-ink/60 px-4 py-3.5 text-[15px] text-on-ink placeholder:text-on-ink-muted/60 transition-colors focus:border-signal focus:outline-none';
const label = 'mb-2 block font-mono text-[11px] tracking-[.12em] text-on-ink-muted uppercase';

export function LeadForm({ locale, t, initialKind = 'early_access', context = '' }: { locale: Locale; t: Dict['form']; initialKind?: string; context?: string }) {
  const [kind, setKind] = useState<Kind>((kinds as string[]).includes(initialKind) ? (initialKind as Kind) : 'early_access');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setStatus('sending');
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...data, kind, locale }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus('done');
      trackEvent('generate_lead', { kind, locale });
      form.reset();
    } catch {
      setStatus('error');
    }
  }

  if (status === 'done') {
    return (
      <div role="status" className="rounded-3xl border border-signal/40 bg-signal/[.06] p-8 text-[17px] leading-relaxed text-on-ink">
        <span className="mb-3 grid size-10 place-items-center rounded-full bg-signal text-ink" aria-hidden="true">
          ✓
        </span>
        {t.success}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5" noValidate={false}>
      <fieldset>
        <legend className={label}>{t.kind}</legend>
        <div className="flex flex-wrap gap-2">
          {kinds.map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={kind === k}
              onClick={() => setKind(k)}
              className={`rounded-full border px-4 py-2 text-[13px] font-medium transition-colors ${
                kind === k ? 'border-signal bg-signal text-ink' : 'border-hairline-ink-strong text-on-ink-muted hover:text-on-ink'
              }`}
            >
              {t.kinds[k]}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="lead-name" className={label}>
            {t.name}
          </label>
          <input id="lead-name" name="name" required maxLength={120} autoComplete="name" className={field} />
        </div>
        <div>
          <label htmlFor="lead-email" className={label}>
            {t.email}
          </label>
          <input id="lead-email" name="email" type="email" required maxLength={200} autoComplete="email" className={field} />
        </div>
      </div>
      <div>
        <label htmlFor="lead-company" className={label}>
          {t.company}
        </label>
        <input id="lead-company" name="company" maxLength={160} autoComplete="organization" className={field} />
      </div>
      <div>
        <label htmlFor="lead-message" className={label}>
          {t.message}
        </label>
        <textarea id="lead-message" name="message" rows={4} maxLength={4000} placeholder={t.messagePlaceholder} className={`${field} resize-y`} />
      </div>
      <input type="hidden" name="context" value={context} />
      {/* Honeypot: hidden from people, filled by bots. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[12px] leading-relaxed text-on-ink-muted">
          {t.consent}{' '}
          <Link href={localPath(locale, '/privacy')} className="text-on-ink underline underline-offset-2 hover:text-signal">
            {t.privacy}
          </Link>
          .
        </p>
        <button type="submit" disabled={status === 'sending'} className={siteButtonVariants({ variant: 'primary', size: 'lg' })}>
          {status === 'sending' ? t.sending : t.submit}
        </button>
      </div>
      {status === 'error' ? (
        <p role="alert" className="text-[14px] text-destructive">
          {t.error}
        </p>
      ) : null}
    </form>
  );
}
