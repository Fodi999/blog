import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { ChefToolsNav } from '../../ChefToolsNav';
import { JsonLd } from '@/components/JsonLd';

export const revalidate = 86400;

// ─── Category slug → display data ────────────────────────────────────────────
export const CATEGORY_MAP: Record<string, {
  nameEn: string;
  names: Record<string, string>;
  descriptions: Record<string, string>;
  apiFilter: string; // matches category_name_en from backend
  emoji: string;
}> = {
  fish:        {
    nameEn: 'Fish & Seafood',
    names:        { en: 'Fish & Seafood', ru: 'Рыба и морепродукты', pl: 'Ryby i owoce morza', uk: 'Риба та морепродукти' },
    descriptions: {
      en: 'Nutritional profiles and kitchen conversions for fish and seafood. Calories, protein, fat and minerals per 100g.',
      ru: 'Пищевая ценность и конвертация мер для рыбы и морепродуктов. Калории, белки, жиры и минералы на 100г.',
      pl: 'Wartości odżywcze i przeliczniki dla ryb i owoców morza. Kalorie, białko, tłuszcz i minerały na 100g.',
      uk: 'Харчова цінність та конвертація мір для риби та морепродуктів. Калорії, білки, жири та мінерали на 100г.',
    },
    apiFilter: 'Fish & Seafood',
    emoji: '🐟',
  },
  vegetables:  {
    nameEn: 'Vegetables',
    names:        { en: 'Vegetables', ru: 'Овощи', pl: 'Warzywa', uk: 'Овочі' },
    descriptions: {
      en: 'Complete nutrition data for fresh vegetables — calories, vitamins, minerals and kitchen measures.',
      ru: 'Полные данные о питательной ценности свежих овощей — калории, витамины, минералы и кухонные меры.',
      pl: 'Kompletne dane odżywcze dla warzyw — kalorie, witaminy, minerały i miary kuchenne.',
      uk: 'Повні дані про харчову цінність свіжих овочів — калорії, вітаміни, мінерали та кухонні міри.',
    },
    apiFilter: 'Vegetables',
    emoji: '🥦',
  },
  fruits:      {
    nameEn: 'Fruits',
    names:        { en: 'Fruits', ru: 'Фрукты', pl: 'Owoce', uk: 'Фрукти' },
    descriptions: {
      en: 'Nutrition facts for fresh fruits — calories, natural sugars, vitamins and antioxidants per 100g.',
      ru: 'Пищевая ценность свежих фруктов — калории, сахара, витамины и антиоксиданты на 100г.',
      pl: 'Wartości odżywcze świeżych owoców — kalorie, cukry, witaminy i antyoksydanty na 100g.',
      uk: 'Харчова цінність свіжих фруктів — калорії, цукри, вітаміни та антиоксиданти на 100г.',
    },
    apiFilter: 'Fruits',
    emoji: '🍎',
  },
  meat:        {
    nameEn: 'Meat & Poultry',
    names:        { en: 'Meat & Poultry', ru: 'Мясо и птица', pl: 'Mięso i drób', uk: "М'ясо та птиця" },
    descriptions: {
      en: 'Protein, fat and calorie content for meat and poultry. Kitchen weights: grams per cup, tbsp, tsp.',
      ru: 'Белки, жиры и калорийность мяса и птицы. Кухонные меры: граммы на стакан, ст.л., ч.л.',
      pl: 'Białko, tłuszcz i kalorie mięsa i drobiu. Miary kuchenne: gramy na szklankę, łyżkę, łyżeczkę.',
      uk: "Білки, жири та калорійність м'яса та птиці. Кухонні міри: грами на склянку, ст.л., ч.л.",
    },
    apiFilter: 'Meat & Poultry',
    emoji: '🥩',
  },
  spices:      {
    nameEn: 'Spices & Herbs',
    names:        { en: 'Spices & Herbs', ru: 'Специи и травы', pl: 'Przyprawy i zioła', uk: 'Спеції та трави' },
    descriptions: {
      en: 'Culinary profiles for spices and herbs — flavor intensity, typical measures and nutrition per 100g.',
      ru: 'Кулинарные профили специй и трав — интенсивность вкуса, типичные меры и питательная ценность на 100г.',
      pl: 'Profile kulinarne przypraw i ziół — intensywność smaku, typowe miary i wartości odżywcze na 100g.',
      uk: 'Кулінарні профілі спецій та трав — інтенсивність смаку, типові міри та харчова цінність на 100г.',
    },
    apiFilter: 'Spices & Herbs',
    emoji: '🌿',
  },
  dairy:       {
    nameEn: 'Dairy & Eggs',
    names:        { en: 'Dairy & Eggs', ru: 'Молочные продукты и яйца', pl: 'Nabiał i jaja', uk: 'Молочні продукти та яйця' },
    descriptions: {
      en: 'Nutrition data for dairy products and eggs — calories, protein, fat and calcium content per 100g.',
      ru: 'Данные о питательной ценности молочных продуктов и яиц — калории, белки, жиры и кальций на 100г.',
      pl: 'Dane odżywcze dla nabiału i jaj — kalorie, białko, tłuszcz i zawartość wapnia na 100g.',
      uk: 'Дані про харчову цінність молочних продуктів та яєць — калорії, білки, жири та кальцій на 100г.',
    },
    apiFilter: 'Dairy & Eggs',
    emoji: '🥛',
  },
  grains:      {
    nameEn: 'Grains & Pasta',
    names:        { en: 'Grains & Pasta', ru: 'Крупы и макароны', pl: 'Zboża i makarony', uk: 'Крупи та макарони' },
    descriptions: {
      en: 'Calories, carbs and protein for grains and pasta. How many grams in a cup of rice, buckwheat, oats?',
      ru: 'Калории, углеводы и белки для круп и макарон. Сколько граммов в стакане риса, гречки, овсянки?',
      pl: 'Kalorie, węglowodany i białko zbóż i makaronów. Ile gramów w szklance ryżu, kaszy gryczanej, owsianki?',
      uk: 'Калорії, вуглеводи та білки круп та макаронів. Скільки грамів у склянці рису, гречки, вівсянки?',
    },
    apiFilter: 'Grains & Pasta',
    emoji: '🌾',
  },
  nuts:        {
    nameEn: 'Nuts & Seeds',
    names:        { en: 'Nuts & Seeds', ru: 'Орехи и семена', pl: 'Orzechy i nasiona', uk: 'Горіхи та насіння' },
    descriptions: {
      en: 'Healthy fats, protein and calorie content for nuts and seeds per 100g with kitchen measures.',
      ru: 'Здоровые жиры, белки и калорийность орехов и семян на 100г с кухонными мерами.',
      pl: 'Zdrowe tłuszcze, białko i kaloryczność orzechów i nasion na 100g z miarami kuchennymi.',
      uk: 'Здорові жири, білки та калорійність горіхів та насіння на 100г з кухонними мірами.',
    },
    apiFilter: 'Nuts & Seeds',
    emoji: '🥜',
  },
  oils:        {
    nameEn: 'Oils & Fats',
    names:        { en: 'Oils & Fats', ru: 'Масла и жиры', pl: 'Oleje i tłuszcze', uk: 'Олії та жири' },
    descriptions: {
      en: 'Calorie and fat content for cooking oils and fats. How many grams in 1 tablespoon of olive oil, butter?',
      ru: 'Калорийность и жиры кулинарных масел. Сколько граммов в 1 ст.л. оливкового масла, сливочного масла?',
      pl: 'Kaloryczność i tłuszcz olejów kuchennych. Ile gramów w 1 łyżce oliwy z oliwek, masła?',
      uk: 'Калорійність та жири кулінарних олій. Скільки грамів у 1 ст.л. оливкової олії, вершкового масла?',
    },
    apiFilter: 'Oils & Fats',
    emoji: '🫒',
  },
  legumes:     {
    nameEn: 'Legumes',
    names:        { en: 'Legumes', ru: 'Бобовые', pl: 'Rośliny strączkowe', uk: 'Бобові' },
    descriptions: {
      en: 'Protein and fiber content for legumes — beans, lentils, chickpeas and their kitchen conversions.',
      ru: 'Белки и клетчатка бобовых — фасоль, чечевица, нут и их конвертации в кухонных мерах.',
      pl: 'Białko i błonnik roślin strączkowych — fasola, soczewica, ciecierzyca i ich przeliczniki kuchenne.',
      uk: 'Білки та клітковина бобових — квасоля, сочевиця, нут та їх конвертації в кухонних мірах.',
    },
    apiFilter: 'Legumes',
    emoji: '🫘',
  },
  condiments:  {
    nameEn: 'Condiments & Sauces',
    names:        { en: 'Condiments & Sauces', ru: 'Соусы и приправы', pl: 'Sosy i przyprawy', uk: 'Соуси та приправи' },
    descriptions: {
      en: 'Sugar, fat and calorie content for sauces and condiments — ketchup, honey, mayonnaise and more.',
      ru: 'Сахар, жиры и калорийность соусов и приправ — кетчуп, мёд, майонез и другие.',
      pl: 'Cukier, tłuszcz i kaloryczność sosów i przypraw — ketchup, miód, majonez i inne.',
      uk: 'Цукор, жири та калорійність соусів та приправ — кетчуп, мед, майонез та інші.',
    },
    apiFilter: 'Condiments & Sauces',
    emoji: '🍯',
  },
};

