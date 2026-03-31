import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { JsonLd } from '@/components/JsonLd';
import { generateMetadata as sharedGenerateMetadata } from '@/lib/metadata';
import type { Metadata } from 'next';
import { ScrollReveal, StaggerReveal } from '@/components/ScrollReveal';
import { ExperienceAccordion } from '@/components/ExperienceAccordion';
import { ImageGallery } from '@/components/ImageGallery';
import {
  Flame,
  Scale,
  Target,
  Zap,
  Leaf,
  Award,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Calendar
} from 'lucide-react';

// ── API helpers ───────────────────────────────────────────────────────────────
const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://ministerial-yetta-fodi999-c58d8823.koyeb.app';

async function apiFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

type Locale = 'en' | 'pl' | 'ru' | 'uk';

function pick(obj: Record<string, unknown>, field: string, locale: Locale): string {
  return (obj[`${field}_${locale}`] ?? obj[`${field}_en`] ?? '') as string;
}

interface AboutData {
  id: string;
  image_url?: string;
  title_en: string; title_pl: string; title_ru: string; title_uk: string;
  content_en: string; content_pl: string; content_ru: string; content_uk: string;
}
interface ExpertiseItem {
  id: string; icon: string; order_index: number;
  title_en: string; title_pl: string; title_ru: string; title_uk: string;
}
interface ExperienceItem {
  id: string; restaurant: string; country: string; position: string;
  start_year?: number; end_year?: number;
  description_en: string; description_pl: string;
  description_ru: string; description_uk: string;
  order_index: number;
}
interface GalleryItem {
  id: string; image_url: string; order_index: number;
  category_id?: string; category_slug?: string;
  slug?: string; status?: string;
  title_en: string; title_pl: string; title_ru: string; title_uk: string;
  alt_en?: string; alt_pl?: string; alt_ru?: string; alt_uk?: string;
  description_en?: string; description_pl?: string;
  description_ru?: string; description_uk?: string;
  instagram_url?: string; pinterest_url?: string;
  facebook_url?: string; tiktok_url?: string; website_url?: string;
}
interface GalleryCategoryItem {
  id: string; slug: string; order_index: number;
  title_en: string; title_pl: string; title_ru: string; title_uk: string;
}
// ─────────────────────────────────────────────────────────────────────────────

