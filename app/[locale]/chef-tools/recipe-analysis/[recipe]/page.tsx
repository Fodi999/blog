import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { generateMetadata as genMeta } from '@/lib/metadata';
import { JsonLd } from '@/components/JsonLd';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import {
  ChevronLeft,
  Flame,
  Beef,
  Droplets,
  Wheat,
  Heart,
  Star,
  AlertTriangle,
  CircleAlert,
  Info,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Utensils,
} from 'lucide-react';
import { RECIPE_TEMPLATES, type RecipeTemplate } from '@/lib/recipe-templates';
import {
  fetchRecipeAnalysis,
  type RecipeAnalysisResponse,
  type RecipeAnalysisIngredient,
} from '@/lib/api';
import { ChefToolsNav } from '../../ChefToolsNav';

export const revalidate = 86400; // ISR: rebuild once per day

// ─── Static params ──────────────────────────────────────────────────────
const locales = ['pl', 'en', 'ru', 'uk'] as const;

export async function generateStaticParams() {
  return locales.flatMap((locale) =>
    RECIPE_TEMPLATES.map((r) => ({ locale, recipe: r.slug })),
  );
}

// ─── Metadata ───────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; recipe: string }>;
}) {
  const { locale, recipe: slug } = await params;
  setRequestLocale(locale);
  const tpl = RECIPE_TEMPLATES.find((r) => r.slug === slug);
  if (!tpl) return {};
  const loc = locale as keyof typeof tpl.title;
  return genMeta({
    title: tpl.title[loc] ?? tpl.title.en,
    description: tpl.description[loc] ?? tpl.description.en,
    locale: locale as 'pl' | 'en' | 'uk' | 'ru',
    path: `/chef-tools/recipe-analysis/${slug}`,
  });
}

