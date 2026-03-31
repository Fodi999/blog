import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getAllPosts } from '@/lib/posts';
import type { Metadata } from 'next';
import { BlogContent } from './BlogContent';
import { JsonLd } from '@/components/JsonLd';
import { generateMetadata as sharedGenerateMetadata } from '@/lib/metadata';
import { ScrollReveal } from '@/components/ScrollReveal';
import { Sparkles } from 'lucide-react';

export const dynamic = 'force-static';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: l } = await params;
  setRequestLocale(l);
  const locale = l as 'pl' | 'en' | 'uk' | 'ru';
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return sharedGenerateMetadata({
    title: t('blog.title'),
    description: t('blog.description'),
    locale,
    path: '/blog',
  });
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
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
      
      {/* ── Background Decorative Elements ── */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 -right-1/4 w-[600px] h-[600px] bg-primary/[0.03] rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 -left-1/4 w-[500px] h-[500px] bg-primary/[0.02] rounded-full blur-[180px]" />
      </div>
      
      <div className="mb-16 md:mb-24 lg:mb-32">
        <ScrollReveal direction="left" delay={0} duration={800} distance={20}>
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-8 border border-primary/20 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 fill-primary" />
            <span>Curated Insights</span>
          </div>
        </ScrollReveal>

        <ScrollReveal direction="left" delay={200} duration={900} distance={30} blur={8}>
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black mb-8 text-foreground tracking-tighter uppercase italic leading-[0.85] text-shimmer">
            {t('title')}<span className="text-primary not-italic">.</span>
          </h1>
        </ScrollReveal>

        <ScrollReveal direction="left" delay={400} duration={800} distance={20}>
          <p className="text-xl md:text-3xl text-muted-foreground max-w-2xl font-medium tracking-tight leading-relaxed">
            {t('subtitle')}
          </p>
        </ScrollReveal>
      </div>

      <BlogContent posts={posts} categories={categories} />
    </div>
  );
}
