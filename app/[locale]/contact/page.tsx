import { getTranslations, getLocale } from 'next-intl/server';
import { Mail, MessageSquare, ArrowUpRight } from 'lucide-react';
import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return {
    title: t('contact.title'),
    description: t('contact.description'),
    alternates: {
      canonical: `/${locale}/contact`,
      languages: {
        'pl': '/pl/contact',
        'en': '/en/contact',
        'ru': '/ru/contact',
        'uk': '/uk/contact',
      },
    },
    openGraph: {
      title: t('contact.title'),
      description: t('contact.description'),
    },
  };
}

export default async function ContactPage() {
  const locale = await getLocale();
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

      <div className="grid lg:grid-cols-2 gap-16 md:gap-24 items-start">
        <div className="border-t border-primary/20 pt-12">
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black mb-8 text-foreground tracking-tighter uppercase italic leading-none">
            {t('title')}<span className="text-primary italic">.</span>
          </h1>
          <p className="text-xl md:text-3xl text-muted-foreground font-medium tracking-tight mb-12 max-w-xl">
            {t('description')}
          </p>
          
          <div className="hidden lg:block relative group overflow-hidden bg-primary/5 p-12 mt-20 border border-primary/10">
            <span className="absolute -bottom-10 -right-10 text-[10rem] font-black italic text-primary/5 select-none pointer-events-none uppercase">
               Talk
            </span>
            <p className="relative z-10 text-primary font-black uppercase tracking-tighter italic text-2xl">
              Open for collaboration
            </p>
          </div>
        </div>

        <div className="space-y-6 md:space-y-8 lg:pt-12">
          {/* Email Card */}
          <a 
            href={`mailto:${t('email.primary')}`}
            className="group block p-8 md:p-10 bg-card border-2 border-primary/10 hover:border-primary transition-all duration-500 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
               <ArrowUpRight className="w-8 h-8" />
            </div>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-primary/10 text-primary rotate-45 group-hover:rotate-0 transition-transform duration-500">
                <Mail className="h-6 w-6 -rotate-45 group-hover:rotate-0 transition-transform duration-500" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter italic">{t('email.title')}</h2>
            </div>
            
            <p className="text-xl md:text-2xl font-medium tracking-tight text-muted-foreground group-hover:text-foreground transition-colors break-all">
              {t('email.primary')}
            </p>
          </a>

          {/* Social Card */}
          <a 
            href={t('social.instagramUrl')} 
            target="_blank" 
            rel="noopener noreferrer"
            className="group block p-8 md:p-10 bg-card border-2 border-primary/10 hover:border-primary transition-all duration-500 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
               <ArrowUpRight className="w-8 h-8" />
            </div>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-primary/10 text-primary rotate-45 group-hover:rotate-0 transition-transform duration-500">
                <MessageSquare className="h-6 w-6 -rotate-45 group-hover:rotate-0 transition-transform duration-500" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter italic">{t('social.title')}</h2>
            </div>
            
            <p className="text-xl md:text-2xl font-medium tracking-tight text-muted-foreground group-hover:text-foreground transition-colors">
              {t('social.instagram')}
            </p>
          </a>
          
          <div className="p-6 md:p-8 border-l-4 border-primary bg-muted/30">
            <p className="text-sm md:text-base font-bold uppercase tracking-widest text-muted-foreground italic">
              Based in Krakow, Poland. Working Globally.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
