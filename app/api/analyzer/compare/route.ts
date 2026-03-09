import { NextRequest, NextResponse } from 'next/server';
import { fetchCompare } from '@/lib/api';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const food1 = searchParams.get('food1') ?? '';
  const food2 = searchParams.get('food2') ?? '';
  const lang  = searchParams.get('lang') ?? 'en';

  if (!food1 || !food2) return NextResponse.json({ error: 'missing food1 or food2' }, { status: 400 });

  const data = await fetchCompare(food1, food2, lang);
  if (!data) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(data);
}
