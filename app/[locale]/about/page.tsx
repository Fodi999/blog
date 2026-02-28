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
    title: t('about.title'),
    description: t('about.description'),
    locale,
    path: '/about',
  });
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about' });

  const galleryImages = [
    {
      src: 'https://images.unsplash.com/photo-1553621042-f6e147245754?q=80&w=1000&auto=format&fit=crop',
      alt: 'Art of Japanese Prep',
    },
    {
      src: 'https://i.postimg.cc/V5QZwGRX/IMG_4239.jpg',
      alt: 'Sushi preparation at the counter',
    },
    {
      src: 'https://i.postimg.cc/K8QChcY9/DSCF4689.jpg',
      alt: 'Precision and texture',
    },
    {
      src: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?q=80&w=1000&auto=format&fit=crop',
      alt: 'Omakase details',
    },
    {
      src: 'https://i.postimg.cc/XqFtRwZJ/DSCF4697.jpg',
      alt: 'Culinary mastery in practice',
    },
    {
      src: 'https://i.postimg.cc/RCf8VLFn/DSCF4639.jpg',
      alt: 'Dima Fomin Portrait',
    },
  ];

  const experiences = [
    {
      title: t('experience.fishInHouse.title'),
      role: t('experience.fishInHouse.role'),
      period: t('experience.fishInHouse.period'),
      responsibilities: t.raw('experience.fishInHouse.responsibilities'),
    },
    {
      title: t('experience.miodMalina.title'),
      role: t('experience.miodMalina.role'),
      period: t('experience.miodMalina.period'),
    },
    {
      title: t('experience.charlemagne.title'),
      role: t('experience.charlemagne.role'),
      period: t('experience.charlemagne.period'),
    },
    {
      title: t('experience.wawel.title'),
      role: t('experience.wawel.role'),
      period: t('experience.wawel.period'),
    },
  ];

  const expertiseIcons = [ChefHat, Flame, Scale, Target, Zap, Leaf, Award, CheckCircle2];
  const expertiseItems = t.raw('expertise.items');

  return (
    <div className="min-h-screen bg-background selection:bg-primary/10 selection:text-primary">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "mainEntity": {
            "@type": "Person",
            "name": "Dmitrij Fomin",
            "jobTitle": "Sushi Chef & Food Technologist",
            "url": "https://dima-fomin.pl",
            "image": "https://i.postimg.cc/RCf8VLFn/DSCF4639.jpg"
          }
        }}
      />

      <main className="mx-auto max-w-6xl px-6">

        {/* ── Hero Section ── */}
        <section className="py-14 md:py-20">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 items-center">
            {/* Left Rail: Photo & Badges */}
            <aside className="lg:col-span-4 lg:sticky lg:top-24">
              <div className="rounded-[2.5rem] border border-border/40 bg-card p-6 shadow-2xl overflow-hidden relative group">
                {/* Decorative glow */}
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/20 rounded-full blur-[80px] pointer-events-none" />

                <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-muted/20">
                  <Image
                    src="https://i.postimg.cc/RCf8VLFn/DSCF4639.jpg"
                    alt="Dima Fomin"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    priority
                  />
                </div>

                {/* Badges */}
                <div className="mt-6 flex flex-wrap gap-2">
                  {(t.raw('hero.badges') as string[]).map((badge) => (
                    <span
                      key={badge}
                      className="rounded-full border border-border/60 bg-muted/50 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-foreground/70"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            </aside>

            {/* Right Pillar: Content */}
            <div className="lg:col-span-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-6">
                <Sparkles className="w-3 h-3" />
                <span>Professional Profile</span>
              </div>

              <h1 className="text-5xl font-black tracking-tight md:text-6xl lg:text-7xl italic uppercase leading-[0.9]">
                {t('title')}<span className="text-primary">.</span>
              </h1>

              <p className="mt-8 max-w-prose text-lg md:text-xl leading-relaxed text-foreground/80 font-medium">
                {t('hero.lead')}
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href="/contact"
                  className="rounded-full bg-primary px-8 py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 group"
                >
                  {t('hero.cta.contact')}
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/restaurants"
                  className="rounded-full border border-border/60 bg-card px-8 py-4 text-sm font-black uppercase tracking-widest text-foreground transition-all hover:bg-muted/30"
                >
                  {t('hero.cta.restaurants')}
                </Link>
              </div>

              {/* Metrics Grid */}
              <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {(t.raw('hero.metrics') as string[]).map((metric: string) => (
                  <div key={metric} className="rounded-3xl border border-border/40 bg-card p-5 transition-all hover:border-primary/20 hover:shadow-md">
                    <div className="text-2xl font-black text-foreground italic uppercase tracking-tighter mb-1">{metric}</div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Verified</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Mission ── */}
        <section className="py-14 border-t border-border/40">
          <div className="bg-primary/5 rounded-[3rem] p-8 md:p-14 border border-primary/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Sparkles className="w-24 h-24 text-primary" />
            </div>

            <div className="max-w-3xl relative z-10">
              <h2 className="text-sm font-black uppercase tracking-[0.4em] text-primary mb-8 flex items-center gap-3">
                <div className="w-10 h-0.5 bg-primary" />
                {t('mission.title')}
              </h2>
              <p className="text-2xl md:text-3xl lg:text-4xl font-black italic tracking-tighter leading-tight text-foreground">
                {t('mission.content')}
              </p>

              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                {(t.raw('mission.values') as { label: string; desc: string }[]).map((item) => (
                  <div key={item.label} className="space-y-2">
                    <div className="text-lg font-black uppercase italic text-primary">{item.label}</div>
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Expertise ── */}
        <section className="py-14 md:py-20">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
            <div>
              <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-foreground leading-none">
                {t('expertise.title')}<span className="text-primary">.</span>
              </h2>
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] md:text-right max-w-xs">
              {t('expertise.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(expertiseItems as string[]).map((item: string, index: number) => {
              const Icon = expertiseIcons[index % expertiseIcons.length];
              return (
                <div
                  key={index}
                  className="group p-6 bg-card rounded-3xl border border-border/40 hover:bg-muted/20 transition-all duration-300 hover:border-primary/20"
                >
                  <div className="mb-4 rounded-2xl bg-primary/10 w-12 h-12 flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-black uppercase tracking-tight text-foreground/90 text-sm md:text-base leading-tight">
                    {item}
                  </h3>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Experience ── */}
        <section className="py-14 md:py-20 border-t border-border/40">
          {/* Header above cards */}
          <div className="mb-10 space-y-3">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">
              {t('experience.haccp')}
            </span>
            <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-foreground leading-[0.9]">
              {t('experience.title')}<span className="text-primary">.</span>
            </h2>
            <div className="flex items-center gap-4 text-sm font-black text-muted-foreground uppercase tracking-widest pt-2">
              <div className="w-12 h-px bg-primary/40" />
              2002 — 2026
            </div>
          </div>

          {/* Experience Cards */}
          <ExperienceAccordion experiences={experiences} />
        </section>

        {/* ── Education ── */}
        <section className="py-14 md:py-20 border-t border-border/40">
          <div className="rounded-[3rem] border border-border/40 bg-muted/5 p-8 md:p-14 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/20" />

            <h2 className="text-sm font-black uppercase tracking-[0.4em] text-primary/60 mb-8 italic">
              Formal Background
            </h2>

            <div className="max-w-3xl">
              <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-4 italic leading-tight text-foreground">
                {t('education.degree')}
              </h3>
              <p className="text-lg md:text-xl font-bold uppercase tracking-tight text-foreground/80">
                {t('education.school')}
              </p>
              <div className="mt-4 flex items-center gap-3 text-xs font-black text-muted-foreground uppercase tracking-widest">
                <Calendar className="w-3 h-3" />
                {t('education.period')}
              </div>

              <div className="mt-10 flex flex-wrap gap-4">
                <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-background border border-border/60">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-widest">{t('education.honors')}</span>
                </div>
                <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-background border border-border/60">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                  <span className="text-xs font-black uppercase tracking-widest">{t('education.internship')}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Gallery ── */}
        <section className="py-14 md:py-20">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-foreground tracking-tighter uppercase italic leading-none">
              {t('gallery')}<span className="text-primary">.</span>
            </h2>
            <div className="flex flex-col items-end gap-2 text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Visual Journal</p>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold max-w-xs border-r-2 border-primary/50 pr-4">
                Selected works &amp; moments in the kitchen
              </p>
            </div>
          </div>
          <ImageGallery images={galleryImages} />

          <div className="mt-20 text-center">
            <Link
              href="/contact"
              className="inline-flex items-center gap-3 text-sm font-black uppercase tracking-[0.3em] text-foreground hover:text-primary transition-colors group"
            >
              Start Collaboration
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" />
            </Link>
          </div>
        </section>

      </main>
    </div>
  );
}
