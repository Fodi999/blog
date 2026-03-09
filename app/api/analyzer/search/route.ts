import { NextRequest, NextResponse } from 'next/server';
import { fetchIngredientSearch } from '@/lib/api';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') ?? '';
  const lang   = searchParams.get('lang') ?? 'en';

  const data = await fetchIngredientSearch(search, lang);
  if (!data) return NextResponse.json({ total: 0, items: [] });
  return NextResponse.json(data);
}
