import { getTranslations, getLocale } from 'next-intl/server';
import { HeroImage } from '@/components/HeroImage';
import { ImageGallery } from '@/components/ImageGallery';
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
    title: t('about.title'),
    description: t('about.description'),
    alternates: {
      canonical: `https://dima-fomin.pl/${locale}/about`,
      languages: {
        'pl': `https://dima-fomin.pl/pl/about`,
        'en': `https://dima-fomin.pl/en/about`,
        'ru': `https://dima-fomin.pl/ru/about`,
        'uk': `https://dima-fomin.pl/uk/about`,
      },
    },
    openGraph: {
      title: t('about.title'),
      description: t('about.description'),
      images: ['https://i.postimg.cc/RCf8VLFn/DSCF4639.jpg'],
    },
  };
}

export default async function AboutPage() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'about' });

  const galleryImages = [
    {
      src: 'https://i.postimg.cc/V5QZwGRX/IMG_4239.jpg',
      alt: 'Sushi preparation by Dima Fomin',
    },
    {
      src: 'https://i.postimg.cc/K8QChcY9/DSCF4689.jpg',
      alt: 'Japanese cuisine by Dima Fomin',
    },
    {
      src: 'https://i.postimg.cc/XqFtRwZJ/DSCF4697.jpg',
      alt: 'Culinary art by Dima Fomin',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 md:py-20 lg:grid lg:grid-cols-12 lg:gap-16">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "mainEntity": {
            "@type": "Person",
            "name": "Dmitrij Fomin",
            "jobTitle": "Sushi Chef & Food Technologist",
            "url": "https://fomin.rest",
            "image": "https://i.postimg.cc/RCf8VLFn/DSCF4639.jpg"
          }
        }}
      />
      
      {/* Left Column: Hero & Sticky Header */}
      <div className="lg:col-span-5 mb-12 lg:mb-0">
        <div className="sticky top-24">
          <div className="relative mb-8 overflow-hidden group">
            <HeroImage 
              src="https://i.postimg.cc/RCf8VLFn/DSCF4639.jpg"
              alt="Dima Fomin - Sushi Chef & Food Technologist"
              className="grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700 ring-1 ring-primary/20"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent pointer-events-none" />
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 text-foreground tracking-tighter uppercase italic leading-none">
            {t('title')}<span className="text-primary italic">.</span>
          </h1>
          <p className="text-2xl font-black text-primary/80 tracking-tighter uppercase italic mb-8 border-l-4 border-primary pl-6 py-2">
            {t('subtitle')}
          </p>
        </div>
      </div>

      {/* Right Column: Main Content */}
      <div className="lg:col-span-1 border-primary/20 bg-primary/20 h-full w-[1px] hidden lg:block" />
      
      <div className="lg:col-span-6 space-y-16 md:space-y-24">
        <section className="relative">
          <h2 className="text-3xl md:text-5xl font-black mb-8 text-foreground tracking-tighter uppercase italic">
            {t('journey.title')}
          </h2>
          <div className="text-lg md:text-xl text-muted-foreground leading-relaxed whitespace-pre-line font-medium tracking-tight">
            {t('journey.content')}
          </div>
        </section>

        <section className="relative">
          <h2 className="text-3xl md:text-5xl font-black mb-8 text-foreground tracking-tighter uppercase italic">
            {t('expertise.title')}
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {t.raw('expertise.items').map((item: string, index: number) => (
              <li key={index} className="flex items-center gap-3 p-4 bg-muted/30 border border-primary/10 hover:border-primary/40 transition-colors">
                <span className="h-2 w-2 bg-primary rotate-45" />
                <span className="font-bold uppercase tracking-tight text-sm md:text-base">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Experience Section */}
        <section className="relative">
          <h2 className="text-3xl md:text-5xl font-black mb-10 text-foreground tracking-tighter uppercase italic">
            {t('experience.title')}
          </h2>
          
          <div className="space-y-8">
            {/* FISH in HOUSE */}
            <div className="relative p-6 md:p-8 border-l-2 border-primary/30 hover:border-primary bg-muted/5 transition-all">
              <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter mb-2 italic">{t('experience.fishInHouse.title')}</h3>
              <p className="text-primary font-black uppercase tracking-tighter text-sm mb-2">{t('experience.fishInHouse.role')}</p>
              <p className="text-xs md:text-sm text-muted-foreground uppercase tracking-widest mb-6 font-bold">{t('experience.fishInHouse.period')}</p>
              <ul className="space-y-3 text-sm md:text-base">
                {t.raw('experience.fishInHouse.responsibilities').map((item: string, index: number) => (
                  <li key={index} className="flex gap-2 text-muted-foreground font-medium">
                    <span className="text-primary">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Other positions */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 border border-primary/10 bg-muted/5">
                <h3 className="text-lg md:text-xl font-black uppercase tracking-tighter mb-1 italic">{t('experience.miodMalina.title')}</h3>
                <p className="text-primary text-sm font-black uppercase tracking-tighter mb-4">{t('experience.miodMalina.role')}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">{t('experience.miodMalina.period')}</p>
              </div>
              
              <div className="p-6 border border-primary/10 bg-muted/5">
                <h3 className="text-lg md:text-xl font-black uppercase tracking-tighter mb-1 italic">{t('experience.charlemagne.title')}</h3>
                <p className="text-primary text-sm font-black uppercase tracking-tighter mb-4">{t('experience.charlemagne.role')}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">{t('experience.charlemagne.period')}</p>
              </div>
              
              <div className="md:col-span-2 p-6 border border-primary/10 bg-muted/5">
                <h3 className="text-lg md:text-xl font-black uppercase tracking-tighter mb-1 italic">{t('experience.wawel.title')}</h3>
                <p className="text-primary text-sm font-black uppercase tracking-tighter mb-4">{t('experience.wawel.role')}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">{t('experience.wawel.period')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Education Section */}
        <section className="relative">
          <h2 className="text-3xl md:text-5xl font-black mb-8 text-foreground tracking-tighter uppercase italic">
            {t('education.title')}
          </h2>
          <div className="p-6 md:p-8 bg-primary/5 border-2 border-primary/20">
            <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter mb-2 italic leading-tight">{t('education.degree')}</h3>
            <p className="text-lg font-bold mb-1 uppercase tracking-tight">{t('education.school')}</p>
            <p className="text-xs md:text-sm text-muted-foreground uppercase tracking-widest mb-6 font-bold">{t('education.period')}</p>
            <div className="space-y-2 text-sm md:text-base font-medium">
              <p className="text-primary flex items-center gap-2">
                <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs font-black italic uppercase">HONORS</span>
                {t('education.honors')}
              </p>
              <p className="text-muted-foreground border-l-2 border-muted-foreground/30 pl-4">{t('education.internship')}</p>
            </div>
          </div>
        </section>

        <section className="relative">
          <h2 className="text-3xl md:text-5xl font-black mb-8 text-foreground tracking-tighter uppercase italic">
            {t('mission.title')}
          </h2>
          <div className="text-lg md:text-xl text-muted-foreground leading-relaxed whitespace-pre-line font-medium tracking-tight">
            {t('mission.content')}
          </div>
        </section>

        <section className="relative">
          <h2 className="text-3xl md:text-5xl font-black mb-10 text-foreground tracking-tighter uppercase italic flex items-center gap-4">
            {t('gallery')}
            <span className="flex-grow h-[2px] bg-primary/20" />
          </h2>
          <ImageGallery images={galleryImages} />
        </section>
      </div>
    </div>
  );
}
