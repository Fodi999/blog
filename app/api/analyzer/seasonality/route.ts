import { NextRequest, NextResponse } from 'next/server';
import { fetchProductSeasonality } from '@/lib/api';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug   = searchParams.get('slug') ?? '';
  const lang   = searchParams.get('lang') ?? 'en';
  const region = searchParams.get('region') ?? 'PL';

  if (!slug) return NextResponse.json({ error: 'missing slug' }, { status: 400 });

  const data = await fetchProductSeasonality(slug, lang, region);
  if (!data) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(data);
}