// ─── Helpers ────────────────────────────────────────────────────────────
function localizedName(
  item: { name: string; name_en?: string; name_ru?: string; name_pl?: string; name_uk?: string },
  locale: string,
): string {
  if (locale === 'pl' && item.name_pl) return item.name_pl;
  if (locale === 'ru' && item.name_ru) return item.name_ru;
  if (locale === 'uk' && item.name_uk) return item.name_uk;
  return item.name_en ?? item.name;
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function barWidth(val: number, max: number) {
  return Math.min(100, Math.round((val / max) * 100));
}

const ROLE_LABELS: Record<string, { en: string; ru: string; pl: string; uk: string }> = {
  grain:     { en: "base",     ru: "основа",    pl: "baza",       uk: "основа" },
  vegetable: { en: "veggie",   ru: "овощ",      pl: "warzywo",    uk: "овоч" },
  fruit:     { en: "fruit",    ru: "фрукт",     pl: "owoc",       uk: "фрукт" },
  meat:      { en: "meat",     ru: "мясо",      pl: "mięso",      uk: "м'ясо" },
  fish:      { en: "fish",     ru: "рыба",      pl: "ryba",       uk: "риба" },
  seafood:   { en: "seafood",  ru: "морепрод.",  pl: "owoce morza", uk: "морепрод." },
  dairy:     { en: "dairy",    ru: "молочн.",    pl: "nabiał",     uk: "молочн." },
  oil:       { en: "fat",      ru: "жир",       pl: "tłuszcz",    uk: "жир" },
  fat:       { en: "fat",      ru: "жир",       pl: "tłuszcz",    uk: "жир" },
  herb:      { en: "herb",     ru: "зелень",    pl: "zioło",      uk: "зелень" },
  spice:     { en: "spice",    ru: "специя",    pl: "przyprawa",  uk: "спеція" },
  legume:    { en: "legume",   ru: "бобы",      pl: "strączkowe", uk: "боби" },
  nut:       { en: "nut",      ru: "орех",      pl: "orzech",     uk: "горіх" },
  sauce:     { en: "sauce",    ru: "соус",      pl: "sos",        uk: "соус" },
  sweetener: { en: "sweet",    ru: "подслащ.",   pl: "słodzik",    uk: "підсол." },
  condiment: { en: "condim.",  ru: "приправа",  pl: "przyprawa",  uk: "приправа" },
  mushroom:  { en: "mushroom", ru: "гриб",      pl: "grzyb",      uk: "гриб" },
  egg:       { en: "egg",      ru: "яйцо",     pl: "jajko",      uk: "яйце" },
  other:     { en: "other",    ru: "прочее",    pl: "inne",       uk: "інше" },
};

function roleLabel(pt: string | undefined, locale: string): string | null {
  if (!pt) return null;
  const r = ROLE_LABELS[pt];
  if (!r) return pt;
  if (locale === 'ru') return r.ru;
  if (locale === 'pl') return r.pl;
  if (locale === 'uk') return r.uk;
  return r.en;
}

const sevIcon = {
  critical: ShieldAlert,
  warning: AlertTriangle,
  info: Info,
};
const sevColor = {
  critical: 'text-red-500 bg-red-500/10 border-red-500/30',
  warning: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
  info: 'text-sky-500 bg-sky-500/10 border-sky-500/30',
};

// ─── Page ───────────────────────────────────────────────────────────────
export default async function RecipeAnalysisPage({
  params,
}: {
  params: Promise<{ locale: string; recipe: string }>;
}) {
  const { locale, recipe: slug } = await params;
  setRequestLocale(locale);

  const tpl = RECIPE_TEMPLATES.find((r) => r.slug === slug);
  if (!tpl) notFound();

  const [data, t, tIssues, tNav] = await Promise.all([
    fetchRecipeAnalysis(tpl.ingredients, tpl.portions, locale),
    getTranslations({ locale, namespace: 'recipeAnalysis' }),
    getTranslations({ locale, namespace: 'recipeAnalysis.issues' }),
    getTranslations({ locale, namespace: 'chefTools' }),
  ]);

  if (!data) notFound();

  const title = (tpl.title as Record<string, string>)[locale] ?? tpl.title.en;
  const pp = data.per_portion ?? data.nutrition;

  // Build Schema.org Recipe + NutritionInformation
  const recipeJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: title.split('—')[0].trim(),
    description: (tpl.description as Record<string, string>)[locale] ?? tpl.description.en,
    recipeCategory: tpl.category,
    recipeYield: `${tpl.portions} ${tpl.portions === 1 ? 'serving' : 'servings'}`,
    recipeIngredient: data.ingredients.map(
      (ing) => `${localizedName(ing, locale)} — ${ing.grams}g`,
    ),
    nutrition: {
      '@type': 'NutritionInformation',
      calories: `${Math.round(pp.calories)} kcal`,
      proteinContent: `${round1(pp.protein)}g`,
      fatContent: `${round1(pp.fat)}g`,
      carbohydrateContent: `${round1(pp.carbs)}g`,
      fiberContent: `${round1(pp.fiber)}g`,
      sugarContent: `${round1(pp.sugar)}g`,
    },
    author: { '@type': 'Person', name: 'Dima Fomin' },
    datePublished: '2025-02-15',
    url: `https://dima-fomin.pl/${locale}/chef-tools/recipe-analysis/${slug}`,
  };

  // FAQ from diagnosis issues
  const faqItems = (data.diagnosis?.issues ?? []).slice(0, 5).map((issue) => ({
    '@type': 'Question',
    name: tIssues(issue.title_key as any),
    acceptedAnswer: {
      '@type': 'Answer',
      text: tIssues(issue.description_key as any),
    },
  }));

  const faqJsonLd = faqItems.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems,
  } : null;

  const nav = (
    <ChefToolsNav
      locale={locale}
      translations={{
        back: t('back'),
        tabs: {
          tools: t('tools'),
          tables: t('tables'),
          products: t('products'),
        },
        tools: {
          converter: { title: t('converter') },
          fishSeason: { title: t('fishSeason') },
          ingredientAnalyzer: { title: t('ingredientAnalyzer') },
          ingredientsCatalog: { title: t('ingredientsCatalog') },
          lab: { title: tNav('tools.lab.title') },
          recipeAnalyzer: { title: tNav('tools.recipeAnalyzer.title') },
          flavorPairing: { title: tNav('tools.flavorPairing.title') },
          nutrition: { title: tNav('nutrition.title') },
        },
      }}
    />
  );

  return (
    <>
      <JsonLd data={recipeJsonLd} />
      {faqJsonLd && <JsonLd data={faqJsonLd} />}

      <div className="container mx-auto max-w-4xl px-4 py-8 space-y-10">
        {/* Back link */}
        <Link
          href="/chef-tools/lab"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          {t('backToLab')}
        </Link>

        {/* Title + health score */}
        <header className="space-y-4">
          <h1 className="text-3xl font-black tracking-tight">{title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {/* Health score */}
            {data.diagnosis && (
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                <span className="font-bold text-lg">{data.diagnosis.health_score}</span>
                <span className="text-muted-foreground">/100</span>
              </div>
            )}
            {/* Overall score */}
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              <span className="font-bold text-lg">{data.score}</span>
              <span className="text-muted-foreground">/10</span>
            </div>
            {/* Diet flags */}
            {data.diet.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {data.diet.map((d) => (
                  <span key={d} className="px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-semibold rounded-full border border-green-500/20">
                    {d}
                  </span>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* NUTRITION PER PORTION                                          */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section id="nutrition" className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            {t('nutritionPerPortion')}
          </h2>

          {/* Calorie card */}
          <div className="rounded-xl border bg-card p-6 text-center">
            <p className="text-4xl font-black">{Math.round(pp.calories)}</p>
            <p className="text-sm text-muted-foreground">{t('kcal')}</p>
          </div>

          {/* Macros bar chart */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <MacroCard icon={Beef} label={t('protein')} value={pp.protein} color="text-red-500" bg="bg-red-500" pct={data.macros.protein_pct} />
            <MacroCard icon={Droplets} label={t('fat')} value={pp.fat} color="text-amber-500" bg="bg-amber-500" pct={data.macros.fat_pct} />
            <MacroCard icon={Wheat} label={t('carbs')} value={pp.carbs} color="text-blue-500" bg="bg-blue-500" pct={data.macros.carbs_pct} />
            <MacroCard icon={TrendingUp} label={t('fiber')} value={pp.fiber} color="text-green-500" bg="bg-green-500" pct={0} />
          </div>

          {/* Full nutrition — total */}
          {data.portions > 1 && (
            <details className="group">
              <summary className="cursor-pointer text-sm font-semibold text-muted-foreground hover:text-foreground">
                {t('totalFor', { n: data.portions })}
              </summary>
              <div className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-3 text-center text-xs">
                <MiniStat label={t('kcal')} val={Math.round(data.nutrition.calories)} />
                <MiniStat label={t('protein')} val={`${round1(data.nutrition.protein)}g`} />
                <MiniStat label={t('fat')} val={`${round1(data.nutrition.fat)}g`} />
                <MiniStat label={t('carbs')} val={`${round1(data.nutrition.carbs)}g`} />
                <MiniStat label={t('fiber')} val={`${round1(data.nutrition.fiber)}g`} />
                <MiniStat label={t('sugar')} val={`${round1(data.nutrition.sugar)}g`} />
              </div>
            </details>
          )}
        </section>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* INGREDIENTS TABLE                                              */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section id="ingredients" className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Utensils className="h-5 w-5 text-primary" />
            {t('ingredients')}
          </h2>
          <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="p-3 text-left">{t('ingredient')}</th>
                  <th className="p-3 text-right">{t('grams')}</th>
                  <th className="p-3 text-right">{t('kcal')}</th>
                  <th className="p-3 text-right">{t('protein')}</th>
                  <th className="p-3 text-right">{t('fat')}</th>
                  <th className="p-3 text-right">{t('carbs')}</th>
                </tr>
              </thead>
              <tbody>
                {data.ingredients.map((ing) => (
                  <tr key={ing.slug} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-3 flex items-center gap-2">
                      {ing.image_url && (
                        <Image src={ing.image_url} alt={localizedName(ing, locale)} width={28} height={28} className="rounded-md object-cover" />
                      )}
                      <Link
                        href={`/chef-tools/ingredients/${ing.slug}`}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {localizedName(ing, locale)}
                      </Link>
                      {ing.product_type && (
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {roleLabel(ing.product_type, locale)}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono">{ing.grams}</td>
                    <td className="p-3 text-right font-mono">{Math.round(ing.calories)}</td>
                    <td className="p-3 text-right font-mono">{round1(ing.protein)}</td>
                    <td className="p-3 text-right font-mono">{round1(ing.fat)}</td>
                    <td className="p-3 text-right font-mono">{round1(ing.carbs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* FLAVOR PROFILE                                                 */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section id="flavor" className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            {t('flavorProfile')}
          </h2>

          <div className="rounded-xl border bg-card p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-muted-foreground">{t('balanceScore')}:</span>
              <span className="text-lg font-bold">{data.flavor.balance_score}/10</span>
            </div>

            {/* Flavor bars */}
            <FlavorBar label={t('sweetness')} value={data.flavor.sweetness} color="bg-pink-500" />
            <FlavorBar label={t('acidity')} value={data.flavor.acidity} color="bg-yellow-500" />
            <FlavorBar label={t('bitterness')} value={data.flavor.bitterness} color="bg-green-700" />
            <FlavorBar label={t('umami')} value={data.flavor.umami} color="bg-violet-500" />
            <FlavorBar label={t('fatFlavor')} value={data.flavor.fat} color="bg-amber-600" />
            <FlavorBar label={t('aroma')} value={data.flavor.aroma} color="bg-rose-500" />

            {/* Weak / strong tags */}
            <div className="flex flex-wrap gap-3 pt-2 text-xs">
              {data.flavor.weak.length > 0 && (
                <div>
                  <span className="text-muted-foreground">{t('weak')}:</span>{' '}
                  {data.flavor.weak.map((w) => (
                    <span key={w} className="ml-1 px-1.5 py-0.5 bg-red-500/10 text-red-500 rounded">{w}</span>
                  ))}
                </div>
              )}
              {data.flavor.strong.length > 0 && (
                <div>
                  <span className="text-muted-foreground">{t('strong')}:</span>{' '}
                  {data.flavor.strong.map((s) => (
                    <span key={s} className="ml-1 px-1.5 py-0.5 bg-green-500/10 text-green-500 rounded">{s}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* RECIPE DOCTOR — Diagnosis                                      */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {data.diagnosis && data.diagnosis.issues.length > 0 && (
          <section id="doctor" className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <CircleAlert className="h-5 w-5 text-red-500" />
              {t('recipeDoctor')}
            </h2>

            {/* Category score bars */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <CatScoreBar label={t('catFlavor')} score={data.diagnosis.category_scores.flavor} />
              <CatScoreBar label={t('catNutrition')} score={data.diagnosis.category_scores.nutrition} />
              <CatScoreBar label={t('catDominance')} score={data.diagnosis.category_scores.dominance} />
              <CatScoreBar label={t('catStructure')} score={data.diagnosis.category_scores.structure} />
            </div>

            {/* Issues list */}
            <div className="space-y-3">
              {data.diagnosis.issues.map((issue, i) => {
                const sev = issue.severity as 'critical' | 'warning' | 'info';
                const Icon = sevIcon[sev] ?? Info;
                const colors = sevColor[sev] ?? sevColor.info;
                return (
                  <div key={i} className={`rounded-lg border p-4 ${colors}`}>
                    <div className="flex items-start gap-3">
                      <Icon className="h-5 w-5 mt-0.5 shrink-0" />
                      <div className="space-y-1 min-w-0">
                        <p className="font-semibold text-sm">
                          {tIssues(issue.title_key as any)}
                          {issue.impact != null && (
                            <span className="ml-2 text-xs opacity-70">+{issue.impact} pts</span>
                          )}
                        </p>
                        <p className="text-xs opacity-80">
                          {tIssues(issue.description_key as any)}
                        </p>
                        {/* Fix suggestions */}
                        {issue.fix_slugs.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {issue.fix_slugs.map((fs) => {
                              const ing = data.ingredients.find((x) => x.slug === fs) ??
                                data.suggestions.find((x) => x.slug === fs);
                              return (
                                <Link
                                  key={fs}
                                  href={`/chef-tools/ingredients/${fs}`}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-background/80 rounded-full border hover:border-primary/50 transition-colors"
                                >
                                  {ing?.image_url && (
                                    <Image src={ing.image_url} alt={fs} width={14} height={14} className="rounded-full" />
                                  )}
                                  {ing ? localizedName(ing, locale) : fs}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* SUGGESTIONS                                                    */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {data.suggestions.length > 0 && (
          <section id="suggestions" className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-500" />
              {t('improvements')}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {data.suggestions.slice(0, 6).map((s) => (
                <Link
                  key={s.slug}
                  href={`/chef-tools/ingredients/${s.slug}`}
                  className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:border-primary/40 transition-colors"
                >
                  {s.image_url && (
                    <Image src={s.image_url} alt={localizedName(s, locale)} width={40} height={40} className="rounded-lg object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">{localizedName(s, locale)}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {s.fills.join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-emerald-500">
                    +{s.score} <ArrowRight className="h-3 w-3" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* INTERNAL LINKS — other recipe analyses                         */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <section id="more" className="space-y-4 border-t pt-8">
          <h2 className="text-lg font-bold">{t('moreRecipes')}</h2>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {RECIPE_TEMPLATES.filter((r) => r.slug !== slug)
              .slice(0, 6)
              .map((r) => {
                const rTitle = (r.title as Record<string, string>)[locale] ?? r.title.en;
                return (
                  <Link
                    key={r.slug}
                    href={`/chef-tools/recipe-analysis/${r.slug}`}
                    className="flex items-center gap-2 p-3 rounded-lg border hover:border-primary/40 transition-colors text-sm"
                  >
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{rTitle.split('—')[0].trim()}</span>
                  </Link>
                );
              })}
          </div>
        </section>

        {/* CTA */}
        <div className="text-center py-6">
          <Link
            href="/chef-tools/lab"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-full hover:opacity-90 transition-opacity"
          >
            <Utensils className="h-4 w-4" />
            {t('analyzeYourRecipe')}
          </Link>
        </div>
      </div>
    </>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────

function MacroCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
  pct,
}: {
  icon: any;
  label: string;
  value: number;
  color: string;
  bg: string;
  pct: number;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-2">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-black">{round1(value)}<span className="text-sm font-normal text-muted-foreground">g</span></p>
      {pct > 0 && (
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div className={`h-full rounded-full ${bg}`} style={{ width: `${Math.min(100, pct)}%` }} />
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, val }: { label: string; val: string | number }) {
  return (
    <div className="rounded-lg bg-muted/30 p-2">
      <p className="font-bold">{val}</p>
      <p className="text-muted-foreground">{label}</p>
    </div>
  );
}

function FlavorBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs w-20 text-right text-muted-foreground">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${barWidth(value, 10)}%` }} />
      </div>
      <span className="text-xs font-mono w-8 text-right">{round1(value)}</span>
    </div>
  );
}

function CatScoreBar({ label, score }: { label: string; score: number }) {
  const color = score >= 90 ? 'bg-green-500' : score >= 70 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="rounded-lg border bg-card p-3 space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-bold">{score}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}
