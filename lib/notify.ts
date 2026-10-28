import type { SiteEnv } from '@/lib/cf';

export type Lead = {
  kind: string;
  name: string;
  email: string;
  company: string;
  message: string;
  context: string;
  locale: string;
};

const KIND_LABEL: Record<string, string> = {
  beta: 'Запись в бету',
  early_access: 'Ранний доступ',
  pilot: 'Пилот на производстве',
  custom: 'Модели под заказ',
  other: 'Другое',
};

const esc = (v: string) => v.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** Sends a lead notification through Resend. Never throws: the lead is already in D1. */
export async function notifyLead(env: SiteEnv, lead: Lead, country: string): Promise<void> {
  if (!env.RESEND_API_KEY || !env.LEAD_EMAIL_TO) {
    console.warn('[lead] email not configured (RESEND_API_KEY / LEAD_EMAIL_TO)');
    return;
  }
  const rows: [string, string][] = [
    ['Тип', KIND_LABEL[lead.kind] ?? lead.kind],
    ['Имя', lead.name],
    ['Email', lead.email],
    ['Компания', lead.company || '—'],
    ['Язык', lead.locale || '—'],
    ['Страна', country || '—'],
    ['Страница', lead.context || '—'],
  ];
  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n') + `\n\n${lead.message || '(без сообщения)'}`;
  const html =
    `<h2 style="font-family:sans-serif">Новая заявка Monge</h2><table style="font-family:sans-serif;font-size:14px">` +
    rows.map(([k, v]) => `<tr><td style="color:#666;padding:4px 12px 4px 0">${k}</td><td>${esc(v)}</td></tr>`).join('') +
    `</table><p style="font-family:sans-serif;white-space:pre-wrap;font-size:14px">${esc(lead.message || '(без сообщения)')}</p>`;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.LEAD_EMAIL_FROM || 'Monge <onboarding@resend.dev>',
        to: [env.LEAD_EMAIL_TO],
        reply_to: lead.email,
        subject: `Заявка Monge: ${KIND_LABEL[lead.kind] ?? lead.kind} — ${lead.name}`,
        text,
        html,
      }),
    });
    if (!res.ok) console.error('[lead] resend failed', res.status, (await res.text()).slice(0, 300));
  } catch (error) {
    console.error('[lead] resend error', error);
  }
}
