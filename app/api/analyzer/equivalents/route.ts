import { NextRequest, NextResponse } from 'next/server';
import { fetchEquivalents } from '@/lib/api';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name  = searchParams.get('name') ?? '';
  const value = Number(searchParams.get('value') ?? 1);
  const unit  = searchParams.get('unit') ?? 'cup';
  const lang  = searchParams.get('lang') ?? 'en';

  if (!name) return NextResponse.json({ error: 'missing name' }, { status: 400 });

  const data = await fetchEquivalents(name, value, unit, lang);
  if (!data) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(data);
}
