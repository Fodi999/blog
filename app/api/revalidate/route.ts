import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { locales } from '@/lib/i18n';

type RevalidateKind = 'article' | 'ingredient' | 'shop' | 'about' | 'gallery' | 'all';

type RevalidatePayload = {
  secret?: string;
  type?: RevalidateKind;
  slug?: string | null;
  paths?: string[];
  tags?: string[];
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type',
};

function cleanSlug(slug?: string | null): string | null {
  const value = String(slug || '').trim();
  if (!value || value.includes('/') || value.includes('\\') || value.includes('..')) return null;
  return value;
}

function addLocalizedPaths(paths: Set<string>, segment: string, slug?: string | null) {
  for (const locale of locales) {
    paths.add(`/${locale}`);
    paths.add(`/${locale}/${segment}`);
    if (slug) {
      paths.add(`/${locale}/${segment}/${slug}`);
      const encodedSlug = encodeURIComponent(slug);
      if (encodedSlug !== slug) paths.add(`/${locale}/${segment}/${encodedSlug}`);
    }
  }
}

function defaultPaths(type?: RevalidateKind, slug?: string | null): string[] {
  const paths = new Set<string>(['/', '/sitemap.xml']);
  const safeSlug = cleanSlug(slug);

  if (type === 'all') {
    for (const locale of locales) {
      paths.add(`/${locale}`);
      paths.add(`/${locale}/blog`);
      paths.add(`/${locale}/sklep`);
      paths.add(`/${locale}/skladniki`);
      paths.add(`/${locale}/o-mnie`);
    }
    return [...paths];
  }

  if (type === 'article') addLocalizedPaths(paths, 'blog', safeSlug);
  if (type === 'ingredient') addLocalizedPaths(paths, 'skladniki', safeSlug);
  if (type === 'shop') addLocalizedPaths(paths, 'sklep', safeSlug);
  if (type === 'about' || type === 'gallery') {
    for (const locale of locales) {
      paths.add(`/${locale}`);
      paths.add(`/${locale}/o-mnie`);
    }
  }

  return [...paths];
}

function defaultTags(type?: RevalidateKind, slug?: string | null): string[] {
  const tags = new Set<string>();
  const safeSlug = cleanSlug(slug);

  if (type === 'all' || type === 'article') tags.add('articles');
  if (type === 'article' && safeSlug) tags.add(`article:${safeSlug}`);
  if (type === 'all' || type === 'ingredient') tags.add('ingredients');
  if (type === 'ingredient' && safeSlug) tags.add(`ingredient:${safeSlug}`);
  if (type === 'all' || type === 'shop') tags.add('shop-products');
  if (type === 'shop' && safeSlug) tags.add(`shop-product:${safeSlug}`);
  if (type === 'all' || type === 'about') tags.add('about');
  if (type === 'all' || type === 'gallery') tags.add('gallery');

  return [...tags];
}

function uniqueCleanPaths(paths: string[]): string[] {
  return [...new Set(paths.filter((path) => typeof path === 'string' && path.startsWith('/')))];
}

function uniqueCleanTags(tags: string[]): string[] {
  return [...new Set(tags.filter((tag) => typeof tag === 'string' && tag.trim()).map((tag) => tag.trim()))];
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({})) as RevalidatePayload;
  const requiredSecret = process.env.REVALIDATE_SECRET;

  if (requiredSecret && payload.secret !== requiredSecret) {
    return NextResponse.json({ ok: false, message: 'Invalid revalidation secret' }, { status: 401, headers: corsHeaders });
  }

  const paths = uniqueCleanPaths([...(payload.paths || []), ...defaultPaths(payload.type, payload.slug)]);
  const tags = uniqueCleanTags([...(payload.tags || []), ...defaultTags(payload.type, payload.slug)]);

  for (const tag of tags) revalidateTag(tag, 'max');
  for (const path of paths) revalidatePath(path);

  return NextResponse.json({ ok: true, paths, tags }, { headers: corsHeaders });
}
