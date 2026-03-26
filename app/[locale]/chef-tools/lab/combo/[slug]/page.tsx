import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { fetchLabCombo } from '@/lib/api';
import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/JsonLd';

export const revalidate = 86400; // 24h ISR

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const page = await fetchLabCombo(slug, locale);
  if (!page) return { title: 'Not Found' };

  const url = `https://dima-fomin.pl/${locale}/chef-tools/lab/combo/${slug}`;
  const locales = ['pl', 'en', 'ru', 'uk'];

  return {
    title: page.title,
    description: page.description,
    alternates: {
      canonical: url,
      languages: Object.fromEntries([
        ...locales.map((l) => [l, `https://dima-fomin.pl/${l}/chef-tools/lab/combo/${slug}`]),
        ['x-default', `https://dima-fomin.pl/pl/chef-tools/lab/combo/${slug}`],
      ]),
    },
    openGraph: {
      title: page.title,
      description: page.description,
      url,
      type: 'article',
      siteName: 'Dima Fomin',
      locale,
    },
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const LOCALE_LABELS: Record<string, {
  backToLab: string;
  ingredients: string;
  nutritionTitle: string;
  flavorTitle: string;
  suggestionsTitle: string;
  variantsTitle: string;
  faqTitle: string;
  tryInLab: string;
}> = {
  en: {
    backToLab: '← Back to Lab',
    ingredients: 'Ingredients',
    nutritionTitle: 'Nutrition (per 100g)',
    flavorTitle: 'Flavor Profile',
    suggestionsTitle: 'What to Add',
    variantsTitle: 'Recipe Variants',
    faqTitle: 'Frequently Asked Questions',
    tryInLab: 'Try this combo in Lab →',
  },
  ru: {
    backToLab: '← Назад в Лабораторию',
    ingredients: 'Ингредиенты',
    nutritionTitle: 'Пищевая ценность (на 100 г)',
    flavorTitle: 'Профиль вкуса',
    suggestionsTitle: 'Что добавить',
    variantsTitle: 'Варианты рецептов',
    faqTitle: 'Часто задаваемые вопросы',
    tryInLab: 'Попробовать в Лаборатории →',
  },
  pl: {
    backToLab: '← Powrót do Laboratorium',
    ingredients: 'Składniki',
    nutritionTitle: 'Wartość odżywcza (na 100 g)',
    flavorTitle: 'Profil smakowy',
    suggestionsTitle: 'Co dodać',
    variantsTitle: 'Warianty przepisów',
    faqTitle: 'Często zadawane pytania',
    tryInLab: 'Wypróbuj w Laboratorium →',
  },
  uk: {
    backToLab: '← Назад до Лабораторії',
    ingredients: 'Інгредієнти',
    nutritionTitle: 'Харчова цінність (на 100 г)',
    flavorTitle: 'Профіль смаку',
    suggestionsTitle: 'Що додати',
    variantsTitle: 'Варіанти рецептів',
    faqTitle: 'Часті запитання',
    tryInLab: 'Спробувати в Лабораторії →',
  },
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function LabComboPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const page = await fetchLabCombo(slug, locale);
  if (!page) notFound();

  const labels = LOCALE_LABELS[locale] ?? LOCALE_LABELS.en;
  const smart = page.smart_response;

  // Build Lab URL with query params for "Try in Lab" link
  const labParams = new URLSearchParams();
  labParams.set('q', page.ingredients.join(','));
  if (page.goal) labParams.set('goal', page.goal);
  if (page.meal_type) labParams.set('meal', page.meal_type);
  const labUrl = `/${locale}/chef-tools/lab?${labParams.toString()}`;

  // Extract data from smart_response
  const nutrition = smart.nutrition as Record<string, number> | undefined;
  const flavorProfile = smart.flavor_profile as {
    dominant_tastes?: { taste: string; intensity: number }[];
    balance_score?: number;
  } | undefined;
  const suggestions = (smart.suggestions as { name?: string; reason?: string }[] | undefined) ?? [];
  const variants = (smart.variants as { name?: string; ingredients?: string[] }[] | undefined) ?? [];
  const faq = Array.isArray(page.faq) ? page.faq : [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* JSON-LD structured data */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: page.title,
          description: page.description,
          url: `https://dima-fomin.pl/${locale}/chef-tools/lab/combo/${slug}`,
          datePublished: page.published_at,
          dateModified: page.updated_at,
          author: { '@type': 'Organization', name: 'Dima Fomin' },
          publisher: { '@type': 'Organization', name: 'Dima Fomin' },
        }}
      />

      {/* FAQ JSON-LD */}
      {faq.length > 0 && (
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faq.map((f) => ({
              '@type': 'Question',
              name: f.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: f.answer,
              },
            })),
          }}
        />
      )}

      {/* Breadcrumbs */}
      <nav className="text-sm text-muted-foreground mb-6">
        <Link href={`/${locale}/chef-tools/lab`} className="hover:text-primary transition">
          {labels.backToLab}
        </Link>
      </nav>

      {/* H1 */}
      <h1 className="text-3xl md:text-5xl font-black tracking-tighter mb-4 text-foreground">
        {page.h1}
      </h1>

      {/* Intro */}
      <p className="text-lg text-muted-foreground mb-8 max-w-2xl leading-relaxed">
        {page.intro}
      </p>

      {/* Ingredient chips */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-3">{labels.ingredients}</h2>
        <div className="flex flex-wrap gap-2">
          {page.ingredients.map((ing) => (
            <Link
              key={ing}
              href={`/${locale}/chef-tools/ingredients/${ing}`}
              className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium hover:bg-primary/20 transition"
            >
              {capitalize(ing.replace(/-/g, ' '))}
            </Link>
          ))}
        </div>
      </section>

      {/* Nutrition */}
      {nutrition && (
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-3">{labels.nutritionTitle}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {nutrition.calories != null && (
              <div className="bg-muted/30 rounded-xl p-4 text-center">
                <p className="text-2xl font-black">{Math.round(nutrition.calories)}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">kcal</p>
              </div>
            )}
            {nutrition.protein != null && (
              <div className="bg-muted/30 rounded-xl p-4 text-center">
                <p className="text-2xl font-black">{nutrition.protein.toFixed(1)}g</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">protein</p>
              </div>
            )}
            {nutrition.fat != null && (
              <div className="bg-muted/30 rounded-xl p-4 text-center">
                <p className="text-2xl font-black">{nutrition.fat.toFixed(1)}g</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">fat</p>
              </div>
            )}
            {nutrition.carbs != null && (
              <div className="bg-muted/30 rounded-xl p-4 text-center">
                <p className="text-2xl font-black">{nutrition.carbs.toFixed(1)}g</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">carbs</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Flavor Profile */}
      {flavorProfile?.dominant_tastes && flavorProfile.dominant_tastes.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-3">{labels.flavorTitle}</h2>
          <div className="space-y-2">
            {flavorProfile.dominant_tastes.map((t) => (
              <div key={t.taste} className="flex items-center gap-3">
                <span className="text-sm font-medium w-20 capitalize">{t.taste}</span>
                <div className="flex-1 bg-muted/30 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all"
                    style={{ width: `${Math.round(t.intensity * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-10 text-right">
                  {Math.round(t.intensity * 100)}%
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-3">{labels.suggestionsTitle}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {suggestions.slice(0, 6).map((s, i) => (
              <div key={i} className="flex items-start gap-2 bg-muted/20 rounded-xl p-3">
                <span className="text-primary font-bold">+</span>
                <div>
                  <p className="font-semibold text-sm">{s.name}</p>
                  {s.reason && (
                    <p className="text-xs text-muted-foreground mt-0.5">{s.reason}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recipe Variants */}
      {variants.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-3">{labels.variantsTitle}</h2>
          <div className="space-y-3">
            {variants.map((v, i) => (
              <div key={i} className="bg-muted/20 rounded-xl p-4">
                <h3 className="font-bold text-sm mb-1">{v.name}</h3>
                {v.ingredients && (
                  <p className="text-xs text-muted-foreground">
                    {v.ingredients.join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      {faq.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">{labels.faqTitle}</h2>
          <div className="space-y-4">
            {faq.map((f, i) => (
              <details key={i} className="group bg-muted/20 rounded-xl">
                <summary className="cursor-pointer px-4 py-3 font-semibold text-sm list-none flex justify-between items-center">
                  {f.question}
                  <span className="text-muted-foreground group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <p className="px-4 pb-3 text-sm text-muted-foreground">{f.answer}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* CTA: Try in Lab */}
      <section className="mt-12 mb-8 text-center">
        <Link
          href={labUrl}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 transition"
        >
          {labels.tryInLab}
        </Link>
      </section>
    </div>
  );
}
