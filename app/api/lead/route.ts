import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/cf';

const KINDS = new Set(['early_access', 'pilot', 'custom', 'other']);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function clean(value: unknown, max: number): string {
  return String(value ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, max);
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 });
  }

  // Honeypot: a filled hidden field means a bot; answer "ok" and store nothing.
  if (clean(body.website, 200)) return NextResponse.json({ ok: true });

  const lead = {
    kind: KINDS.has(String(body.kind)) ? String(body.kind) : 'other',
    name: clean(body.name, 120),
    email: clean(body.email, 200).toLowerCase(),
    company: clean(body.company, 160),
    message: clean(body.message, 4000),
    context: clean(body.context, 200),
    locale: clean(body.locale, 5),
  };
  if (!lead.name || !EMAIL.test(lead.email)) {
    return NextResponse.json({ ok: false, error: 'invalid' }, { status: 422 });
  }

  const { DB } = await getEnv();
  if (!DB) {
    console.error('[lead] D1 binding "DB" is missing — lead not stored', lead.kind);
    return NextResponse.json({ ok: false, error: 'storage_unavailable' }, { status: 503 });
  }

  const country = request.headers.get('cf-ipcountry') ?? '';
  const agent = clean(request.headers.get('user-agent'), 300);
  await DB.prepare(
    'INSERT INTO leads (created_at, kind, name, email, company, message, context, locale, country, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(new Date().toISOString(), lead.kind, lead.name, lead.email, lead.company, lead.message, lead.context, lead.locale, country, agent)
    .run();

  return NextResponse.json({ ok: true });
}
