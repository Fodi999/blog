import { NextRequest, NextResponse } from 'next/server';

const BASE = 'https://ministerial-yetta-fodi999-c58d8823.koyeb.app/public/tools';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const ingredient = searchParams.get('ingredient') ?? '';
  const value      = searchParams.get('value')      ?? '1';
  const from       = searchParams.get('from')        ?? 'cup';
  const to         = searchParams.get('to')          ?? 'g';
  const lang       = searchParams.get('lang')        ?? 'en';

  if (!ingredient) return NextResponse.json({ error: 'Missing ingredient' }, { status: 400 });

  try {
    const url = `${BASE}/ingredient-convert?ingredient=${encodeURIComponent(ingredient)}&value=${value}&from=${from}&to=${to}&lang=${lang}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error ?? 'Upstream error', noDensity: data?.error?.includes('density') },
        { status: res.status }
      );
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
