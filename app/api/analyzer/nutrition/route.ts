import { NextRequest, NextResponse } from 'next/server';
import { fetchAnalyzerNutrition } from '@/lib/api';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name   = searchParams.get('name') ?? '';
  const amount = Number(searchParams.get('amount') ?? 100);
  const lang   = searchParams.get('lang') ?? 'en';

  if (!name) return NextResponse.json({ error: 'missing name' }, { status: 400 });

  const data = await fetchAnalyzerNutrition(name, amount, lang);
  if (!data) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(data);
}
