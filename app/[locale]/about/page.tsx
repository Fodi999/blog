import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { JsonLd } from '@/components/JsonLd';
import { generateMetadata as sharedGenerateMetadata } from '@/lib/metadata';
import type { Metadata } from 'next';
import { ExperienceAccordion } from '@/components/ExperienceAccordion';
import { ImageGallery } from '@/components/ImageGallery';
import {
  ChefHat,
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
  const expertiseIcons = [ChefHat, Flame, Scale, Target, Zap, Leaf, Award, CheckCircle2];
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

        {/* ── Hero Section ── */}
        <section className="py-10 sm:py-14 md:py-20">
          <div className="grid grid-cols-1 gap-8 sm:gap-12 lg:grid-cols-12 items-center">
            {/* Left Rail: Photo & Badges */}
            <aside className="lg:col-span-4 lg:sticky lg:top-24">
              <div className="mx-auto max-w-xs sm:max-w-none rounded-[2rem] sm:rounded-[2.5rem] border border-border/40 bg-card p-4 sm:p-6 shadow-2xl overflow-hidden relative group">
                {/* Decorative glow */}
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/20 rounded-full blur-[80px] pointer-events-none" />

                <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] bg-muted/20">
                  <Image
                    src={heroImage}
                    alt="Dima Fomin"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    priority
                    loading="eager"
                    sizes="(max-width: 640px) 280px, (max-width: 1024px) 100vw, 33vw"
                  />
                </div>

                {/* Badges */}
                <div className="mt-4 sm:mt-6 flex flex-wrap gap-1.5 sm:gap-2">
                  {(t.raw('hero.badges') as string[]).map((badge) => (
                    <span
                      key={badge}
                      className="rounded-full border border-border/60 bg-muted/50 px-3 sm:px-4 py-1 sm:py-1.5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-foreground/70"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            </aside>

            {/* Right Pillar: Content */}
            <div className="lg:col-span-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-4 sm:mb-6">
                <Sparkles className="w-3 h-3" />
                <span>Professional Profile</span>
              </div>

              <h1 className="text-3xl font-black tracking-tight sm:text-5xl md:text-6xl lg:text-7xl italic uppercase leading-[0.9]">
                Dima Fomin<span className="text-primary">.</span>
              </h1>

              <div className="mt-3 sm:mt-4 mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl md:text-2xl font-black uppercase text-foreground/90 italic tracking-tight">
                  {t('subtitle')}
                </h2>
              </div>

              <p className="mt-6 sm:mt-8 max-w-prose text-base sm:text-lg md:text-xl leading-relaxed text-foreground/80 font-medium">
                {heroLead.split('\n\n')[0]}
              </p>

              <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
                <Link
                  href="/contact"
                  className="rounded-full bg-primary px-6 sm:px-8 py-3 sm:py-4 text-xs sm:text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 group"
                >
                  {t('hero.cta.contact')}
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/restaurants"
                  className="rounded-full border border-border/60 bg-card px-6 sm:px-8 py-3 sm:py-4 text-xs sm:text-sm font-black uppercase tracking-widest text-foreground transition-all hover:bg-muted/30 text-center"
                >
                  {t('hero.cta.restaurants')}
                </Link>
              </div>

              {/* Metrics Grid */}
              <div className="mt-10 sm:mt-16 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
                {(t.raw('hero.metrics') as string[]).map((metric: string) => (
                  <div key={metric} className="rounded-2xl sm:rounded-3xl border border-border/40 bg-card p-3 sm:p-5 transition-all hover:border-primary/20 hover:shadow-md">
                    <div className="text-lg sm:text-2xl font-black text-foreground italic uppercase tracking-tighter mb-1">{metric}</div>
                    <div className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Verified</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Mission ── */}
        <section className="py-8 sm:py-10 border-t border-border/40">
          <div className="bg-primary/[0.03] rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 md:p-10 border border-primary/5 relative overflow-hidden group">
            <div className="max-w-4xl relative z-10 flex flex-col md:flex-row gap-6 sm:gap-8 lg:gap-12 items-start">
              <div className="flex-1">
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-3 sm:mb-4 flex items-center gap-3">
                  <div className="w-8 h-0.5 bg-primary" />
                  {t('mission.title')}
                </h2>
                <p className="text-lg sm:text-xl md:text-2xl font-black italic tracking-tighter leading-tight text-foreground/90">
                  {t('mission.content')}
                </p>
              </div>

              <div className="shrink-0 grid grid-cols-1 gap-3 sm:gap-4 w-full md:w-auto md:min-w-[240px]">
                {(t.raw('mission.values') as { label: string; desc: string }[]).map((item) => (
                  <div key={item.label} className="flex items-start gap-3 p-3 rounded-xl bg-background/50 border border-border/40">
                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    <div className="space-y-0.5 min-w-0">
                      <div className="text-[11px] font-black uppercase italic text-primary leading-none">{item.label}</div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Expertise ── */}
        <section className="py-10 sm:py-14 md:py-20">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 sm:gap-6 mb-8 sm:mb-12">
            <div>
              <h2 className="text-3xl sm:text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-foreground leading-none">
                {t('expertise.title')}<span className="text-primary">.</span>
              </h2>
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] md:text-right max-w-xs">
              {t('expertise.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {expertiseItems.map((item: string, index: number) => {
              const Icon = expertiseIcons[index % expertiseIcons.length];
              return (
                <div
                  key={index}
                  className="group p-4 sm:p-6 bg-card rounded-2xl sm:rounded-3xl border border-border/40 hover:bg-muted/20 transition-all duration-300 hover:border-primary/20"
                >
                  <div className="mb-3 sm:mb-4 rounded-xl sm:rounded-2xl bg-primary/10 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h3 className="font-black uppercase tracking-tight text-foreground/90 text-xs sm:text-sm md:text-base leading-tight">
                    {item}
                  </h3>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Experience ── */}
        <section className="py-10 sm:py-14 md:py-20 border-t border-border/40">
          {/* Header above cards */}
          <div className="mb-8 sm:mb-10 space-y-2 sm:space-y-3">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">
              {t('experience.haccp')}
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-foreground leading-[0.9]">
              {t('experience.title')}<span className="text-primary">.</span>
            </h2>
            <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm font-black text-muted-foreground uppercase tracking-widest pt-2">
              <div className="w-8 sm:w-12 h-px bg-primary/40" />
              2002 — 2026
            </div>
          </div>

          {/* Experience Cards */}
          <ExperienceAccordion experiences={experiences} />
        </section>

        {/* ── Education ── */}
        <section className="py-10 sm:py-14 md:py-20 border-t border-border/40">
          <div className="rounded-2xl sm:rounded-[2rem] md:rounded-[3rem] border border-border/40 bg-muted/5 p-5 sm:p-8 md:p-14 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/20" />

            <h2 className="text-sm font-black uppercase tracking-[0.4em] text-primary/60 mb-6 sm:mb-8 italic">
              Formal Background
            </h2>

            <div className="max-w-3xl">
              <h3 className="text-2xl sm:text-3xl md:text-5xl font-black uppercase tracking-tighter mb-3 sm:mb-4 italic leading-tight text-foreground">
                {t('education.degree')}
              </h3>
              <p className="text-base sm:text-lg md:text-xl font-bold uppercase tracking-tight text-foreground/80">
                {t('education.school')}
              </p>
              <div className="mt-3 sm:mt-4 flex items-center gap-3 text-xs font-black text-muted-foreground uppercase tracking-widest">
                <Calendar className="w-3 h-3" />
                {t('education.period')}
              </div>

              <div className="mt-8 sm:mt-10 flex flex-wrap gap-3 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-background border border-border/60">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest">{t('education.honors')}</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-background border border-border/60">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest">{t('education.internship')}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Gallery ── */}
        <section className="py-10 sm:py-14 md:py-20">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 sm:gap-8 mb-10 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-foreground tracking-tighter uppercase italic leading-none">
              {t('gallery')}<span className="text-primary">.</span>
            </h2>
            <div className="flex flex-col sm:items-end gap-2 sm:text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">{t('gallery_journal')}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold max-w-xs sm:border-r-2 border-primary/50 sm:pr-4">
                {t('gallery_subtitle')}
              </p>
            </div>
          </div>
          {galleryImages.length > 0 ? (
            <ImageGallery
              images={galleryImages}
              categoryLabels={categoryLabels}
            />
          ) : (
            <p className="text-center text-sm text-muted-foreground py-12">Gallery coming soon.</p>
          )}

          <div className="mt-12 sm:mt-20 text-center">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-foreground hover:text-primary transition-colors group"
            >
              {t('collaboration')}
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" />
            </Link>
          </div>
        </section>

      </main>
    </div>
  );
}
