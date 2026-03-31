import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Mail, MessageSquare, ArrowUpRight, Sparkles, MapPin } from 'lucide-react';
import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import { generateMetadata as sharedGenerateMetadata } from '@/lib/metadata';
import { ScrollReveal, StaggerReveal } from '@/components/ScrollReveal';

export const dynamic = 'force-static';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: l } = await params;
  setRequestLocale(l);
  const locale = l as 'pl' | 'en' | 'uk' | 'ru';
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return sharedGenerateMetadata({
    title: t('contact.title'),
    description: t('contact.description'),
    locale,
    path: '/contact',
  });
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'contact' });

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          "mainEntity": {
            "@type": "Person",
            "name": "Dmitrij Fomin",
            "email": "dima.fomin.rest@gmail.com"
          }
        }}
      />

      <div className="grid lg:grid-cols-2 gap-12 md:gap-20 items-start">
        <div className="lg:sticky lg:top-24">
          <ScrollReveal direction="left" delay={0} duration={800} distance={20}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-primary/20 backdrop-blur-md">
              <Sparkles className="w-3 h-3 fill-primary" />
              <span>Contact</span>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="left" delay={200} duration={900} distance={30} blur={8}>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 text-foreground tracking-tighter uppercase italic leading-[0.85] text-shimmer">
              {t('title')}<span className="text-primary not-italic">.</span>
            </h1>
          </ScrollReveal>

          <ScrollReveal direction="left" delay={400} duration={800} distance={20}>
            <p className="text-lg md:text-2xl text-muted-foreground font-medium tracking-tight mb-10 max-w-xl leading-relaxed">
              {t('description')}
            </p>
          </ScrollReveal>
          
          <ScrollReveal direction="up" delay={600} duration={1000} scale={0.95}>
            <div className="relative group overflow-hidden bg-primary/[0.03] p-10 mt-12 md:mt-20 border border-primary/10 rounded-3xl hover-glow">
              <span className="absolute -bottom-8 -right-8 text-[8rem] font-black italic text-primary/[0.03] select-none pointer-events-none uppercase">
                 Talk
              </span>
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <p className="text-primary font-black uppercase tracking-tighter italic text-xl md:text-2xl">
                  Open for collaboration
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>

        <div className="space-y-6 md:space-y-8 lg:pt-4">
          <StaggerReveal staggerMs={150} direction="up" distance={30}>
            {/* Email Card */}
            <a 
              href={`mailto:${t('email.primary')}`}
              className="group block p-8 md:p-10 bg-card border-2 border-border/40 hover:border-primary transition-all duration-500 rounded-3xl relative overflow-hidden hover-lift hover-glow active:scale-[0.98]"
            >
              <div className="absolute top-0 right-0 p-6 text-primary/0 group-hover:text-primary transition-all translate-x-4 -translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0">
                 <ArrowUpRight className="w-8 h-8" />
              </div>
              
              <div className="flex items-center gap-5 mb-8">
                <div className="p-4 bg-primary/10 text-primary rounded-2xl group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm">
                  <Mail className="h-6 w-6" />
                </div>
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter italic text-foreground/90">{t('email.title')}</h2>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/50">Primary Email</p>
                <p className="text-xl md:text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors break-all">
                  {t('email.primary')}
                </p>
              </div>
            </a>

            {/* Social Card */}
            <a 
              href={t('social.instagramUrl')} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group block p-8 md:p-10 bg-card border-2 border-border/40 hover:border-primary transition-all duration-500 rounded-3xl relative overflow-hidden hover-lift hover-glow active:scale-[0.98]"
            >
              <div className="absolute top-0 right-0 p-6 text-primary/0 group-hover:text-primary transition-all translate-x-4 -translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0">
                 <ArrowUpRight className="w-8 h-8" />
              </div>
              
              <div className="flex items-center gap-5 mb-8">
                <div className="p-4 bg-primary/10 text-primary rounded-2xl group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter italic text-foreground/90">{t('social.title')}</h2>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/50">Instagram</p>
                <p className="text-xl md:text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                  {t('social.instagram')}
                </p>
              </div>
            </a>
            
            <div className="p-8 md:p-10 rounded-3xl border-2 border-dashed border-border/40 bg-muted/[0.02] flex items-start gap-4">
              <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm md:text-base font-bold uppercase tracking-widest text-muted-foreground leading-relaxed italic">
                {t('location')}
              </p>
            </div>
          </StaggerReveal>
        </div>
      </div>
    </div>
  );
}
