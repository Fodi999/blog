import { getTranslations, getLocale } from 'next-intl/server';
import { HeroImage } from '@/components/HeroImage';
import { ImageGallery } from '@/components/ImageGallery';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return {
    title: t('about.title'),
    description: t('about.description'),
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
    <div className="max-w-4xl mx-auto px-4">
      <div className="mb-8 md:mb-12">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 md:mb-4">{t('title')}</h1>
        <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-400 font-noto-sans-jp mb-6 md:mb-8">
          {t('subtitle')}
        </p>
        
        <HeroImage 
          src="https://i.postimg.cc/RCf8VLFn/DSCF4639.jpg"
          alt="Dima Fomin - Sushi Chef & Food Technologist"
          priority
        />
      </div>

      <div className="prose dark:prose-invert max-w-none">
        <section className="mb-8 md:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 md:mb-4">{t('journey.title')}</h2>
          <div className="text-base md:text-lg whitespace-pre-line">
            {t('journey.content')}
          </div>
        </section>

        <section className="mb-8 md:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 md:mb-4">{t('expertise.title')}</h2>
          <ul className="space-y-2 text-base md:text-lg">
            {t.raw('expertise.items').map((item: string, index: number) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </section>

        {/* Experience Section */}
        <section className="mb-8 md:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 md:mb-6">{t('experience.title')}</h2>
          
          {/* FISH in HOUSE */}
          <div className="mb-6 p-5 md:p-6 bg-card border border-border rounded-xl">
            <h3 className="text-lg md:text-xl font-bold mb-2">{t('experience.fishInHouse.title')}</h3>
            <p className="text-primary font-semibold mb-1">{t('experience.fishInHouse.role')}</p>
            <p className="text-sm md:text-base text-muted mb-3">{t('experience.fishInHouse.period')}</p>
            <ul className="space-y-1.5 text-sm md:text-base list-disc list-inside">
              {t.raw('experience.fishInHouse.responsibilities').map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>

          {/* Other positions */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 md:p-5 bg-card border border-border rounded-xl">
              <h3 className="text-base md:text-lg font-bold mb-2">{t('experience.miodMalina.title')}</h3>
              <p className="text-primary text-sm md:text-base font-semibold">{t('experience.miodMalina.role')}</p>
              <p className="text-xs md:text-sm text-muted">{t('experience.miodMalina.period')}</p>
            </div>
            
            <div className="p-4 md:p-5 bg-card border border-border rounded-xl">
              <h3 className="text-base md:text-lg font-bold mb-2">{t('experience.charlemagne.title')}</h3>
              <p className="text-primary text-sm md:text-base font-semibold">{t('experience.charlemagne.role')}</p>
              <p className="text-xs md:text-sm text-muted">{t('experience.charlemagne.period')}</p>
            </div>
            
            <div className="p-4 md:p-5 bg-card border border-border rounded-xl md:col-span-2">
              <h3 className="text-base md:text-lg font-bold mb-2">{t('experience.wawel.title')}</h3>
              <p className="text-primary text-sm md:text-base font-semibold">{t('experience.wawel.role')}</p>
              <p className="text-xs md:text-sm text-muted">{t('experience.wawel.period')}</p>
            </div>
          </div>
        </section>

        {/* Education Section */}
        <section className="mb-8 md:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 md:mb-4">{t('education.title')}</h2>
          <div className="p-5 md:p-6 bg-card border border-border rounded-xl">
            <h3 className="text-lg md:text-xl font-bold mb-2">{t('education.degree')}</h3>
            <p className="text-base md:text-lg mb-1">{t('education.school')}</p>
            <p className="text-sm md:text-base text-muted mb-3">{t('education.period')}</p>
            <div className="space-y-1 text-sm md:text-base">
              <p className="text-primary font-semibold">✓ {t('education.honors')}</p>
              <p className="text-muted">• {t('education.internship')}</p>
            </div>
          </div>
        </section>

        <section className="mb-8 md:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 md:mb-4">{t('mission.title')}</h2>
          <div className="text-base md:text-lg whitespace-pre-line">
            {t('mission.content')}
          </div>
        </section>

        <section className="mb-8 md:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 md:mb-6">{t('gallery')}</h2>
          <ImageGallery images={galleryImages} />
        </section>
      </div>
    </div>
  );
}
