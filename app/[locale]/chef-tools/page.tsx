import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { generateMetadata as genMeta } from '@/lib/metadata';
import { ArrowRight, Scale } from 'lucide-react';

export const dynamic = 'force-static';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'chefTools' });
  return genMeta({
    title: t('meta.title'),
    description: t('meta.description'),
    locale: locale as 'pl' | 'en' | 'uk' | 'ru',
    path: '/chef-tools',
  });
}

const tools = [
  {
    href: '/chef-tools/converter',
    icon: Scale,
    key: 'converter',
  },
];

export default async function ChefToolsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'chefTools' });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
      {/* Header */}
      <div className="mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-[0.2em] mb-8 border border-primary/20">
          {t('badge')}
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground uppercase italic leading-[0.85] mb-6">
          {t('title')}<span className="text-primary">.</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl font-medium leading-relaxed">
          {t('description')}
        </p>
      </div>

      {/* Tools Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {tools.map(({ href, icon: Icon, key }) => (
          <Link key={href} href={href}>
            <div className="group border-2 border-border/60 rounded-3xl p-8 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 bg-background h-full">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight text-foreground mb-3 group-hover:text-primary transition-colors italic">
                {t(`tools.${key}.title`)}
              </h2>
              <p className="text-muted-foreground font-medium leading-relaxed mb-6">
                {t(`tools.${key}.description`)}
              </p>
              <div className="flex items-center gap-1.5 text-primary text-xs font-black uppercase tracking-widest group-hover:gap-3 transition-all">
                {t('open')}
                <ArrowRight className="h-3.5 w-3.5 stroke-[3px]" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
