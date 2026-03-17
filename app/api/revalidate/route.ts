import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/revalidate
 * On-demand ISR revalidation endpoint.
 * Called by the admin backend after publish/unpublish.
 *
 * Body: { "paths": ["/chef-tools/ingredients", "/chef-tools/ingredients/salmon"] }
 * Header: Authorization: Bearer <REVALIDATE_SECRET>
 */
export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'REVALIDATE_SECRET not configured' }, { status: 500 });
  }

  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const paths: string[] = body.paths ?? [];

    if (paths.length === 0) {
      const locales = ['en', 'ru', 'pl', 'uk'];
      for (const locale of locales) {
        revalidatePath(`/${locale}/chef-tools/ingredients`);
      }
      return NextResponse.json({ revalidated: true, paths: locales.map(l => `/${l}/chef-tools/ingredients`) });
    }

    const revalidated: string[] = [];
    const locales = ['en', 'ru', 'pl', 'uk'];

    for (const path of paths) {
      for (const locale of locales) {
        const full = `/${locale}${path}`;
        revalidatePath(full);
        revalidated.push(full);
      }
    }

    return NextResponse.json({ revalidated: true, paths: revalidated });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
