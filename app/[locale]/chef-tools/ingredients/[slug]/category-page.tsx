import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { 
  ChevronLeft, ChevronRight, Package, Fish, Leaf, Apple, Flame, 
  Sprout, Droplets, Wheat, Orbit, Droplet, CircleDot, Waves,
  Search, LayoutGrid, ArrowRight
} from 'lucide-react';
import { ChefToolsNav } from '../../ChefToolsNav';
import { JsonLd } from '@/components/JsonLd';
import { cn } from '@/lib/utils';

export const revalidate = 86400;

// ─── Category slug → display data ────────────────────────────────────────────
export const CATEGORY_MAP: Record<string, {
  nameEn: string;
  names: Record<string, string>;
  descriptions: Record<string, string>;
  apiFilter: string; // matches category_name_en from backend
  icon: React.ElementType;
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
    icon: Fish,
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
    icon: Leaf,
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
    icon: Apple,
  },
  meat:        {
    nameEn: 'Meat & Poultry',
    names:        { en: 'Meat & Poultry', ru: 'Мясо и птица', pl: 'Mięso i drób', uk: "М'ясо та птиця" },
    descriptions: {
      en: 'Protein, fat and calorie content for meat and poultry. Kitchen weights: grams per cup, tbsp, tsp.',
      ru: 'Белки, жиры и калорийность мяса и птицы. Кухонные меры: граммы на стакан, ст.л., ч.л.',
      pl: 'Białko, tłuszcz и kalorie mięsa и drobiu. Miary kuchenne: gramy na szklankę, łyżkę, łyżeczkę.',
      uk: "Білки, жири та калорійність мяса та птиці. Кухонні міри: грами на склянку, ст.л., ч.л.",
    },
    apiFilter: 'Meat & Poultry',
    icon: Flame,
  },
  spices:      {
    nameEn: 'Spices & Herbs',
    names:        { en: 'Spices & Herbs', ru: 'Специи и травы', pl: 'Przyprawy i zioła', uk: 'Спеції та трави' },
    descriptions: {
      en: 'Culinary profiles for spices and herbs — flavor intensity, typical measures and nutrition per 100g.',
      ru: 'Кулинарные профили специй и трав — интенсивность вкуса, типичные меры и питательная ценность на 100г.',
      pl: 'Profile kulinarne przypraw i ziół — intensywność smaku, typowe miary i wartości odżywcze na 100g.',
      uk: 'Кулінарні профілі спецій та трав — інтенсивність вкусу, типові міри та харчова цінність на 100г.',
    },
    apiFilter: 'Spices & Herbs',
    icon: Sprout,
  },
  dairy:       {
    nameEn: 'Dairy & Eggs',
    names:        { en: 'Dairy & Eggs', ru: 'Молочные продукты и яйца', pl: 'Nabiał i jaja', uk: 'Молочні продукты та яйця' },
    descriptions: {
      en: 'Nutrition data for dairy products and eggs — calories, protein, fat and calcium content per 100g.',
      ru: 'Данные о питательной ценности молочных продуктов и яиц — калории, белки, жиры и кальций на 100г.',
      pl: 'Dane odżywcze dla nabiału i jaj — kalorie, białko, tłuszcz i zawartość wapnia na 100g.',
      uk: 'Дані про харчову цінність молочних продуктів та яєць — калорії, білки, жири та кальцій на 100г.',
    },
    apiFilter: 'Dairy & Eggs',
    icon: Droplets,
  },
  grains:      {
    nameEn: 'Grains & Pasta',
    names:        { en: 'Grains & Pasta', ru: 'Крупы и макароны', pl: 'Zboża i makarony', uk: 'Крупи та макарони' },
    descriptions: {
      en: 'Calories, carbs and protein for grains and pasta. How many grams in a cup of rice, buckwheat, oats?',
      ru: 'Калории, углеводы и белки для круп и макарон. Сколько граммов в стакане риса, гречки, овсянки?',
      pl: 'Kalorie, węglowodany и białko zbóż и makaronów. Ile gramów w szklance ryżu, kaszy gryчanej, owsianki?',
      uk: 'Калорії, вуглеводи та білки круп та макаронів. Скільки грамів у склянці рису, гречки, вівсянки?',
    },
    apiFilter: 'Grains & Pasta',
    icon: Wheat,
  },
  nuts:        {
    nameEn: 'Nuts & Seeds',
    names:        { en: 'Nuts & Seeds', ru: 'Орехи и семена', pl: 'Orzechy i nasiona', uk: 'Горіхи та насіння' },
    descriptions: {
      en: 'Healthy fats, protein and calorie content for nuts and seeds per 100g with kitchen measures.',
      ru: 'Здоровые жиры, белки и калорийность орехов и семян на 100г с кухонными мерами.',
      pl: 'Zdrowe tłuszcze, белки и калорийность orzechów и nasion na 100g z miрами kuchenными.',
      uk: 'Здорові жири, білки та калорійність горіхів та насіння на 100г з кухоними мірами.',
    },
    apiFilter: 'Nuts & Seeds',
    icon: Orbit,
  },
  oils:        {
    nameEn: 'Oils & Fats',
    names:        { en: 'Oils & Fats', ru: 'Масла и жиры', pl: 'Oleje i tłuszcze', uk: 'Олії та жири' },
    descriptions: {
      en: 'Calorie and fat content for cooking oils and fats. How many grams in 1 tablespoon of olive oil, butter?',
      ru: 'Калорийность и жиры кулинарных масел. Сколько граммов в 1 ст.л. оливкового масла, сливочного масла?',
      pl: 'Kaloryczność и жиры олейов кученных. Ile gramów в 1 łyżce oliwy z oliwek, masła?',
      uk: 'Калорійність та жири кулінарних олій. Скільки грамів у 1 ст.л. оливкової олії, вершкового масла?',
    },
    apiFilter: 'Oils & Fats',
    icon: Droplet,
  },
  legumes:     {
    nameEn: 'Legumes',
    names:        { en: 'Legumes', ru: 'Бобовые', pl: 'Rośliny strączkowe', uk: 'Бобові' },
    descriptions: {
      en: 'Protein and fiber content for legumes — beans, lentils, chickpeas and their kitchen conversions.',
      ru: 'Белки и клетчатка бобовых — фасоль, чечевица, нут и их конвертации в кухонных мерах.',
      pl: 'Белки и клетчатка рослн странчковых — фасола, сочевица, цецерчыца и их przeliczniki kuchenne.',
      uk: 'Білки та клітковина бобових — квасоля, сочевиця, нут та їх конвертації в кухонних мірах.',
    },
    apiFilter: 'Legumes',
    icon: CircleDot,
  },
  condiments:  {
    nameEn: 'Condiments & Sauces',
    names:        { en: 'Condiments & Sauces', ru: 'Соусы и приправы', pl: 'Sosy i przyprawy', uk: 'Соуси та приправи' },
    descriptions: {
      en: 'Sugar, fat and calorie content for sauces and condiments — ketchup, honey, mayonnaise and more.',
      ru: 'Сахар, жиры и калорийность соусов и приправ — кетчуп, мёд, майонез и другие.',
      pl: 'Cukier, tłuszcz и калорийность сосоув и прыправ — кетчуп, миод, майонез и инне.',
      uk: 'Цукор, жири та калорійність соусів та приправ — кетчуп, мед, майонез та інші.',
    },
    apiFilter: 'Condiments & Sauces',
    icon: Waves,
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
  const CategoryIcon = cat.icon;
  const allCategories = Object.entries(CATEGORY_MAP);

  const collectionLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url: `https://dima-fomin.pl/${locale}/chef-tools/ingredients/${category}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: items.length,
      itemListElement: items.map((item, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: localizedName(item, locale),
        url: `https://dima-fomin.pl/${locale}/chef-tools/ingredients/${item.slug}`,
        ...(item.image_url && { image: item.image_url }),
      })),
    },
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground transition-colors duration-500 overflow-hidden pt-12">
      {/* ── Background Mesh & Glows ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] animate-pulse-slow dark:opacity-100 opacity-30" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px] animate-pulse-slow delay-700 dark:opacity-100 opacity-20" />
      </div>

      <JsonLd data={collectionLd} />
      
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
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

        <div className="mt-8 sm:mt-12 mb-10 sm:mb-16 border-t border-border/50 dark:border-white/5 pt-8 sm:pt-12">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-6 sm:mb-8 italic overflow-x-auto scrollbar-hide">
            <Link href="/chef-tools" className="hover:text-primary transition-colors shrink-0">Chef Tools</Link>
            <ChevronRight className="h-3 w-3 opacity-30 shrink-0" />
            <Link href="/chef-tools/ingredients" className="hover:text-primary transition-colors shrink-0">
              {t('ingredients.catalog.title')}
            </Link>
            <ChevronRight className="h-3 w-3 opacity-30 shrink-0" />
            <span className="text-foreground shrink-0">{name}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12">

            {/* ── Sidebar: Vertical Glass Nav ── */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 p-6 rounded-[2.5rem] bg-card dark:bg-white/[0.02] backdrop-blur-3xl border border-border/50 dark:border-white/5 shadow-2xl transition-colors">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-6 flex items-center gap-2">
                  <LayoutGrid className="h-3 w-3" />
                  {locale === 'ru' ? 'Категории' : locale === 'pl' ? 'Kategorie' : locale === 'uk' ? 'Категорії' : 'Categories'}
                </p>
                <nav className="space-y-2">
                  {allCategories.map(([slug, c]) => {
                    const Icon = c.icon;
                    const isActive = slug === category;
                    return (
                      <Link
                        key={slug}
                        href={`/chef-tools/ingredients/${slug}` as never}
                        className={cn(
                          "group flex items-center gap-4 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-500 italic",
                          isActive
                            ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]'
                            : 'text-muted-foreground hover:bg-primary/5 dark:hover:bg-white/[0.03] hover:text-foreground'
                        )}
                      >
                        <Icon className={cn("h-4 w-4 transition-transform group-hover:scale-110", isActive ? 'text-white' : 'text-muted-foreground group-hover:text-primary')} />
                        <span className="truncate">{c.names[locale] ?? c.nameEn}</span>
                      </Link>
                    );
                  })}
                  <div className="h-px bg-border/50 dark:bg-white/5 my-6" />
                  <Link
                    href="/chef-tools/ingredients"
                    className="flex items-center gap-4 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider text-muted-foreground hover:bg-primary/5 dark:hover:bg-white/[0.03] hover:text-foreground transition-all italic"
                  >
                    <ChevronLeft className="h-4 w-4 text-primary" />
                    {locale === 'ru' ? 'Все продукты' : locale === 'pl' ? 'Wszystkie' : locale === 'uk' ? 'Всі' : 'All Products'}
                  </Link>
                </nav>
              </div>
            </aside>

            {/* ── Main content ── */}
            <main>
              {/* Header section with Icon */}
              <div className="mb-8 sm:mb-12 relative">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 text-center sm:text-left">
                  <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-[1.8rem] sm:rounded-[2rem] bg-primary/10 border border-primary/20 flex items-center justify-center shadow-2xl shadow-primary/10 backdrop-blur-xl">
                    <CategoryIcon className="h-8 sm:h-10 w-8 sm:w-10 text-primary animate-pulse-slow" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-3xl sm:text-6xl font-black tracking-[calc(-0.05em)] text-foreground uppercase italic leading-none mb-3 sm:mb-4">
                      {name}<span className="text-primary">.</span>
                    </h1>
                    <p className="text-xs sm:text-base text-muted-foreground leading-relaxed max-w-3xl border-l-4 border-primary/20 pl-4 sm:pl-6 py-1 italic">
                      {description}
                    </p>
                    <div className="flex items-center justify-center sm:justify-start gap-4 mt-5 sm:mt-6">
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] italic bg-muted/50 dark:bg-white/5 px-4 py-2 rounded-full border border-border/50 dark:border-white/5">
                        {items.length} {locale === 'ru' ? 'позиций' : locale === 'pl' ? 'składników' : locale === 'uk' ? 'позицій' : 'ingredients'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Glass Pills Nav */}
              <div className="flex flex-nowrap gap-2.5 overflow-x-auto pb-4 mb-6 sm:mb-8 lg:hidden scrollbar-hide py-2 -mx-4 px-4 items-center">
                {allCategories.map(([slug, c]) => {
                  const Icon = c.icon;
                  const isActive = slug === category;
                  return (
                    <Link
                      key={slug}
                      href={`/chef-tools/ingredients/${slug}` as never}
                      className={cn(
                        "shrink-0 flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all duration-500 italic",
                        isActive
                          ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30'
                          : 'bg-muted/50 dark:bg-white/[0.02] border-border dark:border-white/5 text-muted-foreground hover:border-primary/20 hover:text-foreground'
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {c.names[locale] ?? c.nameEn}
                    </Link>
                  );
                })}
              </div>

              {/* Ingredients Grid: Deep Obsidian Cards */}
              {items.length === 0 ? (
                <div className="p-16 sm:p-20 text-center rounded-[2.5rem] sm:rounded-[3rem] border-2 border-dashed border-border dark:border-white/5 bg-muted/20 dark:bg-white/[0.01]">
                   <Search className="h-10 sm:h-12 w-10 sm:w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                   <p className="text-xs sm:text-sm text-muted-foreground font-black uppercase tracking-widest italic">
                     {locale === 'ru' ? 'Результатов нет' : locale === 'pl' ? 'Brak wyników' : locale === 'uk' ? 'Немає результатів' : 'No results found'}
                   </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                  {items.map((item) => {
                    const iname = localizedName(item, locale);
                    return (
                      <Link
                        key={item.slug}
                        href={`/chef-tools/ingredients/${item.slug}` as never}
                        className="group flex flex-col p-3.5 sm:p-5 rounded-[2rem] sm:rounded-[2.5rem] bg-card dark:bg-white/[0.02] backdrop-blur-2xl border border-border/50 dark:border-white/5 hover:border-primary/30 hover:bg-muted dark:hover:bg-white/[0.05] transition-all duration-700 hover-lift hover-glow shadow-2xl dark:shadow-black/20"
                      >
                        <div className="relative w-full aspect-square rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden bg-muted dark:bg-slate-900 border border-border/50 dark:border-white/[0.02] mb-4 sm:mb-5">
                          {item.image_url ? (
                            <Image
                              src={item.image_url}
                              alt={iname}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-700 brightness-95 dark:brightness-90 group-hover:brightness-100"
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center opacity-20">
                              <Package className="h-8 sm:h-10 w-8 sm:w-10 text-muted-foreground" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/10 dark:from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="px-1 sm:px-2 pb-1 sm:pb-2">
                          <p className="text-[11px] sm:text-base font-black text-foreground group-hover:text-primary transition-colors leading-tight italic uppercase tracking-tight truncate">
                            {iname}
                          </p>
                          <div className="flex items-center justify-between mt-2.5 sm:mt-3">
                            {item.calories_per_100g != null && (
                              <p className="text-[9px] sm:text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] italic flex items-center gap-1">
                                {item.calories_per_100g} <span className="text-[7px] sm:text-[8px] opacity-40">kcal</span>
                                <span className="text-[7px] opacity-20 font-bold italic">/ {t('dashboard.unit100g')}</span>
                              </p>
                            )}
                            <ArrowRight className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-primary opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-500" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Modern SEO Footer Links */}
              <div className="mt-20 p-8 sm:p-12 rounded-[3.5rem] bg-muted/30 dark:bg-white/[0.02] backdrop-blur-3xl border border-border dark:border-white/5 relative overflow-hidden group/seo">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2 group-hover/seo:bg-primary/10 transition-colors" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-8 flex items-center gap-3 italic">
                  <span className="w-8 h-px bg-primary/20" />
                  {locale === 'ru' ? 'Конвертер мер' : locale === 'pl' ? 'Przelicznik miar' : locale === 'uk' ? 'Конвертер мір' : 'Unit Converter'}
                  <span className="w-8 h-px bg-primary/20" />
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { href: '/chef-tools/converter', label: locale === 'ru' ? 'Калькулятор продуктов' : 'Ingredient Calculator' },
                    { href: '/chef-tools/converter?from=cup&to=g', label: locale === 'ru' ? 'Стакан → Граммы' : 'Cup → Grams' },
                    { href: '/chef-tools/converter?from=tbsp&to=g', label: 'Tablespoon → Grams' },
                    { href: '/chef-tools/converter?from=oz&to=g', label: 'Oz → Grams' },
                  ].map((link) => (
                    <Link
                      key={link.href}
                      href={link.href as never}
                      className="px-6 py-4 rounded-2xl bg-card dark:bg-white/[0.02] border border-border dark:border-white/5 text-xs font-black uppercase tracking-wider text-muted-foreground hover:bg-primary/5 hover:border-primary/20 hover:text-foreground hover:shadow-lg transition-all italic text-center"
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
    </div>
  );
}
