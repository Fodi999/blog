import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { generateMetadata as genMeta } from '@/lib/metadata';
import { ChevronLeft, Wifi, WifiOff } from 'lucide-react';
import { fetchIngredients, type ApiIngredient } from '@/lib/api';

// Revalidate every 24h — fresh data from API, not force-static
export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'chefTools' });
  return genMeta({
    title: t('tools.ingredients.title'),
    description: t('tools.ingredients.description'),
    locale: locale as 'pl' | 'en' | 'uk' | 'ru',
    path: '/chef-tools/ingredients',
  });
}

// Fallback static data when API is unavailable
const FALLBACK_INGREDIENTS: ApiIngredient[] = [
  { name: 'Salmon (raw)', category: 'fish', calories: 208, protein: 20.4, fat: 13.4, carbs: 0, per: '100g' },
  { name: 'Tuna (raw)', category: 'fish', calories: 144, protein: 23.3, fat: 4.9, carbs: 0, per: '100g' },
  { name: 'Sea Bass', category: 'fish', calories: 97, protein: 18.4, fat: 2.0, carbs: 0, per: '100g' },
  { name: 'Shrimp (raw)', category: 'seafood', calories: 99, protein: 18.9, fat: 1.7, carbs: 0.9, per: '100g' },
  { name: 'Scallop', category: 'seafood', calories: 111, protein: 20.5, fat: 0.8, carbs: 5.4, per: '100g' },
  { name: 'Squid', category: 'seafood', calories: 92, protein: 15.6, fat: 1.4, carbs: 3.1, per: '100g' },
  { name: 'Sushi Rice (cooked)', category: 'rice', calories: 130, protein: 2.4, fat: 0.3, carbs: 28.2, per: '100g' },
  { name: 'Nori (1 sheet)', category: 'seaweed', calories: 11, protein: 1.1, fat: 0.1, carbs: 1.4, per: '1 sheet' },
  { name: 'Avocado', category: 'vegetable', calories: 160, protein: 2.0, fat: 14.7, carbs: 8.5, per: '100g' },
  { name: 'Cucumber', category: 'vegetable', calories: 15, protein: 0.6, fat: 0.1, carbs: 3.6, per: '100g' },
  { name: 'Cream Cheese', category: 'dairy', calories: 342, protein: 6.2, fat: 33.2, carbs: 4.1, per: '100g' },
  { name: 'Soy Sauce', category: 'condiment', calories: 53, protein: 8.1, fat: 0, carbs: 4.9, per: '100ml' },
  { name: 'Sesame Oil', category: 'condiment', calories: 884, protein: 0, fat: 100, carbs: 0, per: '100ml' },
  { name: 'Wasabi', category: 'condiment', calories: 109, protein: 4.8, fat: 0.6, carbs: 23.7, per: '100g' },
  { name: 'Ginger (pickled)', category: 'condiment', calories: 40, protein: 0.2, fat: 0, carbs: 9.4, per: '100g' },
];

const categoryColors: Record<string, string> = {
  fish: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  seafood: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
  rice: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  seaweed: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  vegetable: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  dairy: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
  condiment: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
};

export default async function IngredientsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'chefTools' });

  // Try API first, fallback to static data
  const apiData = await fetchIngredients();
  const ingredients = apiData ?? FALLBACK_INGREDIENTS;
  const fromApi = apiData !== null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
      <Link
        href="/chef-tools"
        className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors mb-10"
      >
        <ChevronLeft className="h-4 w-4" />
        {t('back')}
      </Link>

      <div className="flex items-start justify-between flex-wrap gap-4 mb-12">
        <div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground uppercase italic leading-[0.85] mb-4">
            {t('tools.ingredients.title')}<span className="text-primary">.</span>
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            {t('tools.ingredients.description')}
          </p>
        </div>
        {/* API status badge */}
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border ${
          fromApi
            ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
            : 'bg-muted text-muted-foreground border-border/60'
        }`}>
          {fromApi ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {fromApi ? 'Live API' : 'Offline data'}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-3xl border-2 border-border/60">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-border/60 bg-muted/30">
              <th className="text-left py-4 px-6 font-black uppercase tracking-widest text-sm text-foreground">
                {t('ingredients.name')}
              </th>
              <th className="py-4 px-4 font-black uppercase tracking-widest text-xs text-muted-foreground text-center">
                {t('ingredients.per')}
              </th>
              <th className="py-4 px-4 font-black uppercase tracking-widest text-xs text-muted-foreground text-right">
                {t('ingredients.calories')}
              </th>
              <th className="py-4 px-4 font-black uppercase tracking-widest text-xs text-muted-foreground text-right">
                {t('ingredients.protein')}
              </th>
              <th className="py-4 px-4 font-black uppercase tracking-widest text-xs text-muted-foreground text-right">
                {t('ingredients.fat')}
              </th>
              <th className="py-4 px-4 font-black uppercase tracking-widest text-xs text-muted-foreground text-right">
                {t('ingredients.carbs')}
              </th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map((ing, i) => (
              <tr
                key={`${ing.name}-${i}`}
                className={`border-b border-border/40 transition-colors hover:bg-muted/20 ${i % 2 === 0 ? '' : 'bg-muted/10'}`}
              >
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-sm text-foreground">{ing.name}</span>
                    {ing.category && (
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${categoryColors[ing.category] ?? 'bg-muted text-muted-foreground border-border/60'}`}>
                        {ing.category}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-4 px-4 text-center text-xs text-muted-foreground font-medium">
                  {ing.per ?? '100g'}
                </td>
                <td className="py-4 px-4 text-right font-black text-primary">{ing.calories}</td>
                <td className="py-4 px-4 text-right font-medium text-foreground/80 text-sm">{ing.protein}g</td>
                <td className="py-4 px-4 text-right font-medium text-foreground/80 text-sm">{ing.fat}g</td>
                <td className="py-4 px-4 text-right font-medium text-foreground/80 text-sm">{ing.carbs}g</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* API credit */}
      {fromApi && (
        <p className="text-xs text-muted-foreground mt-4 text-right font-medium">
          Data source: api.dima-fomin.pl • Updated every 24h
        </p>
      )}
    </div>
  );
}
