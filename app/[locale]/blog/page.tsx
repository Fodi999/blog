import { getTranslations } from 'next-intl/server';
import { getAllPosts } from '@/lib/posts';
import type { Metadata } from 'next';
import { BlogContent } from './BlogContent';
import { JsonLd } from '@/components/JsonLd';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return {
    title: t('blog.title'),
    description: t('blog.description'),
    alternates: {
      canonical: `/${locale}/blog`,
      languages: {
        'pl': '/pl/blog',
        'en': '/en/blog',
        'ru': '/ru/blog',
        'uk': '/uk/blog',
      },
    },
    openGraph: {
      title: t('blog.title'),
      description: t('blog.description'),
    },
  };
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'blog' });
  const posts = await getAllPosts(locale);

  // Extract unique categories from posts
  const categories = Array.from(new Set(posts.map(post => post.category)));

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Blog",
          "name": t('title'),
          "description": t('subtitle'),
          "url": `https://fomin.rest/${locale}/blog`,
          "publisher": {
            "@type": "Person",
            "name": "Dmitrij Fomin"
          }
        }}
      />
      
      <div className="mb-16 md:mb-24 border-t border-primary/20 pt-12">
        <h1 className="text-6xl md:text-8xl font-black mb-8 text-foreground tracking-tighter uppercase italic">
          {t('title')}<span className="text-primary">.</span>
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl font-medium tracking-tight">
          {t('subtitle')}
        </p>
      </div>

      <BlogContent posts={posts} categories={categories} />
    </div>
  );
}