export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: l } = await params;
  const locale = l as 'pl' | 'en' | 'uk' | 'ru';
  const t = await getTranslations({ locale, namespace: 'metadata' });

  const aboutData = await apiFetch<AboutData>('/public/about');
  const ogImage = aboutData?.image_url;

  return sharedGenerateMetadata({
    title: t('about.title'),
    description: t('about.description'),
    locale,
    path: '/about',
    ...(ogImage && { image: ogImage }),
  });
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: l } = await params;
  const locale = l as Locale;
  const t = await getTranslations({ locale, namespace: 'about' });

  // ── Fetch API data in parallel ─────────────────────────────────────────────
  const [aboutData, expertiseFromApi, experienceFromApi, galleryFromApi, galleryCatsFromApi] = await Promise.all([
    apiFetch<AboutData>('/public/about'),
    apiFetch<ExpertiseItem[]>('/public/expertise'),
    apiFetch<ExperienceItem[]>('/public/experience'),
    apiFetch<GalleryItem[]>('/public/gallery'),
    apiFetch<GalleryCategoryItem[]>('/public/gallery-categories'),
  ]);

  // ── Hero image & lead text from API ──────────────────────────────────────
  const heroImage = aboutData!.image_url!;
  const heroLead = pick(aboutData as unknown as Record<string, unknown>, 'content', locale);

  // ── Category labels from API ─────────────────────────────────────────────
  const categoryLabels: Record<string, string> = { all: pick({ all_en: 'All', all_pl: 'Wszystkie', all_ru: 'Все', all_uk: 'Всі' }, 'all', locale) };
  for (const cat of (galleryCatsFromApi ?? []).sort((a, b) => a.order_index - b.order_index)) {
    categoryLabels[cat.slug] = pick(cat as unknown as Record<string, unknown>, 'title', locale);
  }

  // ── Gallery from API ──────────────────────────────────────────────────────
  const galleryImages = (galleryFromApi ?? [])
    .sort((a, b) => a.order_index - b.order_index)
    .map(item => ({
      src: item.image_url,
      alt: pick(item as unknown as Record<string, unknown>, 'alt', locale)
        || pick(item as unknown as Record<string, unknown>, 'title', locale)
        || '',
      title: pick(item as unknown as Record<string, unknown>, 'title', locale) || undefined,
      description: pick(item as unknown as Record<string, unknown>, 'description', locale) || undefined,
      category: item.category_slug || undefined,
      slug: item.slug || undefined,
      instagram_url: item.instagram_url || undefined,
      pinterest_url: item.pinterest_url || undefined,
      facebook_url: item.facebook_url || undefined,
      tiktok_url: item.tiktok_url || undefined,
      website_url: item.website_url || undefined,
    }));

  // ── Experience from API ───────────────────────────────────────────────────
  const presentLabel = locale === 'ru' || locale === 'uk' ? 'по сей день' : 'present';
  const experiences = (experienceFromApi ?? [])
    .sort((a, b) => a.order_index - b.order_index)
    .map(e => {
      const raw = pick(e as unknown as Record<string, unknown>, 'description', locale);
      const responsibilities: string[] = raw
        .split('\n')
        .map(l => l.replace(/^[·\-•]\s*/, '').trim())
        .filter(Boolean);
      return {
        title: e.restaurant,
        role: e.position,
        period: e.end_year
          ? `${e.start_year} — ${e.end_year}`
          : `${e.start_year} — ${presentLabel}`,
        responsibilities,
      };
    });

  // ── Expertise from API ────────────────────────────────────────────────────
  const expertiseIcons = [Sparkles, Flame, Scale, Target, Zap, Leaf, Award, CheckCircle2];
  const expertiseItems: string[] = (expertiseFromApi ?? [])
    .sort((a, b) => a.order_index - b.order_index)
    .map(e => pick(e as unknown as Record<string, unknown>, 'title', locale));

  return (
    <div className="min-h-screen bg-background selection:bg-primary/10 selection:text-primary">
      {/* ── Single JSON-LD with @graph — один script вместо 4+1 ── */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "AboutPage",
              "@id": `https://dima-fomin.pl/${locale}/about`,
              "url": `https://dima-fomin.pl/${locale}/about`,
              "mainEntity": {
                "@type": "Person",
                "@id": "https://dima-fomin.pl/#person",
                "name": "Dmitrij Fomin",
                "jobTitle": "Sushi Chef & Food Technologist",
                "url": "https://dima-fomin.pl",
                "image": heroImage,
              },
            },
            ...galleryImages.map((img) => ({
              "@type": "ImageObject",
              "contentUrl": img.src,
              "name": img.title || img.alt,
              "description": img.description || img.alt,
              "url": `https://dima-fomin.pl/${locale}/about`,
              "author": {
                "@type": "Person",
                "@id": "https://dima-fomin.pl/#person",
                "name": "Dmitrij Fomin",
              },
            })),
          ],
        }}
      />

      <main className="mx-auto max-w-6xl px-4 sm:px-6">

        {/* ── Background Decorative Elements ── */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/[0.03] rounded-full blur-[150px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-primary/[0.02] rounded-full blur-[180px]" />
        </div>

        {/* ── Hero Section ── */}
        <section className="py-12 sm:py-20 lg:py-32 relative overflow-hidden">
          <div className="grid grid-cols-1 gap-8 sm:gap-12 lg:grid-cols-12 items-center">
            {/* Left Rail: Photo & Badges */}
            <aside className="lg:col-span-4 lg:sticky lg:top-24">
              <ScrollReveal direction="up" delay={0} duration={1000} scale={0.9} blur={10}>
                <div className="mx-auto max-w-xs sm:max-w-none rounded-[2.5rem] sm:rounded-[3rem] border border-border/40 bg-card p-4 sm:p-7 shadow-2xl overflow-hidden relative group hover-glow transition-all duration-700 hover:scale-[1.02]">
                  {/* Decorative glow */}
                  <div className="absolute -top-32 -left-32 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none group-hover:bg-primary/30 transition-all duration-700" />

                  <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] bg-muted/20 border border-white/10 shadow-inner">
                    <Image
                      src={heroImage}
                      alt="Dima Fomin"
                      fill
                      className="object-cover transition-transform duration-1000 group-hover:scale-110 ken-burns"
                      priority
                      loading="eager"
                      sizes="(max-width: 640px) 280px, (max-width: 1024px) 100vw, 33vw"
                    />
                    {/* Cinematic overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-60" />
                  </div>

                  {/* Badges with a more premium feel */}
                  <div className="mt-6 sm:mt-8 flex flex-wrap gap-2 justify-center">
                    {(t.raw('hero.badges') as string[]).map((badge) => (
                      <span
                        key={badge}
                        className="rounded-full border border-primary/10 bg-primary/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary/80 backdrop-blur-sm transition-all hover:bg-primary hover:text-white"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            </aside>

            {/* Right Pillar: Content */}
            <div className="lg:col-span-8">
              <ScrollReveal direction="right" delay={150} duration={800} distance={20}>
                <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-6 sm:mb-8 border border-primary/20 backdrop-blur-md">
                  <Sparkles className="w-3.5 h-3.5 fill-primary" />
                  <span>Professional Profile</span>
                </div>

                <h1 className="text-4xl font-black tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl italic uppercase leading-[0.85] text-shimmer mb-4">
                  Dima Fomin<span className="text-primary not-italic">.</span>
                </h1>

                <div className="mb-8">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-black uppercase text-foreground/90 italic tracking-tight leading-tight">
                    {t('subtitle')}
                  </h2>
                </div>

                <div className="relative pl-8 mb-10 group/quote">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/20 group-hover/quote:bg-primary transition-all duration-500 rounded-full" />
                  <p className="max-w-prose text-lg sm:text-xl md:text-2xl leading-relaxed text-foreground/80 font-medium italic">
                    {heroLead.split('\n\n')[0]}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row flex-wrap gap-4">
                  <Link
                    href="/contact"
                    className="rounded-2xl bg-primary px-8 py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-primary/20 transition-all hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-3 group hover:shadow-primary/30"
                  >
                    {t('hero.cta.contact')}
                    <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="/restaurants"
                    className="rounded-2xl border-2 border-border/60 bg-background/50 backdrop-blur-sm px-8 py-4 text-sm font-black uppercase tracking-widest text-foreground transition-all hover:bg-muted/30 hover:border-primary/40 text-center hover-lift"
                  >
                    {t('hero.cta.restaurants')}
                  </Link>
                </div>
              </ScrollReveal>

              {/* Metrics Grid with stagger */}
              <div className="mt-16 sm:mt-24 lg:mt-32">
                <StaggerReveal direction="up" staggerMs={150} className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {(t.raw('hero.metrics') as string[]).map((metric: string) => (
                    <div key={metric} className="rounded-[2rem] border-2 border-border/40 bg-card/30 backdrop-blur-md p-6 transition-all hover:border-primary/40 hover:shadow-2xl hover:-translate-y-2 group">
                      <div className="text-2xl sm:text-3xl font-black text-foreground italic uppercase tracking-tighter mb-1.5 group-hover:text-primary transition-colors">{metric}</div>
                      <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] leading-none opacity-60">Verified Skill</div>
                    </div>
                  ))}
                </StaggerReveal>
              </div>
            </div>
          </div>
        </section>

        {/* ── Mission ── */}
        <section className="py-16 sm:py-24">
          <ScrollReveal direction="up" delay={200} duration={1000} threshold={0.1}>
            <div className="bg-primary/[0.03] backdrop-blur-xl rounded-[2.5rem] sm:rounded-[3.5rem] p-8 sm:p-12 md:p-16 border border-primary/10 relative overflow-hidden group hover-glow transition-all duration-700">
              {/* Background text decoration */}
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[15rem] font-black italic text-primary/[0.015] select-none pointer-events-none uppercase tracking-tighter whitespace-nowrap">
                Philosophy
              </span>

              <div className="max-w-4xl relative z-10 flex flex-col md:flex-row gap-8 sm:gap-12 lg:gap-20 items-center">
                <div className="flex-1">
                  <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-primary mb-6 transition-all group-hover:tracking-[0.5em] duration-500 flex items-center gap-4">
                    <div className="w-12 h-0.5 bg-primary" />
                    {t('mission.title')}
                  </h2>
                  <p className="text-2xl sm:text-3xl md:text-4xl font-black italic tracking-tighter leading-[1.1] text-foreground transition-all duration-500">
                    &ldquo;{t('mission.content')}&rdquo;
                  </p>
                </div>

                <div className="shrink-0 grid grid-cols-1 gap-4 w-full md:w-auto md:min-w-[280px]">
                  {(t.raw('mission.values') as { label: string; desc: string }[]).map((item, idx) => (
                    <ScrollReveal key={item.label} direction="left" delay={500 + (idx * 150)} duration={800} distance={20}>
                      <div className="flex items-start gap-4 p-5 rounded-2xl bg-background/60 border border-white/5 backdrop-blur-sm group/val hover:bg-background transition-all duration-300">
                        <div className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0 animate-pulse group-hover/val:scale-150 transition-all" />
                        <div className="space-y-1 min-w-0">
                          <div className="text-[13px] font-black uppercase italic text-primary leading-none tracking-tight">{item.label}</div>
                          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none opacity-80">{item.desc}</div>
                        </div>
                      </div>
                    </ScrollReveal>
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* ── Expertise ── */}
        <section className="py-16 sm:py-24">
          <ScrollReveal direction="up" delay={200} duration={800} threshold={0.1}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 sm:mb-16">
              <div>
                <h2 className="text-4xl sm:text-5xl md:text-7xl font-black uppercase italic tracking-tighter text-foreground leading-none text-shimmer">
                  {t('expertise.title')}<span className="text-primary not-italic">.</span>
                </h2>
              </div>
              <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] md:text-right max-w-xs border-primary/30 md:border-r-2 md:pr-6 leading-relaxed opacity-60">
                {t('expertise.subtitle')}
              </p>
            </div>

            <StaggerReveal direction="up" staggerMs={100} className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {expertiseItems.map((item: string, index: number) => {
                const Icon = expertiseIcons[index % expertiseIcons.length];
                return (
                  <div
                    key={index}
                    className="group p-6 sm:p-8 bg-card/50 backdrop-blur-sm rounded-[2rem] sm:rounded-[2.5rem] border border-border/40 hover:bg-muted/10 transition-all duration-500 hover:border-primary/30 hover:shadow-2xl hover:-translate-y-2"
                  >
                    <div className="mb-6 rounded-2xl bg-primary/10 w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-700 shadow-inner">
                      <Icon className="w-6 h-6 sm:w-8 sm:h-8" />
                    </div>
                    <h3 className="font-black uppercase tracking-tight text-foreground/90 text-sm sm:text-base md:text-lg leading-tight group-hover:text-primary transition-colors duration-300">
                      {item}
                    </h3>
                  </div>
                );
              })}
            </StaggerReveal>
          </ScrollReveal>
        </section>

        {/* ── Experience ── */}
        <section className="py-16 sm:py-24 border-t border-border/40">
          <ScrollReveal direction="up" duration={800} threshold={0.1}>
            {/* Header above cards */}
            <div className="mb-12 sm:mb-16 space-y-4">
              <span className="text-[11px] font-black uppercase tracking-[0.6em] text-primary block transition-all hover:tracking-[0.8em] duration-700">
                {t('experience.haccp')}
              </span>
              <h2 className="text-4xl sm:text-5xl md:text-7xl font-black uppercase italic tracking-tighter text-foreground leading-[0.85] text-shimmer">
                {t('experience.title')}<span className="text-primary not-italic">.</span>
              </h2>
              <div className="flex items-center gap-4 text-sm font-black text-muted-foreground uppercase tracking-[0.3em] pt-4">
                <div className="w-12 sm:w-20 h-px bg-primary/40 transition-all duration-700 hover:w-32" />
                2002 — 2026
              </div>
            </div>

            {/* Experience Cards */}
            <ExperienceAccordion experiences={experiences} />
          </ScrollReveal>
        </section>

        {/* ── Education ── */}
        <section className="py-16 sm:py-24 border-t border-border/40">
          <ScrollReveal direction="up" duration={1000} scale={0.95} blur={10}>
            <div className="rounded-[2.5rem] sm:rounded-[3.5rem] md:rounded-[4.5rem] border-2 border-border/40 bg-card p-8 sm:p-12 md:p-20 relative overflow-hidden group hover-glow transition-all duration-1000">
              <div className="absolute top-0 left-0 w-2 h-full bg-primary/20 group-hover:bg-primary transition-all duration-700" />
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-primary/20 transition-all duration-1000" />

              <h2 className="text-[11px] font-black uppercase tracking-[0.6em] text-primary/60 mb-8 italic">
                Formal Background
              </h2>

              <div className="max-w-4xl relative z-10">
                <h3 className="text-3xl sm:text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4 italic leading-[1.1] text-foreground group-hover:text-primary transition-colors duration-500">
                  {t('education.degree')}
                </h3>
                <p className="text-lg sm:text-xl md:text-2xl font-bold uppercase tracking-tight text-foreground/80 mb-6">
                  {t('education.school')}
                </p>
                <div className="flex items-center gap-4 text-sm font-black text-muted-foreground uppercase tracking-[0.2em]">
                  <Calendar className="w-4 h-4" />
                  {t('education.period')}
                </div>

                <div className="mt-12 flex flex-wrap gap-4 sm:gap-6">
                  <div className="flex items-center gap-3 sm:gap-4 px-6 sm:px-8 py-3.5 sm:py-5 rounded-[1.5rem] sm:rounded-[2rem] bg-background border border-primary/10 shadow-sm group/badge hover:bg-primary hover:text-white transition-all duration-500">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse group-hover/badge:bg-white" />
                    <span className="text-[11px] sm:text-[13px] font-black uppercase tracking-widest leading-none">{t('education.honors')}</span>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 px-6 sm:px-8 py-3.5 sm:py-5 rounded-[1.5rem] sm:rounded-[2rem] bg-background border border-border/60 shadow-sm group/badge hover:bg-muted/30 transition-all duration-500">
                    <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
                    <span className="text-[11px] sm:text-[13px] font-black uppercase tracking-widest leading-none">{t('education.internship')}</span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* ── Gallery ── */}
        <section className="py-16 sm:py-24">
          <ScrollReveal direction="up" duration={800} threshold={0.1}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 sm:gap-12 mb-12 sm:mb-20">
              <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-foreground tracking-tighter uppercase italic leading-[0.85] text-shimmer">
                {t('gallery')}<span className="text-primary not-italic">.</span>
              </h2>
              <div className="flex flex-col sm:items-end gap-3 sm:text-right">
                <p className="text-[11px] font-black uppercase tracking-[0.6em] text-primary">{t('gallery_journal')}</p>
                <p className="text-[13px] text-muted-foreground uppercase tracking-[0.1em] font-bold max-w-sm border-primary/40 sm:border-r-2 sm:pr-8 leading-relaxed opacity-60">
                  {t('gallery_subtitle')}
                </p>
              </div>
            </div>
          </ScrollReveal>
          
          <ScrollReveal direction="up" delay={300} duration={1000} threshold={0.05}>
            {galleryImages.length > 0 ? (
              <div className="rounded-[3rem] overflow-hidden border-2 border-border/40 hover-glow transition-all duration-1000">
                <ImageGallery
                  images={galleryImages}
                  categoryLabels={categoryLabels}
                />
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-20 font-black uppercase tracking-widest opacity-30 italic">Gallery coming soon</p>
            )}
          </ScrollReveal>

          <ScrollReveal direction="up" delay={500} duration={800} threshold={0} distance={20}>
            <div className="mt-20 sm:mt-32 text-center">
              <Link
                href="/contact"
                className="inline-flex items-center gap-4 sm:gap-6 text-sm sm:text-base font-black uppercase tracking-[0.3em] sm:tracking-[0.5em] text-foreground hover:text-primary transition-all duration-700 group hover:scale-[1.05]"
              >
                <div className="w-12 h-0.5 bg-primary/20 group-hover:w-20 transition-all duration-700" />
                {t('collaboration')}
                <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-3 duration-700" />
              </Link>
            </div>
          </ScrollReveal>
        </section>

      </main>
    </div>
  );
}
