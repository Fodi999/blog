import { Metadata } from 'next';

const BASE_URL = 'https://dima-fomin.pl';

const ogLocaleMap: Record<string, string> = {
  pl: 'pl_PL',
  en: 'en_US',
  ru: 'ru_RU',
  uk: 'uk_UA',
};

interface ArticleMeta {
  publishedTime: string;
  modifiedTime?: string;
  tags?: string[];
  section?: string;
}

interface GenerateMetadataParams {
  title: string;
  description: string;
  locale: 'pl' | 'en' | 'uk' | 'ru';
  path?: string;               // e.g. '' | '/blog' | `/blog/${slug}`
  image?: string;
  // If omitted => assume page exists in all locales
  availableLocales?: Array<'pl' | 'en' | 'uk' | 'ru'>;
  article?: ArticleMeta;
  /** Set true to add noindex,follow — thin/duplicate pages that shouldn't be indexed */
  noIndex?: boolean;
}

const articleTitleSuffix: Record<string, string> = {
  pl: 'Blog gastronomiczny dla restauratorów | Dima Fomin',
  en: 'Restaurant & Sushi Blog | Dima Fomin',
  ru: 'Гастрономический блог для рестораторов | Dima Fomin',
  uk: 'Гастрономічний блог для рестораторів | Dima Fomin',
};

export function generateMetadata({
  title,
  description,
  locale,
  path = '',
  image = 'https://i.postimg.cc/RCf8VLFn/DSCF4639.jpg',
  availableLocales,
  article,
  noIndex = false,
}: GenerateMetadataParams): Metadata {
  const normalizedPath = path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path;
  const url = `${BASE_URL}/${locale}${normalizedPath}`;

  const allLocales = availableLocales ?? (['pl', 'en', 'uk', 'ru'] as const);

  const langs = [...allLocales].reduce<Record<string, string>>(
    (acc, l) => {
      acc[l] = `${BASE_URL}/${l}${normalizedPath}`;
      return acc;
    },
    {}
  );

  // Add x-default — neutral URL without locale prefix.
  // Middleware will detect Accept-Language and redirect to the right locale.
  // This tells Google: "this is the global entry point, not tied to any language".
  langs['x-default'] = `${BASE_URL}${normalizedPath}`;

  const titleSuffix = article ? articleTitleSuffix[locale] ?? 'Blog | Dima Fomin' : 'Dima Fomin';
  const fullTitle = article ? `${title} – ${titleSuffix}` : `${title} | ${titleSuffix}`;

  const alternateLocale = allLocales
    .filter((l) => l !== locale)
    .map((l) => ogLocaleMap[l])
    .filter(Boolean);

  return {
    title: fullTitle,
    description,
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: url,
      languages: langs,
    },
    openGraph: {
      title: fullTitle,
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
      alternateLocale,
      type: article ? 'article' : 'website',
      publishedTime: article?.publishedTime,
      modifiedTime: article?.modifiedTime,
      authors: article ? ['Dima Fomin'] : undefined,
      section: article?.section,
      tags: article?.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image],
    },
    robots: {
      index: !noIndex,
      follow: true,
      googleBot: {
        index: !noIndex,
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

export function generateArticleJsonLd({
  title,
  description,
  url,
  image,
  publishedTime,
  modifiedTime,
}: {
  title: string;
  description: string;
  url: string;
  image: string;
  publishedTime: string;
  modifiedTime?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    image,
    author: {
      '@type': 'Person',
      name: 'Dima Fomin',
      url: BASE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Dima Fomin',
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/logo.png`,
      },
    },
    datePublished: publishedTime,
    dateModified: modifiedTime ?? publishedTime,
    mainEntityOfPage: url,
  };
}

export function generateBreadcrumbJsonLd({
  items,
}: {
  items: Array<{ name: string; url: string }>;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
