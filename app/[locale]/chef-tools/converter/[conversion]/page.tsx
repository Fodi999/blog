import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { generateMetadata as genMeta } from '@/lib/metadata';
import { notFound } from 'next/navigation';
import { ChevronRight, ArrowRight } from 'lucide-react';
import { ChefToolsNav } from '../../ChefToolsNav';
import type { Metadata } from 'next';

export const revalidate = 86400;

// ─── Conversion definitions ────────────────────────────────────────────────
// Each key becomes the [conversion] URL segment.
// High-traffic SEO queries: "1 cup flour grams", "tbsp to grams", etc.
export const CONVERSION_MAP: Record<string, {
  from: string;
  to: string;
  fromLong: Record<string, string>;
  toLong: Record<string, string>;
  titles: Record<string, string>;
  descriptions: Record<string, string>;
  popularIngredients: { slug: string; nameEn: string; names: Record<string, string>; result: number }[];
}> = {
  'cup-to-grams': {
    from: 'cup', to: 'g',
    fromLong: { en: 'cup', ru: 'стакан', pl: 'szklanka', uk: 'склянка' },
    toLong:   { en: 'grams', ru: 'граммы', pl: 'gramy', uk: 'грами' },
    titles: {
      en: 'Cup to Grams Converter — How many grams in 1 cup?',
      ru: 'Стакан в граммы — сколько граммов в 1 стакане?',
      pl: 'Szklanka na gramy — ile gramów w 1 szklance?',
      uk: 'Склянка в грами — скільки грамів у 1 склянці?',
    },
    descriptions: {
      en: 'Convert cups to grams for flour, sugar, rice, butter and more. 1 cup of flour = 125g, 1 cup of sugar = 200g. Select your ingredient for exact results.',
      ru: '1 стакан муки = 125г, 1 стакан сахара = 200г, 1 стакан риса = 195г. Точная конвертация стаканов в граммы для любого ингредиента.',
      pl: '1 szklanka mąki = 125g, 1 szklanka cukru = 200g, 1 szklanka ryżu = 195g. Precyzyjne przeliczenie szklanek na gramy dla każdego składnika.',
      uk: '1 склянка борошна = 125г, 1 склянка цукру = 200г, 1 склянка рису = 195г. Точна конвертація склянок у грами для будь-якого інгредієнта.',
    },
    popularIngredients: [
      { slug: 'wheat-flour',  nameEn: 'Wheat Flour', names: { en: 'Flour',  ru: 'Мука',    pl: 'Mąka',   uk: 'Борошно' }, result: 125 },
      { slug: 'sugar',        nameEn: 'Sugar',        names: { en: 'Sugar', ru: 'Сахар',   pl: 'Cukier', uk: 'Цукор'   }, result: 200 },
      { slug: 'rice',         nameEn: 'Rice',         names: { en: 'Rice',  ru: 'Рис',     pl: 'Ryż',    uk: 'Рис'     }, result: 195 },
      { slug: 'butter',       nameEn: 'Butter',       names: { en: 'Butter',ru: 'Масло',   pl: 'Masło',  uk: 'Масло'   }, result: 227 },
      { slug: 'honey',        nameEn: 'Honey',        names: { en: 'Honey', ru: 'Мёд',     pl: 'Miód',   uk: 'Мед'     }, result: 340 },
      { slug: 'olive-oil',    nameEn: 'Olive Oil',    names: { en: 'Olive Oil',ru:'Оливк. масло', pl:'Oliwa', uk:'Оливк. олія'}, result: 216 },
    ],
  },
  'grams-to-cups': {
    from: 'g', to: 'cup',
    fromLong: { en: 'grams', ru: 'граммы', pl: 'gramy', uk: 'грами' },
    toLong:   { en: 'cups', ru: 'стаканы', pl: 'szklanki', uk: 'склянки' },
    titles: {
      en: 'Grams to Cups Converter — How many cups is 100g?',
      ru: 'Граммы в стаканы — сколько стаканов в 100г?',
      pl: 'Gramy na szklanki — ile szklanek w 100g?',
      uk: 'Грами в склянки — скільки склянок у 100г?',
    },
    descriptions: {
      en: 'Convert grams to cups for baking and cooking. 100g flour = 0.8 cup, 200g sugar = 1 cup. Precise results using ingredient density.',
      ru: '100г муки = 0.8 стакана, 200г сахара = 1 стакан. Точный перевод граммов в стаканы с учётом плотности ингредиента.',
      pl: '100g mąki = 0,8 szklanki, 200g cukru = 1 szklanka. Precyzyjne przeliczenie gramów na szklanki z uwzględnieniem gęstości składnika.',
      uk: '100г борошна = 0,8 склянки, 200г цукру = 1 склянка. Точний переклад грамів у склянки з урахуванням густини інгредієнта.',
    },
    popularIngredients: [
      { slug: 'wheat-flour', nameEn: 'Flour',  names: { en: 'Flour', ru: 'Мука',   pl: 'Mąka',   uk: 'Борошно' }, result: 0.8 },
      { slug: 'sugar',       nameEn: 'Sugar',  names: { en: 'Sugar', ru: 'Сахар',  pl: 'Cukier', uk: 'Цукор'   }, result: 0.5 },
      { slug: 'rice',        nameEn: 'Rice',   names: { en: 'Rice',  ru: 'Рис',    pl: 'Ryż',    uk: 'Рис'     }, result: 0.51 },
      { slug: 'butter',      nameEn: 'Butter', names: { en: 'Butter',ru: 'Масло',  pl: 'Masło',  uk: 'Масло'   }, result: 0.44 },
    ],
  },
  'tablespoon-to-grams': {
    from: 'tbsp', to: 'g',
    fromLong: { en: 'tablespoon', ru: 'столовая ложка', pl: 'łyżka stołowa', uk: 'столова ложка' },
    toLong:   { en: 'grams', ru: 'граммы', pl: 'gramy', uk: 'грами' },
    titles: {
      en: 'Tablespoon to Grams — How many grams in 1 tbsp?',
      ru: 'Столовая ложка в граммы — сколько граммов в 1 ст.л.?',
      pl: 'Łyżka stołowa na gramy — ile gramów w 1 łyżce?',
      uk: 'Столова ложка в грами — скільки грамів у 1 ст.л.?',
    },
    descriptions: {
      en: '1 tbsp flour = 8g, 1 tbsp sugar = 12g, 1 tbsp butter = 14g, 1 tbsp olive oil = 13.5g. Convert tablespoons to grams for any ingredient.',
      ru: '1 ст.л. муки = 8г, 1 ст.л. сахара = 12г, 1 ст.л. масла = 14г, 1 ст.л. оливкового масла = 13.5г. Перевод столовых ложек в граммы.',
      pl: '1 łyżka mąki = 8g, 1 łyżka cukru = 12g, 1 łyżka masła = 14g, 1 łyżka oliwy = 13,5g. Przeliczanie łyżek na gramy.',
      uk: '1 ст.л. борошна = 8г, 1 ст.л. цукру = 12г, 1 ст.л. масла = 14г, 1 ст.л. оливкової олії = 13,5г. Переведення столових ложок у грами.',
    },
    popularIngredients: [
      { slug: 'wheat-flour', nameEn: 'Flour',     names: { en: 'Flour',    ru: 'Мука',   pl: 'Mąka',   uk: 'Борошно' }, result: 8 },
      { slug: 'sugar',       nameEn: 'Sugar',     names: { en: 'Sugar',    ru: 'Сахар',  pl: 'Cukier', uk: 'Цукор'   }, result: 12 },
      { slug: 'butter',      nameEn: 'Butter',    names: { en: 'Butter',   ru: 'Масло',  pl: 'Masło',  uk: 'Масло'   }, result: 14 },
      { slug: 'olive-oil',   nameEn: 'Olive Oil', names: { en: 'Olive Oil',ru: 'Оливк. масло', pl: 'Oliwa', uk: 'Оливк. олія'}, result: 13.5 },
      { slug: 'honey',       nameEn: 'Honey',     names: { en: 'Honey',    ru: 'Мёд',    pl: 'Miód',   uk: 'Мед'     }, result: 21 },
      { slug: 'salt',        nameEn: 'Salt',      names: { en: 'Salt',     ru: 'Соль',   pl: 'Sól',    uk: 'Сіль'    }, result: 18 },
    ],
  },
  'teaspoon-to-grams': {
    from: 'tsp', to: 'g',
    fromLong: { en: 'teaspoon', ru: 'чайная ложка', pl: 'łyżeczka', uk: 'чайна ложка' },
    toLong:   { en: 'grams', ru: 'граммы', pl: 'gramy', uk: 'грами' },
    titles: {
      en: 'Teaspoon to Grams — How many grams in 1 tsp?',
      ru: 'Чайная ложка в граммы — сколько граммов в 1 ч.л.?',
      pl: 'Łyżeczka na gramy — ile gramów w 1 łyżeczce?',
      uk: 'Чайна ложка в грами — скільки грамів у 1 ч.л.?',
    },
    descriptions: {
      en: '1 tsp flour = 2.6g, 1 tsp sugar = 4g, 1 tsp salt = 6g, 1 tsp baking powder = 4g. Convert teaspoons to grams for baking.',
      ru: '1 ч.л. муки = 2.6г, 1 ч.л. сахара = 4г, 1 ч.л. соли = 6г, 1 ч.л. разрыхлителя = 4г. Чайные ложки в граммы для выпечки.',
      pl: '1 łyżeczka mąki = 2,6g, 1 łyżeczka cukru = 4g, 1 łyżeczka soli = 6g, 1 łyżeczka proszku do pieczenia = 4g.',
      uk: '1 ч.л. борошна = 2,6г, 1 ч.л. цукру = 4г, 1 ч.л. солі = 6г, 1 ч.л. розпушувача = 4г.',
    },
    popularIngredients: [
      { slug: 'wheat-flour',   nameEn: 'Flour',          names: { en: 'Flour',         ru: 'Мука',          pl: 'Mąka',              uk: 'Борошно'     }, result: 2.6 },
      { slug: 'sugar',         nameEn: 'Sugar',          names: { en: 'Sugar',         ru: 'Сахар',         pl: 'Cukier',            uk: 'Цукор'       }, result: 4 },
      { slug: 'baking-powder', nameEn: 'Baking Powder',  names: { en: 'Baking Powder', ru: 'Разрыхлитель',  pl: 'Proszek do pieczenia', uk: 'Розпушувач' }, result: 4 },
      { slug: 'cinnamon',      nameEn: 'Cinnamon',       names: { en: 'Cinnamon',      ru: 'Корица',        pl: 'Cynamon',           uk: 'Кориця'      }, result: 2.6 },
    ],
  },
  'oz-to-grams': {
    from: 'oz', to: 'g',
    fromLong: { en: 'ounce', ru: 'унция', pl: 'uncja', uk: 'унція' },
    toLong:   { en: 'grams', ru: 'граммы', pl: 'gramy', uk: 'грами' },
    titles: {
      en: 'Ounces to Grams Converter — oz to g',
      ru: 'Унции в граммы — конвертер oz в г',
      pl: 'Uncje na gramy — przelicznik oz na g',
      uk: 'Унції в грами — конвертер oz у г',
    },
    descriptions: {
      en: '1 oz = 28.35g. Convert ounces to grams for any food ingredient. Quick reference: 4 oz = 113g, 8 oz = 227g, 16 oz = 454g.',
      ru: '1 унция = 28.35г. Перевод унций в граммы для любого продукта. Быстрая таблица: 4 унц. = 113г, 8 унц. = 227г, 16 унц. = 454г.',
      pl: '1 uncja = 28,35g. Przeliczenie uncji na gramy dla dowolnego produktu. 4 oz = 113g, 8 oz = 227g, 16 oz = 454g.',
      uk: '1 унція = 28,35г. Переведення унцій у грами для будь-якого продукту. 4 унц. = 113г, 8 унц. = 227г, 16 унц. = 454г.',
    },
    popularIngredients: [
      { slug: 'beef',    nameEn: 'Beef',    names: { en: 'Beef',    ru: 'Говядина', pl: 'Wołowina', uk: 'Яловичина' }, result: 28.35 },
      { slug: 'chicken-breast', nameEn: 'Chicken', names: { en: 'Chicken', ru: 'Курица', pl: 'Kurczak', uk: 'Курка' }, result: 28.35 },
      { slug: 'butter',  nameEn: 'Butter',  names: { en: 'Butter',  ru: 'Масло',    pl: 'Masło',    uk: 'Масло'     }, result: 28.35 },
      { slug: 'wheat-flour', nameEn: 'Flour', names: { en: 'Flour', ru: 'Мука',    pl: 'Mąka',    uk: 'Борошно'   }, result: 28.35 },
    ],
  },
  'grams-to-oz': {
    from: 'g', to: 'oz',
    fromLong: { en: 'grams', ru: 'граммы', pl: 'gramy', uk: 'грами' },
    toLong:   { en: 'ounces', ru: 'унции', pl: 'uncje', uk: 'унції' },
    titles: {
      en: 'Grams to Ounces Converter — g to oz',
      ru: 'Граммы в унции — конвертер г в oz',
      pl: 'Gramy na uncje — przelicznik g na oz',
      uk: 'Грами в унції — конвертер г у oz',
    },
    descriptions: {
      en: '1g = 0.035 oz. Convert grams to ounces for recipes. Quick table: 100g = 3.53 oz, 250g = 8.82 oz, 500g = 17.64 oz.',
      ru: '1г = 0.035 унц. Перевод граммов в унции для рецептов. Таблица: 100г = 3.53 унц., 250г = 8.82 унц., 500г = 17.64 унц.',
      pl: '1g = 0,035 oz. Przeliczenie gramów na uncje. Tabela: 100g = 3,53 oz, 250g = 8,82 oz, 500g = 17,64 oz.',
      uk: '1г = 0,035 унц. Переведення грамів у унції. Таблиця: 100г = 3,53 унц., 250г = 8,82 унц., 500г = 17,64 унц.',
    },
    popularIngredients: [
      { slug: 'wheat-flour', nameEn: 'Flour',   names: { en: 'Flour',   ru: 'Мука',   pl: 'Mąka',   uk: 'Борошно' }, result: 3.53 },
      { slug: 'sugar',       nameEn: 'Sugar',   names: { en: 'Sugar',   ru: 'Сахар',  pl: 'Cukier', uk: 'Цукор'   }, result: 3.53 },
      { slug: 'butter',      nameEn: 'Butter',  names: { en: 'Butter',  ru: 'Масло',  pl: 'Masło',  uk: 'Масло'   }, result: 3.53 },
      { slug: 'beef',        nameEn: 'Beef',    names: { en: 'Beef',    ru: 'Говядина', pl: 'Wołowina', uk: 'Яловичина' }, result: 3.53 },
    ],
  },
};

