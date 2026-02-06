import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import { getPostBySlug, getAllPosts } from '@/lib/posts';
import { MDXContent } from '@/components/MDXContent';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import type { Metadata } from 'next';

export async function generateStaticParams() {
  const locales = ['pl', 'en', 'uk', 'ru'];
  const params = [];

  for (const locale of locales) {
    const posts = await getAllPosts(locale);
    for (const post of posts) {
      params.push({ locale, slug: post.slug });
    }
  }

  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getPostBySlug(locale, slug);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: `${post.title} | Dima Fomin`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.date,
      images: post.coverImage ? [post.coverImage] : ['https://i.postimg.cc/RCf8VLFn/DSCF4639.jpg'],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: post.coverImage ? [post.coverImage] : undefined,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: 'blog' });
  const post = await getPostBySlug(locale, slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link 
        href="/blog"
        className="inline-flex items-center gap-2 text-primary link-hover mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('backToBlog')}
      </Link>

      <article>
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-4 text-sm text-muted mb-6">
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{
              backgroundColor: 'rgb(var(--primary) / 0.1)',
              color: 'rgb(var(--primary))'
            }}>
              {post.category}
            </span>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <time dateTime={post.date}>{post.date}</time>
            </div>
            {post.readTime && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{post.readTime}</span>
              </div>
            )}
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground leading-tight">
            {post.title}
          </h1>
          
          {post.excerpt && (
            <p className="text-xl text-muted leading-relaxed">
              {post.excerpt}
            </p>
          )}
        </header>

        {/* Hero Image */}
        {post.coverImage && (
          <div className="relative w-full aspect-[21/9] mb-12 rounded-xl overflow-hidden border border-border">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <MDXContent source={post.content} />
        </div>
        
        {/* Footer with author & CTA */}
        <footer className="mt-16 pt-12 border-t border-border/30">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            {/* Author */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-red-500">
                <Image
                  src="https://i.postimg.cc/W1KV4b43/logo1.webp"
                  alt="Chef Dima Fomin"
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                />
              </div>
              <div>
                <div className="font-bold text-lg text-foreground">Dima Fomin</div>
                <div className="text-sm text-muted">{t('authorRole')}</div>
              </div>
            </div>
            
            {/* CTA */}
            <div className="flex flex-col items-start md:items-end gap-2">
              <a 
                href={`/blog?category=${encodeURIComponent(post.category)}`}
                className="text-primary hover:text-primary-hover transition-colors font-medium"
              >
                {t('moreFromCategory')} {post.category}
              </a>
              <a 
                href="/blog"
                className="text-sm text-muted hover:text-foreground transition-colors"
              >
                {t('allArticles')}
              </a>
            </div>
          </div>
        </footer>
      </article>
    </div>
  );
}
