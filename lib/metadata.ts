import { Metadata } from 'next';

const BASE_URL = 'https://dima-fomin.pl';

const ogLocaleMap: Record<string, string> = {
  pl: 'pl_PL',
  en: 'en_US',
  ru: 'ru_RU',
  uk: 'uk_UA',
};

interface GenerateMetadataParams {
  title: string;
  description: string;
  locale: 'pl' | 'en' | 'uk' | 'ru';
  path?: string;               // e.g. '' | '/blog' | `/blog/${slug}`
  image?: string;
  // If omitted => assume page exists in all locales
  availableLocales?: Array<'pl' | 'en' | 'uk' | 'ru'>;
  // Optional: choose x-default locale
  xDefaultLocale?: 'pl' | 'en' | 'uk' | 'ru';
}

export function generateMetadata({
  title,
  description,
  locale,
  path = '',
  image = 'https://i.postimg.cc/RCf8VLFn/DSCF4639.jpg',
  availableLocales,
  xDefaultLocale = 'pl',
}: GenerateMetadataParams): Metadata {
  const url = `${BASE_URL}/${locale}${path}`;

  const langs = (availableLocales ?? (['pl', 'en', 'uk', 'ru'] as const)).reduce<Record<string, string>>(
    (acc, l) => {
      acc[l] = `${BASE_URL}/${l}${path}`;
      return acc;
    },
    {}
  );

  // Add x-default (recommended)
  langs['x-default'] = `${BASE_URL}/${xDefaultLocale}${path}`;

  return {
    title: `${title} | Dima Fomin`,
    description,
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: url,
      languages: langs,
    },
    openGraph: {
      title: `${title} | Dima Fomin`,
      description,
      url,
      siteName: 'Dima Fomin - Sushi Chef',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: ogLocaleMap[locale] ?? 'pl_PL',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Dima Fomin`,
      description,
      images: [image],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export const jsonLdPerson = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Dima Fomin',
  url: 'https://dima-fomin.pl',
  jobTitle: 'Sushi Chef & Food Technologist',
  description: 'Expert in sushi art, Japanese cuisine, and culinary technology',
  sameAs: [
    'https://instagram.com/dima_fomin_chef',
    'https://linkedin.com/in/dima-fomin',
  ],
};

export const jsonLdBlog = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: 'Dima Fomin Blog',
  description: 'Articles about sushi, Japanese cuisine, and culinary technology',
  url: 'https://dima-fomin.pl/pl/blog',
  author: jsonLdPerson,
};