// Static quick-reference tables for oz↔g (no API needed)
const OZ_TO_G_TABLE = [1, 2, 3, 4, 6, 8, 12, 16].map((oz) => ({ oz, g: Math.round(oz * 28.3495) }));
const G_TO_OZ_TABLE = [25, 50, 100, 150, 200, 250, 500, 1000].map((g) => ({ g, oz: parseFloat((g / 28.3495).toFixed(2)) }));

export async function generateStaticParams() {
  const locales = ['pl', 'en', 'ru', 'uk'];
  const conversions = Object.keys(CONVERSION_MAP);
  return locales.flatMap((locale) => conversions.map((conversion) => ({ locale, conversion })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; conversion: string }>;
}): Promise<Metadata> {
  const { locale, conversion } = await params;
  setRequestLocale(locale);
  const conv = CONVERSION_MAP[conversion];
  if (!conv) return {};
  return genMeta({
    title: conv.titles[locale] ?? conv.titles.en,
    description: conv.descriptions[locale] ?? conv.descriptions.en,
    locale: locale as 'pl' | 'en' | 'ru' | 'uk',
    path: `/chef-tools/converter/${conversion}`,
  });
}

export default async function ConversionSeoPage({
  params,
}: {
  params: Promise<{ locale: string; conversion: string }>;
}) {
  const { locale, conversion } = await params;
  setRequestLocale(locale);
  const conv = CONVERSION_MAP[conversion];
  if (!conv) notFound();

  const t = await getTranslations({ locale, namespace: 'chefTools' });

  const title = conv.titles[locale] ?? conv.titles.en;
  const description = conv.descriptions[locale] ?? conv.descriptions.en;
  const fromUnit = conv.fromLong[locale] ?? conv.fromLong.en;
  const toUnit = conv.toLong[locale] ?? conv.toLong.en;

  // All conversion slugs for cross-linking
  const allConversions = Object.entries(CONVERSION_MAP);

  // Quick reference table for oz↔g
  const isOzToG = conversion === 'oz-to-grams';
  const isGToOz = conversion === 'grams-to-oz';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
      <ChefToolsNav
        locale={locale}
        translations={{
          back: t('back'),
          tabs: { tools: t('tabs.tools'), tables: t('tabs.tables'), products: t('tabs.products') },
          tools: {
            converter: { title: t('tools.converter.title') },
            fishSeason: { title: t('tools.fishSeason.title') },
            ingredientAnalyzer: { title: t('tools.ingredientAnalyzer.title') },
            ingredientsCatalog: { title: t('ingredients.catalog.title') },
            lab: { title: t('tools.lab.title') },
            recipeAnalyzer: { title: t('tools.recipeAnalyzer.title') },
            flavorPairing: { title: t('tools.flavorPairing.title') },
            nutrition: { title: t('nutrition.title') },
          },
        }}
      />

      <div className="mb-12 border-t border-primary/20 pt-10 space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
          <Link href="/chef-tools" className="hover:text-foreground transition-colors">Chef Tools</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/chef-tools/converter" className="hover:text-foreground transition-colors">
            {t('tools.converter.title')}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{fromUnit} → {toUnit}</span>
        </div>

        {/* Hero */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-foreground uppercase italic leading-tight mb-3">
            {conv.fromLong[locale] ?? conv.fromLong.en}
            <span className="text-primary mx-2">→</span>
            {conv.toLong[locale] ?? conv.toLong.en}
            <span className="text-primary">.</span>
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl border-l-2 border-primary/30 pl-4">
            {description}
          </p>
        </div>

        {/* Popular ingredients quick-reference */}
        <div className="border border-border/60 rounded-2xl p-5">
          <h2 className="text-sm font-black uppercase tracking-widest text-foreground mb-4">
            {locale === 'ru' ? '📋 Популярные ингредиенты' : locale === 'pl' ? '📋 Popularne składniki' : locale === 'uk' ? '📋 Популярні інгредієнти' : '📋 Popular Ingredients'}
          </h2>
          <div className="divide-y divide-border/40">
            {conv.popularIngredients.map((ing) => {
              const ingName = ing.names[locale] ?? ing.nameEn;
              const resultLabel = ing.result < 1
                ? ing.result.toFixed(2).replace(/\.?0+$/, '')
                : String(ing.result);
              return (
                <div key={ing.slug} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/chef-tools/ingredients/${ing.slug}` as never}
                      className="text-sm font-black text-foreground hover:text-primary transition-colors"
                    >
                      {ingName}
                    </Link>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground font-bold">1 {fromUnit}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                    <span className="font-black text-primary">{resultLabel} {conv.to}</span>
                    <Link
                      href={`/chef-tools/converter?ingredient=${ing.slug}&from=${conv.from}&to=${conv.to}` as never}
                      className="ml-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors border border-border/40 rounded-full px-2 py-0.5 hover:border-primary/30"
                    >
                      {locale === 'ru' ? 'Открыть' : locale === 'pl' ? 'Otwórz' : locale === 'uk' ? 'Відкрити' : 'Open'}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Static oz↔g quick reference table */}
        {(isOzToG || isGToOz) && (
          <div className="border border-border/60 rounded-2xl p-5">
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground mb-4">
              {isOzToG
                ? (locale === 'ru' ? '⚖ Таблица: oz → г' : locale === 'pl' ? '⚖ Tabela: oz → g' : '⚖ Table: oz → g')
                : (locale === 'ru' ? '⚖ Таблица: г → oz' : locale === 'pl' ? '⚖ Tabela: g → oz' : '⚖ Table: g → oz')}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(isOzToG ? OZ_TO_G_TABLE : G_TO_OZ_TABLE).map((row) => (
                <div key={isOzToG ? (row as {oz:number;g:number}).oz : (row as {g:number;oz:number}).g}
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted/30 border border-border/30 text-sm">
                  <span className="font-bold text-muted-foreground">
                    {isOzToG ? `${(row as {oz:number;g:number}).oz} oz` : `${(row as {g:number;oz:number}).g} g`}
                  </span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground/30" />
                  <span className="font-black text-foreground">
                    {isOzToG ? `${(row as {oz:number;g:number}).g} g` : `${(row as {g:number;oz:number}).oz} oz`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA: open full converter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 rounded-2xl border-2 border-primary/20 bg-primary/5">
          <div className="flex-1">
            <p className="font-black text-foreground text-sm">
              {locale === 'ru' ? 'Нужна другая величина или ингредиент?' :
               locale === 'pl' ? 'Potrzebujesz innej wartości lub składnika?' :
               locale === 'uk' ? 'Потрібна інша величина або інгредієнт?' :
               'Need a different amount or ingredient?'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {locale === 'ru' ? 'Откройте интерактивный конвертер с выбором ингредиента' :
               locale === 'pl' ? 'Otwórz interaktywny przelicznik z wyborem składnika' :
               locale === 'uk' ? 'Відкрийте інтерактивний конвертер з вибором інгредієнта' :
               'Open the interactive converter with ingredient selection'}
            </p>
          </div>
          <Link
            href={`/chef-tools/converter` as never}
            className="shrink-0 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-black uppercase tracking-widest hover:bg-primary/90 transition-colors"
          >
            {locale === 'ru' ? 'Открыть конвертер' : locale === 'pl' ? 'Otwórz przelicznik' : locale === 'uk' ? 'Відкрити конвертер' : 'Open Converter'}
          </Link>
        </div>

        {/* Cross-links to other conversions */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">
            {locale === 'ru' ? 'Другие конвертации' : locale === 'pl' ? 'Inne przeliczniki' : locale === 'uk' ? 'Інші конвертації' : 'More conversions'}
          </p>
          <div className="flex flex-wrap gap-2">
            {allConversions
              .filter(([slug]) => slug !== conversion)
              .map(([slug, c]) => (
                <Link
                  key={slug}
                  href={`/chef-tools/converter/${slug}` as never}
                  className="px-3 py-1.5 rounded-full text-xs font-bold border border-border/50 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                >
                  {c.fromLong[locale] ?? c.fromLong.en} → {c.toLong[locale] ?? c.toLong.en}
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