type ApiListItem = {
  slug: string;
  name_en: string;
  name_ru?: string;
  name_pl?: string;
  name_uk?: string;
  image_url?: string | null;
  category_name_en?: string;
  calories_per_100g?: number;
};

function localizedName(item: ApiListItem, locale: string): string {
  if (locale === 'pl' && item.name_pl) return item.name_pl;
  if (locale === 'ru' && item.name_ru) return item.name_ru;
  if (locale === 'uk' && item.name_uk) return item.name_uk;
  return item.name_en;
}

async function fetchCategoryIngredients(categoryNameEn: string): Promise<ApiListItem[]> {
  try {
    const res = await fetch(
      'https://ministerial-yetta-fodi999-c58d8823.koyeb.app/public/ingredients?limit=200',
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return [];
    const data = await res.json() as { items: ApiListItem[] };
    return data.items.filter((i) => i.category_name_en === categoryNameEn);
  } catch {
    return [];
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}) {
  const { locale, category } = await params;
  const cat = CATEGORY_MAP[category];
  if (!cat) notFound();

  const [items, t] = await Promise.all([
    fetchCategoryIngredients(cat.apiFilter),
    getTranslations({ locale, namespace: 'chefTools' }),
  ]);

  const name = cat.names[locale] ?? cat.nameEn;
  const description = cat.descriptions[locale] ?? cat.descriptions.en;

  // All category slugs for the sidebar navigation
  const allCategories = Object.entries(CATEGORY_MAP);

  /* ── CollectionPage + ItemList JSON-LD ── */
  const BASE_URL = 'https://dima-fomin.pl';
  const collectionLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url: `${BASE_URL}/${locale}/chef-tools/ingredients/${category}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: items.length,
      itemListElement: items.map((item, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: localizedName(item, locale),
        url: `${BASE_URL}/${locale}/chef-tools/ingredients/${item.slug}`,
        ...(item.image_url && { image: item.image_url }),
      })),
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
      <JsonLd data={collectionLd} />
      <ChefToolsNav
        locale={locale}
        translations={{
          back: t('back'),
          tabs: {
            tools: t('tabs.tools'),
            tables: t('tabs.tables'),
            products: t('tabs.products'),
          },
          tools: {
            converter: { title: t('tools.converter.title') },
            fishSeason: { title: t('tools.fishSeason.title') },
            ingredientAnalyzer: { title: t('tools.ingredientAnalyzer.title') },
            ingredientsCatalog: { title: t('ingredients.catalog.title') },
          },
        }}
      />

      <div className="mb-12 border-t border-primary/20 pt-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-6">
          <Link href="/chef-tools" className="hover:text-foreground transition-colors">Chef Tools</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/chef-tools/ingredients" className="hover:text-foreground transition-colors">
            {t('ingredients.catalog.title')}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">

          {/* ── Sidebar: category navigation ── */}
          <aside className="hidden lg:block">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">
              {locale === 'ru' ? 'Категории' : locale === 'pl' ? 'Kategorie' : locale === 'uk' ? 'Категорії' : 'Categories'}
            </p>
            <nav className="space-y-1">
              {allCategories.map(([slug, c]) => (
                <Link
                  key={slug}
                  href={`/chef-tools/ingredients/${slug}` as never}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-colors ${
                    slug === category
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <span>{c.emoji}</span>
                  <span className="truncate">{c.names[locale] ?? c.nameEn}</span>
                </Link>
              ))}
              <Link
                href="/chef-tools/ingredients"
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mt-2 border-t border-border/40 pt-3"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                {locale === 'ru' ? 'Все ингредиенты' : locale === 'pl' ? 'Wszystkie' : locale === 'uk' ? 'Всі' : 'All ingredients'}
              </Link>
            </nav>
          </aside>

          {/* ── Main content ── */}
          <main>
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">{cat.emoji}</span>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-foreground uppercase italic">
                  {name}<span className="text-primary">.</span>
                </h1>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl border-l-2 border-primary/30 pl-4">
                {description}
              </p>
              <p className="text-xs text-muted-foreground/60 font-bold uppercase tracking-wider mt-3">
                {items.length} {locale === 'ru' ? 'ингредиентов' : locale === 'pl' ? 'składników' : locale === 'uk' ? 'інгредієнтів' : 'ingredients'}
              </p>
            </div>

            {/* Mobile category pills */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6 lg:hidden scrollbar-hide">
              {allCategories.map(([slug, c]) => (
                <Link
                  key={slug}
                  href={`/chef-tools/ingredients/${slug}` as never}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                    slug === category
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border/50 text-muted-foreground hover:border-primary/40 hover:text-primary'
                  }`}
                >
                  {c.emoji} {c.names[locale] ?? c.nameEn}
                </Link>
              ))}
            </div>

            {/* Ingredients grid */}
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground py-12 text-center">
                {locale === 'ru' ? 'Ингредиенты не найдены' : locale === 'pl' ? 'Brak składników' : locale === 'uk' ? 'Інгредієнти не знайдено' : 'No ingredients found'}
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {items.map((item) => {
                  const iname = localizedName(item, locale);
                  return (
                    <Link
                      key={item.slug}
                      href={`/chef-tools/ingredients/${item.slug}` as never}
                      className="group flex flex-col items-center gap-2 p-3 rounded-2xl border border-border/50 bg-background hover:border-primary/40 hover:bg-primary/5 hover:shadow-md transition-all"
                    >
                      <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-muted border border-border/30">
                        {item.image_url ? (
                          <Image
                            src={item.image_url}
                            alt={iname}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-8 w-8 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <div className="text-center w-full">
                        <p className="text-xs font-black text-foreground group-hover:text-primary transition-colors truncate">
                          {iname}
                        </p>
                        {item.calories_per_100g != null && (
                          <p className="text-[10px] text-muted-foreground font-bold mt-0.5">
                            {item.calories_per_100g} kcal
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* SEO internal links to converter */}
            <div className="mt-10 p-5 rounded-2xl border border-border/50 bg-muted/20">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">
                {locale === 'ru' ? '🔄 Конвертер мер' : locale === 'pl' ? '🔄 Przelicznik miar' : locale === 'uk' ? '🔄 Конвертер мір' : '🔄 Unit Converter'}
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { href: '/chef-tools/converter', label: locale === 'ru' ? 'Конвертер ингредиентов' : locale === 'pl' ? 'Przelicznik składników' : locale === 'uk' ? 'Конвертер інгредієнтів' : 'Ingredient Converter' },
                  { href: '/chef-tools/converter?from=cup&to=g', label: locale === 'ru' ? 'Стакан → Граммы' : 'Cup → Grams' },
                  { href: '/chef-tools/converter?from=tbsp&to=g', label: locale === 'ru' ? 'Ст.л. → Граммы' : 'Tbsp → Grams' },
                  { href: '/chef-tools/converter?from=oz&to=g', label: locale === 'ru' ? 'Унц. → Граммы' : 'Oz → Grams' },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href as never}
                    className="px-3 py-1.5 rounded-full text-xs font-bold border border-border/50 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
