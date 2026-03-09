import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { PostCard } from '@/components/PostCard';
import { HeroImage } from '@/components/HeroImage';
import { ImageGallery } from '@/components/ImageGallery';
import { ArrowRight, Sparkles, BookOpen, Scale } from 'lucide-react';
import { getLatestPosts } from '@/lib/posts';
import { Button } from '@/components/ui/button';
import { JsonLd } from '@/components/JsonLd';
import { generateMetadata as sharedGenerateMetadata } from '@/lib/metadata';
import type { Metadata } from 'next';

export const dynamic = 'force-static';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: l } = await params;
  const locale = l as 'pl' | 'en' | 'uk' | 'ru';
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return sharedGenerateMetadata({
    title: t('title'),
    description: t('description'),
    locale,
    path: '',
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  
  const latestPosts = await getLatestPosts(locale, 6);

  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Dima Fomin',
    jobTitle: 'Sushi Chef & Food Technologist',
    url: 'https://dima-fomin.pl',
    image: 'https://i.postimg.cc/W1KV4b43/logo1.webp',
    description: t('aboutSection.description'),
  };

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <JsonLd data={personJsonLd} />
      {/* Hero Section - 2026 Premium Editorial */}
      <section className="relative py-20 lg:py-40 overflow-hidden">
        <div className="relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-[0.2em] mb-10 border border-primary/20 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 fill-primary" />
            {t('hero.subtitle')}
          </div>
          
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter text-foreground mb-10 leading-[0.85] uppercase italic">
            {t('hero.title')}<span className="text-primary not-italic">.</span>
          </h1>
          
          <p className="text-2xl md:text-3xl font-bold text-foreground/80 mb-10 leading-tight max-w-2xl tracking-tight">
            {t('hero.tagline')}
          </p>
          
          <div className="relative pl-8 mb-16 group">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary/20 group-hover:bg-primary transition-colors rounded-full" />
            <p className="text-xl text-muted-foreground italic font-medium leading-relaxed max-w-xl">
              "{t('hero.philosophy')}"
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg" className="h-14 px-8 rounded-2xl text-base font-black uppercase tracking-wider group">
              <Link href="/blog">
                <BookOpen className="mr-2 h-5 w-5" />
                {t('hero.readBlog')}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 px-8 rounded-2xl text-base font-black uppercase tracking-wider group border-2 hover:bg-primary hover:text-white hover:border-primary transition-all">
              <Link href="/restaurants">
                {t('hero.cta')}
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="mt-24 lg:mt-32 relative">
          <HeroImage 
            src="https://i.postimg.cc/RCf8VLFn/DSCF4639.jpg"
            alt="Dima Fomin - Sushi Chef"
            priority
          />
          {/* Article overlay card on hero image */}
          {latestPosts.length > 0 && (
            <Link href={`/blog/${latestPosts[0].slug}`} className="group absolute bottom-6 left-6 right-6 md:left-auto md:right-8 md:bottom-8 md:max-w-sm z-10 block">
              <div className="bg-background/90 dark:bg-background/95 backdrop-blur-md rounded-2xl p-5 border border-border/60 shadow-2xl transition-all duration-300 group-hover:border-primary/40 group-hover:shadow-primary/10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
                    <Sparkles className="h-2.5 w-2.5 fill-primary" />
                    {t('featuredArticle')}
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    {latestPosts[0].readTime}
                  </span>
                </div>
                <h3 className="text-sm font-black text-foreground tracking-tight leading-tight line-clamp-2 mb-3 group-hover:text-primary transition-colors uppercase italic">
                  {latestPosts[0].title}
                </h3>
                <div className="flex items-center gap-1.5 text-primary text-xs font-black uppercase tracking-widest group-hover:gap-2.5 transition-all">
                  {t('readMore')}
                  <ArrowRight className="h-3.5 w-3.5 stroke-[3px]" />
                </div>
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* Latest Posts */}
      <section className="py-40 border-t border-border/40">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground uppercase italic mb-3">
              {t('latestPosts')}
            </h2>
            <div className="h-1.5 w-24 bg-primary rounded-full" />
          </div>
          <Button variant="ghost" asChild className="text-primary font-black uppercase tracking-widest px-0 hover:bg-transparent hover:text-primary/80 group">
            <Link href="/blog">
              {t('allArticles')} <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        {/* Grid: 3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {latestPosts.slice(0, 6).map((post) => (
            <PostCard key={post.slug} {...post} />
          ))}
        </div>
      </section>

      {/* Chef Tools Teaser */}
      <section className="py-40 border-t border-border/40">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground uppercase italic mb-3">
              {t('chefToolsSection.title')}
            </h2>
            <div className="h-1.5 w-24 bg-primary rounded-full" />
            <p className="text-xl text-muted-foreground font-medium mt-4 max-w-xl">
              {t('chefToolsSection.description')}
            </p>
          </div>
          <Button variant="ghost" asChild className="text-primary font-black uppercase tracking-widest px-0 hover:bg-transparent hover:text-primary/80 group">
            <Link href="/chef-tools">
              {t('chefToolsSection.link')} <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
        <div className="grid md:grid-cols-1 max-w-md gap-6">
          {[
            { href: '/chef-tools/converter', icon: Scale, title: t('chefToolsSection.converterTitle'), desc: t('chefToolsSection.converterDesc') },
          ].map(({ href, icon: Icon, title, desc }) => (
            <Link key={href} href={href}>
              <div className="group border-2 border-border/60 rounded-3xl p-8 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 bg-background h-full">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-tight text-foreground mb-2 group-hover:text-primary transition-colors italic">{title}</h3>
                <p className="text-muted-foreground font-medium text-sm leading-relaxed">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* About Section - Premium Card */}
      <section className="py-40 border-t border-border/40">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div className="order-2 lg:order-1">
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground mb-10 uppercase italic leading-[0.85]">
              {t('aboutSection.title')}
            </h2>
            <p className="text-2xl text-muted-foreground leading-relaxed mb-12 font-medium tracking-tight">
              {t('aboutSection.description')}
            </p>
            <Button asChild size="lg" variant="outline" className="h-16 px-10 rounded-2xl border-2 text-lg font-black uppercase tracking-wider group transition-all hover:bg-primary hover:text-white hover:border-primary">
              <Link href="/about">
                {t('aboutSection.cta')}
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
          <div className="order-1 lg:order-2">
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/10 rounded-[4rem] -rotate-3 transition-transform group-hover:rotate-0" />
              <div className="relative aspect-square rounded-[3.5rem] overflow-hidden border-2 border-border/60 shadow-2xl">
                <img 
                  src="https://i.postimg.cc/K8QChcY9/DSCF4689.jpg" 
                  alt="Dima Fomin" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-32 border-t border-border/40">
        <div className="flex flex-col items-center text-center mb-16">
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground uppercase italic mb-4">
            {t('gallery.title')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl font-medium">
            {t('gallery.description')}
          </p>
        </div>
        <ImageGallery images={galleryImages} />
      </section>
    </div>
  );
}
