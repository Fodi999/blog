import { Metadata } from 'next';

interface GenerateMetadataParams {
  title: string;
  description: string;
  locale: string;
  path?: string;
  image?: string;
}

export function generateMetadata({
  title,
  description,
  locale,
  path = '',
  image = 'https://i.postimg.cc/RCf8VLFn/DSCF4639.jpg',
}: GenerateMetadataParams): Metadata {
  const baseUrl = 'https://dima-fomin.pl';
  const url = `${baseUrl}/${locale}${path}`;

  return {
    title: `${title} | Dima Fomin`,
    description,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: url,
      languages: {
        'pl': `${baseUrl}/pl${path}`,
        'en': `${baseUrl}/en${path}`,
        'uk': `${baseUrl}/uk${path}`,
        'ru': `${baseUrl}/ru${path}`,
      },
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
      locale,
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
  url: 'https://dima-fomin.pl/blog',
  author: jsonLdPerson,
};
