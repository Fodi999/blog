import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { ArrowLeft, Calendar, Clock, Share2, Printer } from 'lucide-react';
import { getPostBySlug, getAllPosts } from '@/lib/posts';
import { MDXContent } from '@/components/MDXContent';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import type { Metadata } from 'next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { JsonLd } from '@/components/JsonLd';
import { generateMetadata as sharedGenerateMetadata } from '@/lib/metadata';

export const dynamic = 'force-static';

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
  
  const locales = ['pl', 'en', 'uk', 'ru'] as const;
  const postsByLocale = await Promise.all(
    locales.map(async (l) => [l, await getPostBySlug(l, slug)] as const)
  );

  const post = postsByLocale.find(([l]) => l === locale)?.[1];

  if (!post) {
    return {
      title: 'Post Not Found',
      robots: { index: false, follow: false },
    };
  }

  const defaultImage = 'https://i.postimg.cc/RCf8VLFn/DSCF4639.jpg';

  const availableLocales = postsByLocale
    .filter(([_, p]) => !!p)
    .map(([l]) => l as 'pl' | 'en' | 'uk' | 'ru');

  return sharedGenerateMetadata({
    title: post.title,
    description: post.excerpt,
    locale: locale as 'pl' | 'en' | 'uk' | 'ru',
    path: `/blog/${slug}`,
    image: post.coverImage || defaultImage,
    availableLocales,
  });
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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage || 'https://i.postimg.cc/RCf8VLFn/DSCF4639.jpg',
    datePublished: post.date,
    dateModified: post.publishedAt || post.date,
    author: {
      '@type': 'Person',
      name: 'Dima Fomin',
      url: 'https://dima-fomin.pl',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Dima Fomin',
      logo: {
        '@type': 'ImageObject',
        url: 'https://i.postimg.cc/W1KV4b43/logo1.webp',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://dima-fomin.pl/${locale}/blog/${slug}`,
    },
    inLanguage: locale,
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: t('home'),
        item: `https://dima-fomin.pl/${locale}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: t('blog'),
        item: `https://dima-fomin.pl/${locale}/blog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: `https://dima-fomin.pl/${locale}/blog/${slug}`,
      },
    ],
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <JsonLd data={jsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <Breadcrumb className="mb-8 md:mb-12">
        <BreadcrumbList className="text-sm font-medium">
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/" className="hover:text-primary transition-colors">{t('home')}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/blog" className="hover:text-primary transition-colors">{t('blog')}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-primary font-bold">{post.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <article className="relative">
        {/* Header */}
        <header className="mb-12">
          <div className="flex flex-wrap items-center gap-4 mb-8">
            <Badge className="px-4 py-1.5 rounded-xl bg-primary/10 text-primary border-primary/20 text-xs font-black uppercase tracking-widest italic hover:bg-primary/20 transition-colors">
              {post.category}
            </Badge>
            <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground/60 uppercase tracking-tight">
              <div className="flex items-center gap-1.5 border-l border-border/50 pl-4 first:border-0 first:pl-0">
                <Calendar className="h-3.5 w-3.5" />
                <time dateTime={post.date}>{post.date}</time>
              </div>
              {post.readTime && (
                <div className="flex items-center gap-1.5 border-l border-border/50 pl-4">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{post.readTime}</span>
                </div>
              )}
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black mb-8 text-foreground leading-[0.95] tracking-tighter">
            {post.title}
          </h1>
          
          {post.excerpt && (
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed font-medium mb-10 max-w-3xl border-l-4 border-primary/30 pl-6 italic">
              {post.excerpt}
            </p>
          )}

          <div className="flex items-center gap-3">
             <Button variant="outline" size="sm" className="rounded-xl h-10 px-6 font-bold border-2 hover:bg-primary hover:text-white transition-all shadow-sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
             </Button>
          </div>
        </header>

        {/* Hero Image */}
        {post.coverImage && (
          <div className="relative w-full aspect-[21/10] mb-16 rounded-[2.5rem] overflow-hidden border-2 border-border/50 shadow-2xl group">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          </div>
        )}

        <Separator className="mb-16 h-px bg-border/60" />

        <div className="prose prose-zinc dark:prose-invert max-w-none 
          prose-h2:text-4xl prose-h2:font-black prose-h2:tracking-tighter prose-h2:mt-16 prose-h2:mb-6 prose-h2:italic
          prose-p:text-lg prose-p:leading-relaxed prose-p:text-foreground/80
          prose-strong:text-primary prose-strong:font-black
          prose-li:text-lg prose-li:text-foreground/80">
          <MDXContent source={post.content} />
        </div>
        
        {/* Footer with author & CTA */}
        <footer className="mt-24 pt-16 border-t border-border/50">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-10">
            {/* Author */}
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-[2rem] overflow-hidden ring-4 ring-primary/10 rotate-3 shadow-xl">
                <Image
                  src="https://i.postimg.cc/W1KV4b43/logo1.webp"
                  alt="Chef Dima Fomin"
                  width={80}
                  height={80}
                  className="object-cover w-full h-full scale-110"
                />
              </div>
              <div>
                <div className="font-black text-2xl text-foreground tracking-tight italic">Dima Fomin</div>
                <div className="text-sm font-bold text-primary uppercase tracking-[0.2em]">{t('authorRole')}</div>
              </div>
            </div>
            
            {/* CTA */}
            <div className="flex flex-col items-start md:items-end gap-3">
              <Link
                href={`/blog?category=${encodeURIComponent(post.category)}`}
                className="inline-flex h-12 items-center px-6 rounded-2xl bg-muted/50 text-foreground font-bold hover:bg-primary hover:text-white transition-all border-2 border-transparent hover:border-primary/20"
              >
                {t('moreFromCategory')} {post.category}
              </Link>
              <Link 
                href="/blog"
                className="text-sm font-black text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest pl-2"
              >
                {t('allArticles')}
              </Link>
            </div>
          </div>
        </footer>
      </article>
    </div>
  );
}
