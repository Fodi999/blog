import { NextRequest, NextResponse } from 'next/server';

const BASE = 'https://ministerial-yetta-fodi999-c58d8823.koyeb.app';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const lang = req.nextUrl.searchParams.get('lang') || 'en';

  try {
    const res = await fetch(`${BASE}/public/ingredients/${slug}`, {
      next: { revalidate: 86400 },
    });

    if (!res.ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const data = await res.json();

    // Pick the best localized description
    let description: string | null = null;
    if (lang === 'ru' && data.description_ru) description = data.description_ru;
    else if (lang === 'pl' && data.description_pl) description = data.description_pl;
    else if (lang === 'uk' && data.description_uk) description = data.description_uk;
    else description = data.description_en || data.description || null;

    return NextResponse.json({
      description,
      nutrition: data.nutrition ?? null,          // { calories_per_100g, protein_per_100g, fat_per_100g, carbs_per_100g }
      density_g_per_ml: data.density_g_per_ml ?? null,
    });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
