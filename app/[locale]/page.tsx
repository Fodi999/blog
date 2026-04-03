import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { PostCard } from '@/components/PostCard';
import { HeroImage } from '@/components/HeroImage';
import { ImageGallery } from '@/components/ImageGallery';
import { ScrollReveal } from '@/components/ScrollReveal';
import { ArrowRight, Sparkles, BookOpen, Scale, Search, Fish, FlaskConical, Utensils } from 'lucide-react';
import { getLatestPosts } from '@/lib/posts';
import { Button } from '@/components/ui/button';
import { JsonLd } from '@/components/JsonLd';
import { generateMetadata as sharedGenerateMetadata } from '@/lib/metadata';
import type { Metadata } from 'next';

export const revalidate = 60;

export function generateStaticParams() {
  return [{ locale: 'pl' }, { locale: 'en' }, { locale: 'ru' }, { locale: 'uk' }];
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://ministerial-yetta-fodi999-c58d8823.koyeb.app';

type Locale = 'en' | 'pl' | 'ru' | 'uk';

function pick(obj: Record<string, unknown>, field: string, locale: Locale): string {
  return (obj[`${field}_${locale}`] ?? obj[`${field}_en`] ?? '') as string;
}

interface GalleryItem {
  id: string; image_url: string; order_index: number;
  category?: string;
  title_en: string; title_pl: string; title_ru: string; title_uk: string;
  alt_en?: string; alt_pl?: string; alt_ru?: string; alt_uk?: string;
  description_en?: string; description_pl?: string;
  description_ru?: string; description_uk?: string;
}

interface AboutData {
  id: string;
  image_url?: string;
}

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
  setRequestLocale(locale);
  const loc = locale as Locale;
  const t = await getTranslations({ locale, namespace: 'home' });
  
  const [latestPosts, galleryFromApi, aboutFromApi] = await Promise.all([
    getLatestPosts(locale, 6),
    fetch(`${API}/public/gallery`, { next: { revalidate: 60 } })
      .then(r => r.ok ? r.json() as Promise<GalleryItem[]> : [])
      .catch(() => [] as GalleryItem[]),
    fetch(`${API}/public/about`, { next: { revalidate: 60 } })
      .then(r => r.ok ? r.json() as Promise<AboutData> : null)
      .catch(() => null),
  ]);

  const aboutImage = (aboutFromApi as AboutData | null)?.image_url ?? null;

  const galleryImages = (galleryFromApi as GalleryItem[])
    .sort((a, b) => a.order_index - b.order_index)
    .map(item => ({
      src: item.image_url,
      alt: pick(item as unknown as Record<string, unknown>, 'alt', loc)
        || pick(item as unknown as Record<string, unknown>, 'title', loc)
        || '',
      title: pick(item as unknown as Record<string, unknown>, 'title', loc) || undefined,
      description: pick(item as unknown as Record<string, unknown>, 'description', loc) || undefined,
      category: item.category || undefined,
    }));

  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Dima Fomin',
    jobTitle: 'Sushi Chef & Food Technologist',
    url: 'https://dima-fomin.pl',
    image: 'https://i.postimg.cc/W1KV4b43/logo1.webp',
    description: t('aboutSection.description'),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <JsonLd data={personJsonLd} />

      {/* ═══ Hero Section — 2026 Immersive Editorial ═══ */}
      <section className="relative py-20 lg:py-40 overflow-hidden grain-overlay">
        {/* Subtle decorative glow — invisible on light, soft on dark */}
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/[0.03] rounded-full blur-[150px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl">
          <ScrollReveal direction="up" delay={0} duration={800} blur={8}>
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-[0.2em] mb-10 border border-primary/20 backdrop-blur-md animate-pulse-glow">
              <Sparkles className="h-3.5 w-3.5 fill-primary" />
              {t('hero.subtitle')}
            </div>
          </ScrollReveal>
          
          <ScrollReveal direction="up" delay={200} duration={900} blur={12}>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter text-foreground mb-10 leading-[0.85] uppercase italic text-shimmer">
              {t('hero.title')}<span className="text-primary not-italic">.</span>
            </h1>
          </ScrollReveal>
          
          <ScrollReveal direction="up" delay={400} duration={800}>
            <p className="text-2xl md:text-3xl font-bold text-foreground/80 mb-10 leading-tight max-w-2xl tracking-tight">
              {t('hero.tagline')}
            </p>
          </ScrollReveal>
          
          <ScrollReveal direction="left" delay={600} duration={800}>
            <div className="relative pl-8 mb-16 group">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary/20 group-hover:bg-primary group-hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all duration-500 rounded-full" />
              <p className="text-xl text-muted-foreground italic font-medium leading-relaxed max-w-xl">
                &ldquo;{t('hero.philosophy')}&rdquo;
              </p>
            </div>
          </ScrollReveal>
          
          <ScrollReveal direction="up" delay={800} duration={700}>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="h-14 px-8 rounded-2xl text-base font-black uppercase tracking-wider group hover-lift">
                <Link href="/blog">
                  <BookOpen className="mr-2 h-5 w-5" />
                  {t('hero.readBlog')}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 px-8 rounded-2xl text-base font-black uppercase tracking-wider group border-2 hover:bg-primary hover:text-white hover:border-primary transition-all hover-lift">
                <Link href="/restaurants">
                  {t('hero.cta')}
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </ScrollReveal>
        </div>
        
        <ScrollReveal direction="up" delay={400} duration={1200} distance={60}>
          <div className="mt-24 lg:mt-32 relative">
            <HeroImage 
              src="https://i.postimg.cc/RCf8VLFn/DSCF4639.jpg"
              alt="Dima Fomin - Sushi Chef"
              priority
            />
            {/* Article overlay card on hero image */}
            {latestPosts.length > 0 && (
              <Link href={`/blog/${latestPosts[0].slug}`} className="group/featured absolute bottom-6 left-6 right-6 md:left-auto md:right-8 md:bottom-8 md:max-w-sm z-10 block">
                <div className="glass-card rounded-2xl p-5 transition-all duration-500 group-hover/featured:border-primary/40 hover-lift">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
                      <Sparkles className="h-2.5 w-2.5 fill-primary" />
                      {t('featuredArticle')}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      {latestPosts[0].readTime}
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-white tracking-tight leading-tight line-clamp-2 mb-3 group-hover/featured:text-primary transition-colors uppercase italic">
                    {latestPosts[0].title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-primary text-xs font-black uppercase tracking-widest group-hover/featured:gap-2.5 transition-all">
                    {t('readMore')}
                    <ArrowRight className="h-3.5 w-3.5 stroke-[3px]" />
                  </div>
                </div>
              </Link>
            )}
          </div>
        </ScrollReveal>
      </section>

      {/* ═══ Latest Posts ═══ */}
      <section className="py-32 lg:py-40 border-t border-border/40 relative">
        <ScrollReveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground uppercase italic mb-3">
                {t('latestPosts')}
              </h2>
              <div className="h-1.5 w-24 bg-primary rounded-full animate-pulse-glow" />
            </div>
            <Button variant="ghost" asChild className="text-primary font-black uppercase tracking-widest px-0 hover:bg-transparent hover:text-primary/80 group link-underline">
              <Link href="/blog">
                {t('allArticles')} <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </ScrollReveal>

        {/* Grid: 3 columns with stagger */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {latestPosts.slice(0, 6).map((post, i) => (
            <ScrollReveal key={post.slug} delay={i * 100} duration={700}>
              <PostCard {...post} />
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ═══ Chef Tools Teaser ═══ */}
      <section className="py-32 lg:py-40 border-t border-border/40">
        <ScrollReveal>
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
            <Button variant="ghost" asChild className="text-primary font-black uppercase tracking-widest px-0 hover:bg-transparent hover:text-primary/80 group link-underline">
              <Link href="/chef-tools">
                {t('chefToolsSection.link')} <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </ScrollReveal>
        
        <ScrollReveal delay={200}>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { href: '/chef-tools/ingredients', icon: Search, title: t('chefToolsSection.ingredientsTitle'), desc: t('chefToolsSection.ingredientsDesc') },
              { href: '/chef-tools/fish-season', icon: Fish, title: t('chefToolsSection.fishSeasonTitle'), desc: t('chefToolsSection.fishSeasonDesc') },
              { href: '/chef-tools/lab', icon: FlaskConical, title: t('chefToolsSection.labTitle'), desc: t('chefToolsSection.labDesc') },
              { href: '/chef-tools/converter', icon: Scale, title: t('chefToolsSection.converterTitle'), desc: t('chefToolsSection.converterDesc') },
              { href: '/chef-tools/flavor-pairing', icon: Utensils, title: t('chefToolsSection.flavorPairingTitle'), desc: t('chefToolsSection.flavorPairingDesc') },
            ].map(({ href, icon: Icon, title, desc }) => (
              <Link key={href} href={href}>
                <div className="group border-2 border-border/60 rounded-3xl p-8 hover:border-primary/40 transition-all duration-500 bg-background h-full hover-lift hover-glow glow-border">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-500">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-foreground mb-2 group-hover:text-primary transition-colors italic">{title}</h3>
                  <p className="text-muted-foreground font-medium text-sm leading-relaxed">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* ═══ About Section — Premium Card ═══ */}
      <section className="py-32 lg:py-40 border-t border-border/40">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div className="order-2 lg:order-1">
            <ScrollReveal direction="left" duration={900}>
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground mb-10 uppercase italic leading-[0.85]">
                {t('aboutSection.title')}
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="left" delay={200} duration={800}>
              <p className="text-2xl text-muted-foreground leading-relaxed mb-12 font-medium tracking-tight">
                {t('aboutSection.description')}
              </p>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={400} duration={700}>
              <Button asChild size="lg" variant="outline" className="h-16 px-10 rounded-2xl border-2 text-lg font-black uppercase tracking-wider group transition-all hover:bg-primary hover:text-white hover:border-primary hover-lift">
                <Link href="/about">
                  {t('aboutSection.cta')}
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </ScrollReveal>
          </div>
          <ScrollReveal direction="right" delay={200} duration={1000} className="order-1 lg:order-2">
            {aboutImage && (
              <div className="relative group">
                <div className="absolute -inset-4 bg-primary/10 rounded-[4rem] -rotate-3 transition-transform duration-700 group-hover:rotate-0 group-hover:scale-105" />
                <div className="absolute -inset-8 bg-primary/5 rounded-[5rem] rotate-3 transition-transform duration-700 group-hover:-rotate-1 group-hover:scale-110 blur-sm" />
                <div className="relative aspect-square rounded-[3.5rem] overflow-hidden border-2 border-border/60 shadow-2xl hover-glow">
                  <img
                    src={aboutImage}
                    alt="Dima Fomin"
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
                </div>
              </div>
            )}
          </ScrollReveal>
        </div>
      </section>

      {/* ═══ Gallery Section ═══ */}
      {galleryImages.length > 0 && (
        <section className="py-32 border-t border-border/40">
          <ScrollReveal>
            <div className="flex flex-col items-center text-center mb-16">
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground uppercase italic mb-4">
                {t('gallery.title')}
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl font-medium">
                {t('gallery.description')}
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={200} duration={1000}>
            <ImageGallery images={galleryImages} />
          </ScrollReveal>
        </section>
      )}
    </div>
  );
}
