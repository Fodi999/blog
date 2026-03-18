import { revalidatePath } from 'next/cache';
import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/revalidate
 * On-demand ISR revalidation endpoint (SaaS-grade).
 *
 * Hybrid mode:
 *   • tags  — fast, surgical cache invalidation (preferred)
 *   • paths — legacy fallback for full-page purge
 *
 * Body examples:
 *   { "tags": ["ingredients"] }                        — all catalog pages
 *   { "tags": ["ingredients", "ingredient-salmon"] }   — catalog + one product
 *   { "paths": ["/chef-tools/ingredients"] }           — legacy path mode
 *
 * Header: Authorization: Bearer <REVALIDATE_SECRET>
 */
export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: 'REVALIDATE_SECRET not configured' },
      { status: 500 },
    );
  }

  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();

    // ── Tag-based revalidation (preferred) ──────────────────────
    const tags: string[] = body.tags ?? [];
    if (tags.length > 0) {
      for (const tag of tags) {
        revalidateTag(tag, 'default');
      }
      return NextResponse.json({ revalidated: true, mode: 'tags', tags });
    }

    // ── Path-based revalidation (fallback) ──────────────────────
    const paths: string[] = body.paths ?? [];
    const locales = ['en', 'ru', 'pl', 'uk'];

    if (paths.length === 0) {
      // Default: purge catalog listing for all locales
      for (const locale of locales) {
        revalidatePath(`/${locale}/chef-tools/ingredients`);
      }
      return NextResponse.json({
        revalidated: true,
        mode: 'paths',
        paths: locales.map((l) => `/${l}/chef-tools/ingredients`),
      });
    }

    const revalidated: string[] = [];
    for (const path of paths) {
      for (const locale of locales) {
        const full = `/${locale}${path}`;
        revalidatePath(full);
        revalidated.push(full);
      }
    }

    return NextResponse.json({ revalidated: true, mode: 'paths', paths: revalidated });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
