import { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/posts';
import { fetchIngredients, fetchIngredientsStatesMap } from '@/lib/api';
import { locales } from '@/i18n';
import { CATEGORY_MAP } from './[locale]/chef-tools/ingredients/[slug]/category-page';
import { CONVERSION_MAP } from './[locale]/chef-tools/converter/[conversion]/page';
import { RECIPE_TEMPLATES } from '@/lib/recipe-templates';

const BASE_URL = 'https://dima-fomin.pl';
const API_URL = 'https://ministerial-yetta-fodi999-c58d8823.koyeb.app';
const canonicalLocale = 'pl';

/**
 * Revalidate sitemap every 5 minutes so Google sees new/updated ingredients
 * without requiring a redeploy. On-demand revalidation via /api/revalidate
 * provides instant updates when products are published/unpublished.
 */
export const revalidate = 300;

/**
 * Static content date — used ONLY for truly static pages (legal, about, etc.)
 * Dynamic content (ingredients, recipes) uses their own updated_at from DB.
 * Using a fixed date prevents Google from seeing "all 7000 pages updated simultaneously".
 */
const STATIC_DATE = new Date('2026-03-01');

/** Normalize any date string to a valid Date. Falls back to yesterday (not a fixed date). */
function toDate(raw?: string): Date {
  const d = raw ? new Date(raw) : null;
  // Yesterday as fallback — avoids a suspicious fixed date for all undated posts
  return d && !isNaN(d.getTime()) ? d : new Date(Date.now() - 86_400_000);
}

/**
 * Google requires each locale URL to be a separate <url> entry in sitemap.
 * Each entry includes hreflang alternates pointing to ALL locale versions.
 * This multiplies sitemap size by number of locales (×4) but is the correct
 * approach per Google's international SEO documentation.
 */
function multiLocaleEntry(
  path: string,
  opts: {
    lastModified: Date;
    changeFrequency: MetadataRoute.Sitemap[0]['changeFrequency'];
    priority: number;
    images?: string[];
  },
): MetadataRoute.Sitemap {
  const alternates = {
    languages: {
      ...Object.fromEntries(locales.map((l) => [l, `${BASE_URL}/${l}${path}`])),
      'x-default': `${BASE_URL}/${canonicalLocale}${path}`,
    },
  };

  return locales.map((locale) => ({
    url: `${BASE_URL}/${locale}${path}`,
    lastModified: opts.lastModified,
    changeFrequency: opts.changeFrequency,
    priority: opts.priority,
    ...(opts.images && opts.images.length > 0 ? { images: opts.images } : {}),
    alternates,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {

  // ─── Gallery images from API (for sitemap image entries) ─────────────
  let galleryItems: Array<{ image_url: string; title_en?: string; alt_en?: string }> = [];
  try {
    const res = await fetch(`${API_URL}/public/gallery`, { next: { revalidate: 300 } });
    if (res.ok) galleryItems = await res.json();
  } catch { /* non-blocking */ }

  const galleryImages = galleryItems.map(item => ({
    url: item.image_url,
    title: item.title_en || item.alt_en || '',
  }));

  // ─── Static pages ────────────────────────────────────────────────────
  const staticPages: {
    path: string;
    priority: number;
    changeFrequency: MetadataRoute.Sitemap[0]['changeFrequency'];
  }[] = [
      { path: '', priority: 1.0, changeFrequency: 'weekly' },
      { path: '/blog', priority: 0.9, changeFrequency: 'daily' },
      { path: '/about', priority: 0.7, changeFrequency: 'monthly' },
      { path: '/contact', priority: 0.6, changeFrequency: 'monthly' },
      { path: '/restaurants', priority: 0.7, changeFrequency: 'weekly' },
      { path: '/demos/sushi-delivery', priority: 0.6, changeFrequency: 'monthly' },
      { path: '/demos/restaurant-ai', priority: 0.6, changeFrequency: 'monthly' },
      { path: '/chef-tools', priority: 0.8, changeFrequency: 'monthly' },
      { path: '/chef-tools/ingredients', priority: 0.9, changeFrequency: 'daily' },
      { path: '/chef-tools/ingredient-analyzer', priority: 0.8, changeFrequency: 'weekly' },
      { path: '/chef-tools/fish-season', priority: 0.8, changeFrequency: 'weekly' },
      { path: '/chef-tools/converter', priority: 0.75, changeFrequency: 'monthly' },
      { path: '/chef-tools/lab', priority: 0.85, changeFrequency: 'weekly' },
      { path: '/chef-tools/recipe-analyzer', priority: 0.8, changeFrequency: 'weekly' },
      { path: '/chef-tools/flavor-pairing', priority: 0.8, changeFrequency: 'weekly' },
      { path: '/chef-tools/nutrition', priority: 0.85, changeFrequency: 'daily' },
      { path: '/chef-tools/diet', priority: 0.85, changeFrequency: 'weekly' },
      { path: '/chef-tools/ranking', priority: 0.85, changeFrequency: 'weekly' },
      // Fish season — 12 monthly pages (slug = month name, matches [month] route)
      ...['january','february','march','april','may','june','july','august','september','october','november','december'].map((month) => ({
        path: `/chef-tools/fish-season/${month}`,
        priority: 0.7 as number,
        changeFrequency: 'monthly' as const,
      })),
      // Legal / GDPR pages
      { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
      { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
      { path: '/cookies', priority: 0.3, changeFrequency: 'yearly' },
      // SEO taxonomy: ingredient category hub pages
      ...Object.keys(CATEGORY_MAP).map((cat) => ({
        path: `/chef-tools/ingredients/${cat}`,
        priority: 0.85,
        changeFrequency: 'weekly' as const,
      })),
      // SEO converter pages: cup-to-grams, tablespoon-to-grams, etc.
      ...Object.keys(CONVERSION_MAP).map((conv) => ({
        path: `/chef-tools/converter/${conv}`,
        priority: 0.85,
        changeFrequency: 'monthly' as const,
      })),
    ];

  // Static pages exist in ALL locales — generate one <url> per locale per page.
  const staticUrls: MetadataRoute.Sitemap = staticPages.flatMap(
    ({ path, priority, changeFrequency }) =>
      multiLocaleEntry(path, {
        lastModified: STATIC_DATE,
        changeFrequency,
        priority,
        images:
          path === '/about' && galleryImages.length > 0
            ? galleryImages.map((img) => img.url)
            : undefined,
      })
  );

  // ─── Blog posts ──────────────────────────────────────────────────────
  // Single pass: collect slugs per locale and their dates.
  // slug → { date, availableLocales }
  const slugMap = new Map<string, { date: Date; availableLocales: Set<string> }>();

  for (const locale of locales) {
    const posts = await getAllPosts(locale);

    for (const post of posts) {
      const existing = slugMap.get(post.slug);
      const postDate = toDate(post.publishedAt || post.date);

      if (!existing) {
        slugMap.set(post.slug, {
          date: postDate,
          availableLocales: new Set([locale]),
        });
      } else {
        // Keep canonical locale's date when available
        if (locale === canonicalLocale) {
          existing.date = postDate;
        }
        existing.availableLocales.add(locale);
      }
    }
  }

  const postUrls: MetadataRoute.Sitemap = Array.from(slugMap.entries())
    .filter(([, { availableLocales }]) => {
      // ✅ Only emit a URL if the canonical locale (pl) has the file.
      return availableLocales.has(canonicalLocale);
    })
    .flatMap(([slug, { date, availableLocales }]) => {
      const alternates = {
        languages: {
          ...Object.fromEntries(
            [...availableLocales].map((l) => [l, `${BASE_URL}/${l}/blog/${slug}`])
          ),
          'x-default': `${BASE_URL}/${canonicalLocale}/blog/${slug}`,
        },
      };
      // Generate one <url> per locale that has the post file
      return [...availableLocales].map((locale) => ({
        url: `${BASE_URL}/${locale}/blog/${slug}`,
        lastModified: date,
        changeFrequency: 'monthly' as const,
        priority: 0.9,
        alternates,
      }));
    });

  // ─── Ingredient pages ────────────────────────────────────────────────
  const ingredientList = await fetchIngredients();

  // /chef-tools/nutrition/{slug} — nutrition detail pages
  const ingredientUrls: MetadataRoute.Sitemap = ingredientList
    ? ingredientList
        .filter((ing) => ing.slug)
        .flatMap((ing) =>
          multiLocaleEntry(`/chef-tools/nutrition/${ing.slug}`, {
            lastModified: toDate(ing.updated_at ?? undefined),
            changeFrequency: 'monthly',
            priority: 0.8,
            images: ing.image_url ? [ing.image_url] : undefined,
          })
        )
    : [];

  // /chef-tools/ingredients/{slug} — ingredient profile pages
  const ingredientProfileUrls: MetadataRoute.Sitemap = ingredientList
    ? ingredientList
        .filter((ing) => ing.slug)
        .flatMap((ing) =>
          multiLocaleEntry(`/chef-tools/ingredients/${ing.slug}`, {
            lastModified: toDate(ing.updated_at ?? undefined),
            changeFrequency: 'monthly',
            priority: 0.75,
            images: ing.image_url ? [ing.image_url] : undefined,
          })
        )
    : [];

  // ─── Natural-language "how many" pages ───────────────────────────────
  // Pattern: /chef-tools/how-many/how-many-{unit}-in-a-{measure}-of-{slug}
  // e.g. /how-many/how-many-grams-in-a-cup-of-rice
  const HOW_MANY_COMBOS = [
    { unit: 'grams', measure: 'cup'  },
    { unit: 'grams', measure: 'tbsp' },
    { unit: 'grams', measure: 'tsp'  },
    { unit: 'grams', measure: 'oz'   },
    { unit: 'grams', measure: 'lb'   },
    { unit: 'oz',    measure: 'cup'  },
    { unit: 'oz',    measure: 'tbsp' },
    { unit: 'oz',    measure: 'grams'},
    { unit: 'cups',  measure: 'grams'},
    { unit: 'ml',    measure: 'cup'  },
    { unit: 'ml',    measure: 'tbsp' },
    { unit: 'ml',    measure: 'tsp'  },
    { unit: 'lbs',   measure: 'kg'   },
    { unit: 'kg',    measure: 'lbs'  },
  ];

  const howManyUrls: MetadataRoute.Sitemap = ingredientList
    ? ingredientList
        .filter((ing) => ing.slug)
        .slice(0, 50) // cap at 50 ingredients to avoid sitemap bloat (50×14×4=2800 URLs)
        .flatMap((ing) =>
          HOW_MANY_COMBOS.flatMap(({ unit, measure }) =>
            multiLocaleEntry(
              `/chef-tools/how-many/how-many-${unit}-in-a-${measure}-of-${ing.slug}`,
              {
                lastModified: toDate(ing.updated_at ?? undefined),
                changeFrequency: 'monthly',
                priority: 0.8,
              },
            )
          )
        )
    : [];

  // ─── Ingredient state pages ──────────────────────────────────────────
  // ✅ Only emit state URLs that ACTUALLY EXIST in the database.
  // We fetch a single { slug → [states] } map from the backend (one query).
  // This eliminates 404s caused by sitemap listing states that haven't been
  // generated for a given ingredient.
  // Only high-value states (raw/boiled/fried) are indexed — others get noindex.
  const INDEXABLE_STATES = new Set(['raw', 'boiled', 'fried']);

  const statesMap = await fetchIngredientsStatesMap().catch(() => null);

  const ingredientStateUrls: MetadataRoute.Sitemap = ingredientList && statesMap
    ? ingredientList
        .filter((ing) => ing.slug && statesMap[ing.slug])
        .flatMap((ing) => {
          const availableStates = statesMap[ing.slug!].filter((s) => INDEXABLE_STATES.has(s));
          return availableStates.flatMap((state) =>
            multiLocaleEntry(`/chef-tools/ingredients/${ing.slug}/${state}`, {
              lastModified: toDate(ing.updated_at ?? undefined),
              changeFrequency: 'weekly',
              priority: 0.7,
            })
          );
        })
    : [];

  // ─── Recipe analysis pages ───────────────────────────────────────────
  const recipeAnalysisUrls: MetadataRoute.Sitemap = RECIPE_TEMPLATES.flatMap(
    (recipe) =>
      multiLocaleEntry(`/chef-tools/recipe-analysis/${recipe.slug}`, {
        lastModified: STATIC_DATE,
        changeFrequency: 'weekly',
        priority: 0.85,
      })
  );

  // ─── Diet pages ──────────────────────────────────────────────────────
  const DIET_FLAGS = ['vegan', 'vegetarian', 'keto', 'paleo', 'gluten-free', 'mediterranean', 'low-carb'];

  const dietUrls: MetadataRoute.Sitemap = DIET_FLAGS.flatMap((flag) =>
    multiLocaleEntry(`/chef-tools/diet/${flag}`, {
      lastModified: STATIC_DATE,
      changeFrequency: 'weekly',
      priority: 0.85,
    })
  );

  // ─── Ranking pages ──────────────────────────────────────────────────
  const RANKING_METRICS = [
    'calories', 'protein', 'fat', 'carbs', 'fiber', 'sugar',
    'vitamin-c', 'vitamin-d', 'vitamin-b12',
    'iron', 'calcium', 'potassium', 'magnesium', 'zinc', 'sodium',
  ];

  const rankingUrls: MetadataRoute.Sitemap = RANKING_METRICS.flatMap((metric) =>
    multiLocaleEntry(`/chef-tools/ranking/${metric}`, {
      lastModified: STATIC_DATE,
      changeFrequency: 'weekly',
      priority: 0.85,
    })
  );

  return [...staticUrls, ...postUrls, ...ingredientUrls, ...ingredientProfileUrls, ...howManyUrls, ...ingredientStateUrls, ...recipeAnalysisUrls, ...dietUrls, ...rankingUrls];
}
