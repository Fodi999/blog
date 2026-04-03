import { getTranslations, setRequestLocale } from 'next-intl/server';
import { generateMetadata as genMeta } from '@/lib/metadata';
import { JsonLd } from '@/components/JsonLd';
import { AISousChef } from './dashboard/AISousChef';
import { Link } from '@/i18n/routing';
import {
  Scale, Fish, FlaskConical, Calculator, Utensils,
  Sparkles, Search, BarChart3, Salad, MessageCircle, ArrowRight,
} from 'lucide-react';

export const revalidate = 300; // ISR: 5 min

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'chefTools' });
  return genMeta({
    title: t('meta.title'),
    description: t('meta.description'),
    locale: locale as 'pl' | 'en' | 'uk' | 'ru',
    path: '/chef-tools',
  });
}

/* Tool card data — icon + href + translation key */
const TOOLS = [
  { href: '/chef-tools/ingredients',       icon: Search,        key: 'ingredients'     },
  { href: '/chef-tools/fish-season',       icon: Fish,          key: 'fishSeason'      },
  { href: '/chef-tools/lab',               icon: FlaskConical,  key: 'lab'             },
  { href: '/chef-tools/converter',         icon: Scale,         key: 'converter'       },
  { href: '/chef-tools/recipe-analyzer',   icon: Calculator,    key: 'recipeAnalyzer'  },
  { href: '/chef-tools/flavor-pairing',    icon: Utensils,      key: 'flavorPairing'   },
  { href: '/chef-tools/nutrition',         icon: BarChart3,     key: 'nutrition'       },
  { href: '/chef-tools/diet/vegan',        icon: Salad,         key: 'diet'            },
  { href: '/chef-tools/ranking/protein',   icon: Sparkles,      key: 'ranking'         },
] as const;

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default async function ChefToolsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'chefTools' });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: t('title'),
          description: t('description'),
          url: `https://dima-fomin.pl/${locale}/chef-tools`,
          isPartOf: {
            '@type': 'WebSite',
            name: 'Dima Fomin',
            url: 'https://dima-fomin.pl',
          },
        }}
      />

      {/* ═══ Hero ═══ */}
      <section className="py-16 lg:py-24">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-[0.15em] mb-6 border border-primary/20">
            <Sparkles className="h-3 w-3 fill-primary" />
            {t('badge')}
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic mb-4">
            {t('toolGrid.title')}
          </h1>
          <p className="text-lg text-muted-foreground font-medium max-w-xl">
            {t('toolGrid.subtitle')}
          </p>
        </div>
      </section>

      {/* ═══ Tool Grid ═══ */}
      <section className="pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TOOLS.map(({ href, icon: Icon, key }) => (
            <Link key={href} href={href} locale={locale}>
              <div className="group relative border-2 border-border/60 rounded-2xl p-6 hover:border-primary/40 transition-all duration-500 bg-background h-full hover-lift hover-glow">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-500">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-black uppercase tracking-tight text-foreground mb-1.5 group-hover:text-primary transition-colors">
                  {t(`toolGrid.${key}`)}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(`toolGrid.${key}Desc`)}
                </p>
                <ArrowRight className="absolute top-6 right-6 h-4 w-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}

          {/* AI Chat card — special styling */}
          <div className="sm:col-span-2 lg:col-span-3 border-2 border-primary/20 rounded-2xl p-6 bg-primary/5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-11 h-11 rounded-xl bg-primary/20 flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-black uppercase tracking-tight text-foreground">
                  {t('toolGrid.aiChat')}
                </h3>
                <p className="text-sm text-muted-foreground">{t('toolGrid.aiChatDesc')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ AI Sous-Chef Chat ═══ */}
      <section className="pb-20 lg:pb-32">
        <AISousChef />
      </section>
    </div>
  );
}

