'use client';

import Link from 'next/link';
import { useState } from 'react';
import { trackEvent } from '@/components/AnalyticsEvents';
import { siteButtonVariants } from '@/components/site/Button';
import { localPath, type Dict, type Locale } from '@/lib/i18n';

type Kind = keyof Dict['form']['kinds'];
const kinds: Kind[] = ['beta', 'pilot', 'custom', 'other'];

const field =
  'w-full rounded-md border border-hairline-ink-strong bg-ink px-4 py-3 text-[16px] text-on-ink placeholder:text-on-ink-muted/60 transition-colors focus:border-steel focus:outline-none';
const label = 'mb-2 block text-[13.5px] text-on-ink-muted';

/**
 * The request form (POST /api/lead → D1 + e-mail).
 * `beta`: the short sign-up for the closed beta — name and email only.
 */
export function LeadForm({
  locale,
  t,
  initialKind = 'beta',
  context = '',
  beta = false,
}: {
  locale: Locale;
  t: Dict['form'];
  initialKind?: string;
  context?: string;
  beta?: boolean;
}) {
  const [kind, setKind] = useState<Kind>(beta ? 'beta' : (kinds as string[]).includes(initialKind) ? (initialKind as Kind) : 'beta');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const id = beta ? 'beta' : 'lead';

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
      <p role="status" className="border-l-2 border-signal py-2 pl-5 text-[17px] leading-relaxed text-on-ink">
        {beta ? t.betaSuccess : t.success}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      {beta ? null : (
        <fieldset>
          <legend className={label}>{t.kind}</legend>
          <div className="flex flex-wrap gap-2">
            {kinds.map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={kind === k}
                onClick={() => setKind(k)}
                className={`rounded-md border px-3.5 py-2 text-[14px] font-medium transition-colors ${
                  kind === k ? 'border-on-ink bg-on-ink text-ink' : 'border-hairline-ink-strong text-on-ink-muted hover:text-on-ink'
                }`}
              >
                {t.kinds[k]}
              </button>
            ))}
          </div>
        </fieldset>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-name`} className={label}>
            {t.name}
          </label>
          <input id={`${id}-name`} name="name" required maxLength={120} autoComplete="name" className={field} />
        </div>
        <div>
          <label htmlFor={`${id}-email`} className={label}>
            {t.email}
          </label>
          <input id={`${id}-email`} name="email" type="email" required maxLength={200} autoComplete="email" className={field} />
        </div>
      </div>
      {beta ? null : (
        <>
          <div>
            <label htmlFor={`${id}-company`} className={label}>
              {t.company}
            </label>
            <input id={`${id}-company`} name="company" maxLength={160} autoComplete="organization" className={field} />
          </div>
          <div>
            <label htmlFor={`${id}-message`} className={label}>
              {t.message}
            </label>
            <textarea id={`${id}-message`} name="message" rows={4} maxLength={4000} placeholder={t.messagePlaceholder} className={`${field} resize-y`} />
          </div>
        </>
      )}
      <input type="hidden" name="context" value={context} />
      {/* Honeypot: hidden from people, filled by bots. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] leading-relaxed text-on-ink-muted">
          {t.consent}{' '}
          <Link href={localPath(locale, '/privacy')} className="text-on-ink underline underline-offset-2 hover:text-steel">
            {t.privacy}
          </Link>
          .
        </p>
        <button type="submit" disabled={status === 'sending'} className={siteButtonVariants({ variant: 'primary', size: 'lg' })}>
          {status === 'sending' ? t.sending : beta ? t.betaSubmit : t.submit}
        </button>
      </div>
      {status === 'error' ? (
        <p role="alert" className="text-[14.5px] text-destructive">
          {t.error}
        </p>
      ) : null}
    </form>
  );
}
