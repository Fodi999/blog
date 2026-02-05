import { getTranslations } from 'next-intl/server';
import { PostCard } from '@/components/PostCard';
import { getAllPosts } from '@/lib/posts';
import type { Metadata } from 'next';

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

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="mb-8 md:mb-12">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 md:mb-4 text-foreground">{t('title')}</h1>
        <p className="text-lg md:text-xl text-muted">
          {t('allPosts')}
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {posts.map((post) => (
          <PostCard key={post.slug} {...post} />
        ))}
      </div>
    </div>
  );
}
