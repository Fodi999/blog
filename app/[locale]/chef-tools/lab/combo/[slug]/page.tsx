import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { fetchLabCombo, fetchRelatedCombos } from '@/lib/api';
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
        ['x-default', `https://dima-fomin.pl/chef-tools/lab/combo/${slug}`],
      ]),
    },
    openGraph: {
      title: page.title,
      description: page.description,
      url,
      type: 'article',
      siteName: 'Dima Fomin',
      locale,
      ...(page.image_url ? { images: [{ url: page.image_url, width: 1200, height: 630, alt: page.h1 }] } : {}),
    },
    twitter: {
      card: page.image_url ? 'summary_large_image' : 'summary',
      title: page.title,
      description: page.description,
      ...(page.image_url ? { images: [page.image_url] } : {}),
    },
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const LOCALE_LABELS: Record<string, {
  backToLab: string;
  ingredients: string;
  nutritionTitle: string;
  flavorTitle: string;
  whyItWorksTitle: string;
  howToCookTitle: string;
  optimizationTitle: string;
  suggestionsTitle: string;
  variantsTitle: string;
  faqTitle: string;
  tryInLab: string;
  totalTime: string;
  quickAnswer: (protein: number, minutes: number) => string;
  relatedTitle: string;
  relatedCta: string;
  breadcrumbHome: string;
  breadcrumbLab: string;
}> = {
  en: {
    backToLab: '← Back to Lab',
    ingredients: 'Ingredients',
    nutritionTitle: 'Nutrition (per 100g)',
    flavorTitle: 'Flavor Profile',
    whyItWorksTitle: 'Why This Combo Works',
    howToCookTitle: 'How to Cook',
    optimizationTitle: 'Optimization Tips',
    suggestionsTitle: 'What to Add',
    variantsTitle: 'Recipe Variants',
    faqTitle: 'Frequently Asked Questions',
    tryInLab: 'Try this combo in Lab →',
    totalTime: 'Total time',
    quickAnswer: (p, m) => `This dish delivers ~${p}g protein and is ready in ${m} minutes.`,
    relatedTitle: 'Related Combos',
    relatedCta: 'View recipe →',
    breadcrumbHome: 'Home',
    breadcrumbLab: 'Food Lab',
  },
  ru: {
    backToLab: '← Назад в Лабораторию',
    ingredients: 'Ингредиенты',
    nutritionTitle: 'Пищевая ценность (на 100 г)',
    flavorTitle: 'Профиль вкуса',
    whyItWorksTitle: 'Почему эта комбинация работает',
    howToCookTitle: 'Как приготовить',
    optimizationTitle: 'Советы по оптимизации',
    suggestionsTitle: 'Что добавить',
    variantsTitle: 'Варианты рецептов',
    faqTitle: 'Часто задаваемые вопросы',
    tryInLab: 'Попробовать в Лаборатории →',
    totalTime: 'Общее время',
    quickAnswer: (p, m) => `Это блюдо содержит ~${p} г белка и готовится за ${m} минут.`,
    relatedTitle: 'Похожие комбинации',
    relatedCta: 'Смотреть рецепт →',
    breadcrumbHome: 'Главная',
    breadcrumbLab: 'Лаборатория',
  },
  pl: {
    backToLab: '← Powrót do Laboratorium',
    ingredients: 'Składniki',
    nutritionTitle: 'Wartość odżywcza (na 100 g)',
    flavorTitle: 'Profil smakowy',
    whyItWorksTitle: 'Dlaczego ta kombinacja działa',
    howToCookTitle: 'Jak gotować',
    optimizationTitle: 'Wskazówki optymalizacji',
    suggestionsTitle: 'Co dodać',
    variantsTitle: 'Warianty przepisów',
    faqTitle: 'Często zadawane pytania',
    tryInLab: 'Wypróbuj w Laboratorium →',
    totalTime: 'Całkowity czas',
    quickAnswer: (p, m) => `To danie dostarcza ~${p} g białka i jest gotowe w ${m} minut.`,
    relatedTitle: 'Powiązane kombinacje',
    relatedCta: 'Zobacz przepis →',
    breadcrumbHome: 'Strona główna',
    breadcrumbLab: 'Laboratorium',
  },
  uk: {
    backToLab: '← Назад до Лабораторії',
    ingredients: 'Інгредієнти',
    nutritionTitle: 'Харчова цінність (на 100 г)',
    flavorTitle: 'Профіль смаку',
    whyItWorksTitle: 'Чому ця комбінація працює',
    howToCookTitle: 'Як приготувати',
    optimizationTitle: 'Поради з оптимізації',
    suggestionsTitle: 'Що додати',
    variantsTitle: 'Варіанти рецептів',
    faqTitle: 'Часті запитання',
    tryInLab: 'Спробувати в Лабораторії →',
    totalTime: 'Загальний час',
    quickAnswer: (p, m) => `Ця страва містить ~${p} г білка і готується за ${m} хвилин.`,
    relatedTitle: 'Схожі комбінації',
    relatedCta: 'Дивитись рецепт →',
    breadcrumbHome: 'Головна',
    breadcrumbLab: 'Лабораторія',
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

  const relatedCombos = await fetchRelatedCombos(slug, locale, 6);

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
    balance?: { score?: number; dominant_tastes?: string[] };
  } | undefined;

  // Suggestions: backend sends { slug, name, reasons: string[], fills_gaps: string[], score, suggested_grams }
  const rawSuggestions = (smart.suggestions ?? []) as {
    slug?: string;
    name?: string;
    reasons?: string[];
    fills_gaps?: string[];
    score?: number;
    suggested_grams?: number;
  }[];

  // Recipe Variants: backend sends RecipeVariant objects
  const rawVariants = (smart.variants ?? []) as {
    variant_type?: string;
    dish_type?: string;
    title?: string;
    ingredients?: { slug?: string; name?: string; role?: string; grams?: number; calories?: number }[];
    total_calories?: number;
    score?: number;
    balance_score?: number;
    explanation?: string;
  }[];

  const faq = Array.isArray(page.faq) ? page.faq : [];
  const howToCook = Array.isArray(page.how_to_cook) ? page.how_to_cook : [];
  const optimizationTips = Array.isArray(page.optimization_tips) ? page.optimization_tips : [];

  // Calculate total cooking time
  const totalMinutes = howToCook.reduce((sum, s) => sum + (s.time_minutes ?? 0), 0);

  // Variant type labels
  const variantTypeLabel = (vt: string) => {
    const map: Record<string, string> = {
      healthy: '🥗 Healthy',
      balanced: '⚖️ Balanced',
      heavy: '🔥 Hearty',
    };
    return map[vt] ?? capitalize(vt);
  };

  // Role badge color
  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      base: 'bg-amber-500/15 text-amber-700',
      side: 'bg-emerald-500/15 text-emerald-700',
      sauce: 'bg-purple-500/15 text-purple-700',
      aromatic: 'bg-pink-500/15 text-pink-700',
      fat: 'bg-yellow-500/15 text-yellow-700',
    };
    return colors[role] ?? 'bg-muted text-muted-foreground';
  };

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
          ...(page.image_url ? { image: page.image_url } : {}),
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

      {/* HowTo JSON-LD — enables Google Rich Results for cooking steps */}
      {howToCook.length > 0 && (
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'HowTo',
            name: page.h1,
            description: page.description,
            ...(page.image_url ? { image: page.image_url } : {}),
            ...(totalMinutes > 0 ? { totalTime: `PT${totalMinutes}M` } : {}),
            step: howToCook.map((s) => ({
              '@type': 'HowToStep',
              position: s.step,
              name: `Step ${s.step}`,
              text: s.text,
            })),
          }}
        />
      )}

      {/* BreadcrumbList JSON-LD — structured navigation for Google */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: labels.breadcrumbHome,
              item: `https://dima-fomin.pl/${locale}`,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: labels.breadcrumbLab,
              item: `https://dima-fomin.pl/${locale}/chef-tools/lab`,
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: page.h1,
              item: `https://dima-fomin.pl/${locale}/chef-tools/lab/combo/${slug}`,
            },
          ],
        }}
      />

      {/* Breadcrumbs */}
      <nav className="text-sm text-muted-foreground mb-6">
        <ol className="flex items-center gap-1 flex-wrap" itemScope itemType="https://schema.org/BreadcrumbList">
          <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
            <Link href={`/${locale}`} itemProp="item" className="hover:text-primary transition">
              <span itemProp="name">{labels.breadcrumbHome}</span>
            </Link>
            <meta itemProp="position" content="1" />
          </li>
          <li className="text-muted-foreground/50">/</li>
          <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
            <Link href={`/${locale}/chef-tools/lab`} itemProp="item" className="hover:text-primary transition">
              <span itemProp="name">{labels.breadcrumbLab}</span>
            </Link>
            <meta itemProp="position" content="2" />
          </li>
          <li className="text-muted-foreground/50">/</li>
          <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
            <span itemProp="name" className="text-foreground font-medium">{page.h1}</span>
            <meta itemProp="position" content="3" />
          </li>
        </ol>
      </nav>

      {/* H1 */}
      <h1 className="text-3xl md:text-5xl font-black tracking-tighter mb-4 text-foreground">
        {page.h1}
      </h1>

      {/* Quick Answer — targets featured snippet (paragraph) */}
      {nutrition && nutrition.protein != null && totalMinutes > 0 && (
        <div className="bg-primary/5 border border-primary/15 rounded-xl px-5 py-4 mb-6 max-w-2xl">
          <p className="text-base font-medium text-foreground/90 leading-relaxed">
            {labels.quickAnswer(Math.round(nutrition.protein), totalMinutes)}
          </p>
        </div>
      )}

      {/* Intro */}
      <p className="text-lg text-muted-foreground mb-8 max-w-2xl leading-relaxed">
        {page.intro}
      </p>

      {/* Hero image */}
      {page.image_url && (
        <div className="mb-10 rounded-2xl overflow-hidden border bg-muted/10">
          <img
            src={page.image_url}
            alt={page.h1}
            className="w-full max-h-[420px] object-cover"
            loading="eager"
          />
        </div>
      )}

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

      {/* Why This Combo Works */}
      {page.why_it_works && (
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-3">{labels.whyItWorksTitle}</h2>
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-5">
            <p className="text-base leading-relaxed text-foreground/90">{page.why_it_works}</p>
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

      {/* How to Cook */}
      {howToCook.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-3">{labels.howToCookTitle}</h2>
          {totalMinutes > 0 && (
            <p className="text-sm text-muted-foreground mb-4">
              ⏱️ {labels.totalTime}: ~{totalMinutes} min
            </p>
          )}
          <div className="space-y-3">
            {howToCook.map((step) => (
              <div key={step.step} className="flex gap-4 bg-muted/20 rounded-xl p-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  {step.step}
                </div>
                <div className="flex-1">
                  <p className="text-sm leading-relaxed">{step.text}</p>
                  {step.time_minutes != null && step.time_minutes > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">~{step.time_minutes} min</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Suggestions — with reasons + linked to ingredient pages */}
      {rawSuggestions.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-3">{labels.suggestionsTitle}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rawSuggestions.slice(0, 6).map((s, i) => (
              <div key={i} className="flex items-start gap-3 bg-muted/20 rounded-xl p-4">
                <span className="text-primary font-bold text-lg">+</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {s.slug ? (
                      <Link
                        href={`/${locale}/ingredients/${s.slug}`}
                        className="font-semibold text-sm text-primary hover:underline"
                      >
                        {s.name}
                      </Link>
                    ) : (
                      <p className="font-semibold text-sm">{s.name}</p>
                    )}
                    {s.score != null && (
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                        {s.score}%
                      </span>
                    )}
                  </div>
                  {s.reasons && s.reasons.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {s.reasons.join(' · ')}
                    </p>
                  )}
                  {s.fills_gaps && s.fills_gaps.length > 0 && (
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                      Fills: {s.fills_gaps.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recipe Variants — properly rendered */}
      {rawVariants.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-3">{labels.variantsTitle}</h2>
          <div className="space-y-4">
            {rawVariants.map((v, i) => (
              <div key={i} className="bg-muted/20 rounded-xl p-5 space-y-3">
                {/* Variant header */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="font-bold text-base">
                    {v.variant_type && <span className="mr-2">{variantTypeLabel(v.variant_type)}</span>}
                    {v.title}
                  </h3>
                  <div className="flex gap-2 text-xs">
                    {v.total_calories != null && (
                      <span className="bg-amber-500/10 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                        {v.total_calories} kcal
                      </span>
                    )}
                    {v.score != null && (
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                        Score: {v.score}/100
                      </span>
                    )}
                  </div>
                </div>

                {/* Explanation */}
                {v.explanation && (
                  <p className="text-sm text-muted-foreground italic">{v.explanation}</p>
                )}

                {/* Variant ingredients table */}
                {v.ingredients && v.ingredients.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {v.ingredients.map((ing, j) => (
                      <div key={j} className="flex items-center gap-2 text-sm">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${roleBadge(ing.role ?? '')}`}>
                          {ing.role ?? '?'}
                        </span>
                        <span className="font-medium">{ing.name}</span>
                        {ing.grams != null && (
                          <span className="text-xs text-muted-foreground">{ing.grams}g</span>
                        )}
                        {ing.calories != null && (
                          <span className="text-[10px] text-muted-foreground/60">({Math.round(ing.calories)} kcal)</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Optimization Tips */}
      {optimizationTips.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-3">{labels.optimizationTitle}</h2>
          <div className="space-y-2">
            {optimizationTips.map((tip, i) => (
              <div key={i} className="flex items-start gap-3 bg-muted/10 border border-muted/30 rounded-xl p-4">
                <span className="text-lg">{tip.icon}</span>
                <div>
                  {tip.ingredient && (
                    <span className="font-semibold text-sm text-primary mr-1">
                      {capitalize(tip.ingredient)}
                    </span>
                  )}
                  <span className="text-sm text-foreground/80">{tip.tip}</span>
                </div>
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

      {/* Related Combos — internal linking for SEO */}
      {relatedCombos.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">{labels.relatedTitle}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedCombos.map((rc) => (
              <Link
                key={rc.slug}
                href={`/${locale}/chef-tools/lab/combo/${rc.slug}`}
                className="group block bg-muted/20 rounded-xl overflow-hidden border border-muted/30 hover:border-primary/40 transition"
              >
                {rc.image_url ? (
                  <img
                    src={rc.image_url}
                    alt={rc.title}
                    className="w-full h-32 object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-32 bg-muted/30 flex items-center justify-center text-3xl">
                    🍽️
                  </div>
                )}
                <div className="p-3">
                  <h3 className="font-bold text-sm mb-1 group-hover:text-primary transition line-clamp-2">
                    {rc.title}
                  </h3>
                  <p className="text-[11px] text-muted-foreground line-clamp-1">
                    {rc.ingredients.map(capitalize).join(' · ')}
                  </p>
                  {(rc.goal || rc.meal_type) && (
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {rc.goal && (
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                          {capitalize(rc.goal)}
                        </span>
                      )}
                      {rc.meal_type && (
                        <span className="text-[10px] bg-amber-500/10 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                          {capitalize(rc.meal_type)}
                        </span>
                      )}
                    </div>
                  )}
                  <p className="text-[11px] text-primary font-medium mt-2 group-hover:underline">
                    {labels.relatedCta}
                  </p>
                </div>
              </Link>
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
