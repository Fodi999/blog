import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { PostCard } from '@/components/PostCard';
import { HeroImage } from '@/components/HeroImage';
import { ImageGallery } from '@/components/ImageGallery';
import { ArrowRight, Sparkles } from 'lucide-react';
import { getLatestPosts } from '@/lib/posts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { JsonLd } from '@/components/JsonLd';

export const dynamic = 'force-static';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  
  const latestPosts = await getLatestPosts(locale, 3);

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
          
          <div className="flex flex-wrap gap-6">
            <Button asChild size="lg" className="h-16 px-10 rounded-2xl text-lg font-black uppercase tracking-wider group">
              <Link href="/restaurants">
                {t('hero.cta')}
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="mt-24 lg:mt-32">
          <HeroImage 
            src="https://i.postimg.cc/RCf8VLFn/DSCF4639.jpg"
            alt="Dima Fomin - Sushi Chef"
            priority
          />
        </div>
      </section>

      {/* Featured Article - Cinematic Look */}
      <section className="py-32 border-t border-border/40">
        <div className="flex items-center gap-6 mb-16">
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground uppercase italic px-2">
            {t('featuredArticle')}
          </h2>
          <Separator className="flex-1 h-px bg-gradient-to-r from-border/80 to-transparent" />
        </div>
        
        {latestPosts.length > 0 && (
          <div className="mb-24">
            <Link href={`/blog/${latestPosts[0].slug}`} className="group block">
              <div className="relative overflow-hidden rounded-[3rem] border-2 border-border/60 bg-muted/10 transition-all duration-500 hover:border-primary/40 hover:shadow-[0_0_50px_-12px_rgba(var(--primary),0.2)]">
                <div className="grid grid-cols-1 lg:grid-cols-2 lg:min-h-[600px]">
                  <div className="relative h-[400px] lg:h-auto overflow-hidden">
                    <img 
                      src={latestPosts[0].coverImage || ''}
                      alt={latestPosts[0].title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/10 transition-opacity group-hover:opacity-0" />
                  </div>
                  <div className="p-10 lg:p-20 flex flex-col justify-center">
                    <div className="flex items-center gap-4 mb-10">
                      <Badge className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest italic hover:bg-primary transition-colors">
                        {latestPosts[0].category}
                      </Badge>
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        {latestPosts[0].readTime}
                      </span>
                    </div>
                    <h3 className="text-4xl lg:text-6xl font-black mb-10 text-foreground leading-[0.9] tracking-tighter uppercase italic group-hover:text-primary transition-colors">
                      {latestPosts[0].title}
                    </h3>
                    <p className="text-xl text-muted-foreground mb-12 line-clamp-3 leading-relaxed font-medium">
                      {latestPosts[0].excerpt}
                    </p>
                    <div className="flex items-center gap-3 text-primary text-xl font-black uppercase tracking-tighter group-hover:gap-5 transition-all">
                      {t('readMore')} 
                      <ArrowRight className="h-6 w-6 stroke-[3px]" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Latest Posts Bento Grid */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground uppercase italic mb-2">
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-32">
          {latestPosts.slice(1, 4).map((post) => (
            <PostCard key={post.slug} {...post} />
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
