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
    <div className="max-w-4xl mx-auto">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('title')}</h1>
        <p className="text-2xl text-gray-600 dark:text-gray-400 font-noto-sans-jp mb-8">
          {t('subtitle')}
        </p>
        
        <HeroImage 
          src="https://i.postimg.cc/RCf8VLFn/DSCF4639.jpg"
          alt="Dima Fomin - Sushi Chef & Food Technologist"
          priority
        />
      </div>

      <div className="prose dark:prose-invert max-w-none">
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4">{t('journey.title')}</h2>
          <p className="text-lg">
            {t('journey.content')}
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4">{t('expertise.title')}</h2>
          <ul className="space-y-2 text-lg">
            {t.raw('expertise.items').map((item: string, index: number) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4">{t('mission.title')}</h2>
          <p className="text-lg">
            {t('mission.content')}
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">{t('gallery')}</h2>
          <ImageGallery images={galleryImages} />
        </section>
      </div>
    </div>
  );
}
