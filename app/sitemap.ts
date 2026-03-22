import { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/posts';
import { fetchIngredients } from '@/lib/api';
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

/** Fixed at build time — avoids marking every page as "updated today" on every deploy */
const BUILD_DATE = new Date();

/** Normalize any date string to a valid Date. Falls back to yesterday (not a fixed date). */
function toDate(raw?: string): Date {
  const d = raw ? new Date(raw) : null;
  // Yesterday as fallback — avoids a suspicious fixed date for all undated posts
  return d && !isNaN(d.getTime()) ? d : new Date(Date.now() - 86_400_000);
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
      // Fish season — 12 monthly pages
      ...Array.from({ length: 12 }, (_, i) => ({
        path: `/chef-tools/fish-season/${String(i + 1).padStart(2, '0')}`,
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

  // Static pages exist in ALL locales (same Next.js route handles all).
  // List only locales you are sure have translated UI for a given page.
  // These are shared layout pages — all 4 locales are valid.
  const staticUrls: MetadataRoute.Sitemap = staticPages.map(
    ({ path, priority, changeFrequency }) => ({
      url: `${BASE_URL}/${canonicalLocale}${path}`,
      lastModified: BUILD_DATE,
      changeFrequency,
      priority,
      // Attach gallery images to the /about page entry for Google Images sitemap
      ...(path === '/about' && galleryImages.length > 0
        ? { images: galleryImages.map(img => img.url) }
        : {}),
      alternates: {
        languages: {
          ...Object.fromEntries(locales.map((l) => [l, `${BASE_URL}/${l}${path}`])),
          'x-default': `${BASE_URL}/${canonicalLocale}${path}`,
        },
      },
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
      // If pl/ doesn't exist, skip — avoid generating a phantom canonical URL.
      return availableLocales.has(canonicalLocale);
    })
    .map(([slug, { date, availableLocales }]) => ({
      url: `${BASE_URL}/${canonicalLocale}/blog/${slug}`,
      lastModified: date,             // ✅ Real post date
      changeFrequency: 'monthly' as const,
      priority: 0.9,
      alternates: {
        languages: {
          // ✅ Only locales where the file physically exists
          ...Object.fromEntries(
            [...availableLocales].map((l) => [l, `${BASE_URL}/${l}/blog/${slug}`])
          ),
          'x-default': `${BASE_URL}/${canonicalLocale}/blog/${slug}`,
        },
      },
    }));

  // ─── Ingredient pages ────────────────────────────────────────────────
  const ingredientList = await fetchIngredients();

  // /chef-tools/nutrition/{slug} — nutrition detail pages
  const ingredientUrls: MetadataRoute.Sitemap = ingredientList
    ? ingredientList
        .filter((ing) => ing.slug)
        .map((ing) => ({
          url: `${BASE_URL}/${canonicalLocale}/chef-tools/nutrition/${ing.slug}`,
          lastModified: toDate(ing.updated_at ?? undefined),
          changeFrequency: 'monthly' as const,
          priority: 0.8,
          // Image sitemap: Google Images will index product photos
          ...(ing.image_url ? { images: [ing.image_url] } : {}),
          alternates: {
            languages: {
              ...Object.fromEntries(
                locales.map((l) => [l, `${BASE_URL}/${l}/chef-tools/nutrition/${ing.slug}`])
              ),
              'x-default': `${BASE_URL}/${canonicalLocale}/chef-tools/nutrition/${ing.slug}`,
            },
          },
        }))
    : [];

  // /chef-tools/ingredients/{slug} — ingredient profile pages (SEO cluster: catalog → profile → nutrition → conversions)
  const ingredientProfileUrls: MetadataRoute.Sitemap = ingredientList
    ? ingredientList
        .filter((ing) => ing.slug)
        .map((ing) => ({
          url: `${BASE_URL}/${canonicalLocale}/chef-tools/ingredients/${ing.slug}`,
          lastModified: toDate(ing.updated_at ?? undefined),
          changeFrequency: 'monthly' as const,
          priority: 0.75,
          // Image sitemap: Google Images will index product photos
          ...(ing.image_url ? { images: [ing.image_url] } : {}),
          alternates: {
            languages: {
              ...Object.fromEntries(
                locales.map((l) => [l, `${BASE_URL}/${l}/chef-tools/ingredients/${ing.slug}`])
              ),
              'x-default': `${BASE_URL}/${canonicalLocale}/chef-tools/ingredients/${ing.slug}`,
            },
          },
        }))
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
        .flatMap((ing) =>
          HOW_MANY_COMBOS.map(({ unit, measure }) => ({
            url: `${BASE_URL}/${canonicalLocale}/chef-tools/how-many/how-many-${unit}-in-a-${measure}-of-${ing.slug}`,
            lastModified: toDate(ing.updated_at ?? undefined),
            changeFrequency: 'monthly' as const,
            priority: 0.8,
            alternates: {
              languages: {
                ...Object.fromEntries(
                  locales.map((l) => [
                    l,
                    `${BASE_URL}/${l}/chef-tools/how-many/how-many-${unit}-in-a-${measure}-of-${ing.slug}`,
                  ])
                ),
                'x-default': `${BASE_URL}/${canonicalLocale}/chef-tools/how-many/how-many-${unit}-in-a-${measure}-of-${ing.slug}`,
              },
            },
          }))
        )
    : [];

  // ─── Ingredient state pages ──────────────────────────────────────────
  // Only high-value states go into sitemap (raw/boiled/fried have real search volume).
  // Other states (steamed, baked, grilled, smoked, frozen, dried, pickled) are
  // rendered with noindex — they exist for users but won't pollute Google's index.
  const INDEXABLE_STATES = ['raw', 'boiled', 'fried'];

  const ingredientStateUrls: MetadataRoute.Sitemap = ingredientList
    ? ingredientList
        .filter((ing) => ing.slug)
        .flatMap((ing) =>
          INDEXABLE_STATES.map((state) => ({
            url: `${BASE_URL}/${canonicalLocale}/chef-tools/ingredients/${ing.slug}/${state}`,
            lastModified: toDate(ing.updated_at ?? undefined),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
            alternates: {
              languages: {
                ...Object.fromEntries(
                  locales.map((l) => [
                    l,
                    `${BASE_URL}/${l}/chef-tools/ingredients/${ing.slug}/${state}`,
                  ])
                ),
                'x-default': `${BASE_URL}/${canonicalLocale}/chef-tools/ingredients/${ing.slug}/${state}`,
              },
            },
          }))
        )
    : [];

  // ─── Recipe analysis pages ───────────────────────────────────────────
  const recipeAnalysisUrls: MetadataRoute.Sitemap = RECIPE_TEMPLATES.map(
    (recipe) => ({
      url: `${BASE_URL}/${canonicalLocale}/chef-tools/recipe-analysis/${recipe.slug}`,
      lastModified: BUILD_DATE,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
      alternates: {
        languages: {
          ...Object.fromEntries(
            locales.map((l) => [
              l,
              `${BASE_URL}/${l}/chef-tools/recipe-analysis/${recipe.slug}`,
            ]),
          ),
          'x-default': `${BASE_URL}/${canonicalLocale}/chef-tools/recipe-analysis/${recipe.slug}`,
        },
      },
    }),
  );

  // ─── Diet pages ──────────────────────────────────────────────────────
  // 7 diets × 4 locales = 28 pages
  const DIET_FLAGS = ['vegan', 'vegetarian', 'keto', 'paleo', 'gluten-free', 'mediterranean', 'low-carb'];

  const dietUrls: MetadataRoute.Sitemap = DIET_FLAGS.flatMap((flag) => [
    {
      url: `${BASE_URL}/${canonicalLocale}/chef-tools/diet/${flag}`,
      lastModified: BUILD_DATE,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
      alternates: {
        languages: {
          ...Object.fromEntries(
            locales.map((l) => [l, `${BASE_URL}/${l}/chef-tools/diet/${flag}`])
          ),
          'x-default': `${BASE_URL}/${canonicalLocale}/chef-tools/diet/${flag}`,
        },
      },
    },
  ]);

  // ─── Ranking pages ──────────────────────────────────────────────────
  // 15 metrics × 4 locales = 60 pages
  const RANKING_METRICS = [
    'calories', 'protein', 'fat', 'carbs', 'fiber', 'sugar',
    'vitamin-c', 'vitamin-d', 'vitamin-b12',
    'iron', 'calcium', 'potassium', 'magnesium', 'zinc', 'sodium',
  ];

  const rankingUrls: MetadataRoute.Sitemap = RANKING_METRICS.flatMap((metric) => [
    {
      url: `${BASE_URL}/${canonicalLocale}/chef-tools/ranking/${metric}`,
      lastModified: BUILD_DATE,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
      alternates: {
        languages: {
          ...Object.fromEntries(
            locales.map((l) => [l, `${BASE_URL}/${l}/chef-tools/ranking/${metric}`])
          ),
          'x-default': `${BASE_URL}/${canonicalLocale}/chef-tools/ranking/${metric}`,
        },
      },
    },
  ]);

  return [...staticUrls, ...postUrls, ...ingredientUrls, ...ingredientProfileUrls, ...howManyUrls, ...ingredientStateUrls, ...recipeAnalysisUrls, ...dietUrls, ...rankingUrls];
}
