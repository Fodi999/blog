'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import {
  Scale, Fish, FlaskConical, Calculator, Utensils, Sparkles,
  Search, BarChart3, Salad, MessageCircle, ArrowRight, ChefHat,
  Microscope, Database, Wrench, Brain,
  Trophy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AISousChef } from './dashboard/AISousChef';

/* ══════════════════════════════════════════════════════════════
   Quick Actions — "Что вы хотите сделать?"
   ══════════════════════════════════════════════════════════════ */

const QUICK_ACTIONS = [
  {
    key: 'analyzeRecipe' as const,
    href: '/chef-tools/recipe-analyzer',
    icon: Calculator,
    color: 'from-rose-500 to-orange-500',
    glow: 'shadow-rose-500/20',
    border: 'hover:border-rose-500/40',
    bg: 'bg-rose-500/10',
    text: 'text-rose-500',
  },
  {
    key: 'checkIngredient' as const,
    href: '/chef-tools/ingredient-analyzer',
    icon: Microscope,
    color: 'from-violet-500 to-purple-500',
    glow: 'shadow-violet-500/20',
    border: 'hover:border-violet-500/40',
    bg: 'bg-violet-500/10',
    text: 'text-violet-500',
  },
  {
    key: 'convertUnits' as const,
    href: '/chef-tools/converter',
    icon: Scale,
    color: 'from-sky-500 to-cyan-500',
    glow: 'shadow-sky-500/20',
    border: 'hover:border-sky-500/40',
    bg: 'bg-sky-500/10',
    text: 'text-sky-500',
  },
  {
    key: 'createRecipe' as const,
    href: '/chef-tools/lab',
    icon: FlaskConical,
    color: 'from-emerald-500 to-teal-500',
    glow: 'shadow-emerald-500/20',
    border: 'hover:border-emerald-500/40',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-500',
  },
] as const;

/* ══════════════════════════════════════════════════════════════
   3 Sections: Database → Tools → AI Core
   ══════════════════════════════════════════════════════════════ */

type ToolItem = {
  href: string;
  icon: typeof Search;
  key: string;
};

const DATABASE_TOOLS: ToolItem[] = [
  { href: '/chef-tools/ingredients',          icon: Search,      key: 'ingredients'         },
  { href: '/chef-tools/ingredient-analyzer',  icon: Microscope,  key: 'ingredientAnalyzer'  },
  { href: '/chef-tools/fish-season',          icon: Fish,        key: 'fishSeason'          },
];

const UTILITY_TOOLS: ToolItem[] = [
  { href: '/chef-tools/converter',            icon: Scale,       key: 'converter'           },
  { href: '/chef-tools/nutrition',            icon: BarChart3,   key: 'nutrition'           },
  { href: '/chef-tools/ranking/protein',      icon: Trophy,      key: 'ranking'             },
  { href: '/chef-tools/diet/vegan',           icon: Salad,       key: 'diet'                },
];

const AI_TOOLS: ToolItem[] = [
  { href: '/chef-tools/recipe-analyzer',      icon: Calculator,    key: 'recipeAnalyzer'    },
  { href: '/chef-tools/lab',                  icon: FlaskConical,  key: 'lab'               },
  { href: '/chef-tools/flavor-pairing',       icon: Utensils,      key: 'flavorPairing'     },
];

/* ══════════════════════════════════════════════════════════════
   Section config
   ══════════════════════════════════════════════════════════════ */

const SECTIONS = [
  {
    key: 'database' as const,
    icon: Database,
    tools: DATABASE_TOOLS,
    accent: 'text-violet-500',
    accentBg: 'bg-violet-500/10',
    accentBorder: 'border-violet-500/20',
    dotColor: 'bg-violet-500',
  },
  {
    key: 'tools' as const,
    icon: Wrench,
    tools: UTILITY_TOOLS,
    accent: 'text-sky-500',
    accentBg: 'bg-sky-500/10',
    accentBorder: 'border-sky-500/20',
    dotColor: 'bg-sky-500',
  },
  {
    key: 'ai' as const,
    icon: Brain,
    tools: AI_TOOLS,
    accent: 'text-rose-500',
    accentBg: 'bg-rose-500/10',
    accentBorder: 'border-rose-500/20',
    dotColor: 'bg-rose-500',
  },
] as const;

/* ══════════════════════════════════════════════════════════════
   Component
   ══════════════════════════════════════════════════════════════ */

export function ChefToolsLandingClient({ locale }: { locale: string }) {
  const t = useTranslations('chefTools');
  const [activeTab, setActiveTab] = useState<'tools' | 'ai'>('tools');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20">

      {/* ── Premium Tab Switcher ── */}
      <div className="flex justify-center mb-12 sm:mb-16">
        <div className="inline-flex p-1.5 rounded-[2.5rem] bg-card/40 backdrop-blur-3xl border-2 border-border/10 shadow-2xl shadow-black/5 relative group/tabs">
          <button
            onClick={() => setActiveTab('tools')}
            className={cn(
              "relative z-10 px-8 py-3.5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 italic flex items-center gap-2",
              activeTab === 'tools' ? "text-white" : "text-muted-foreground/40 hover:text-foreground"
            )}
          >
            <div className={cn("w-1.5 h-1.5 rounded-full", activeTab === 'tools' ? "bg-white animate-pulse" : "bg-transparent")} />
            {t('tabs.tools')}
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={cn(
              "relative z-10 px-8 py-3.5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 italic flex items-center gap-2",
              activeTab === 'ai' ? "text-white" : "text-muted-foreground/40 hover:text-foreground"
            )}
          >
            <Sparkles className={cn("w-3.5 h-3.5", activeTab === 'ai' ? "text-white fill-white animate-pulse" : "text-transparent")} />
            {t('tabs.sousChef')}
          </button>
          <div
            className={cn(
              "absolute top-1.5 bottom-1.5 transition-all duration-500 ease-out bg-primary rounded-full shadow-2xl shadow-primary/40",
              activeTab === 'tools' ? "left-1.5 w-[calc(50%-6px)]" : "left-[calc(50%+1.5px)] w-[calc(50%-4.5px)]"
            )}
          />
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="relative min-h-[60vh]">

        {/* ═══════════════════════════════════════════════════════
            Tab 1: Structured Landing
            ═══════════════════════════════════════════════════════ */}
        <div className={cn(
          "transition-all duration-700 space-y-16 sm:space-y-24",
          activeTab === 'tools' ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12 pointer-events-none absolute inset-0"
        )}>

          {/* ── HERO: "Что вы хотите сделать?" ── */}
          <section className="animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-[0.15em] mb-6 border border-primary/20">
                <ChefHat className="h-3 w-3" />
                {t('badge')}
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic mb-4 leading-none">
                {t('landing.heroTitle')}
              </h1>
              <p className="text-lg text-muted-foreground font-medium">
                {t('landing.heroSubtitle')}
              </p>
            </div>

            {/* Quick Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {QUICK_ACTIONS.map(({ key, href, icon: Icon, border, bg, text }) => (
                <Link key={key} href={href} locale={locale}>
                  <div className={cn(
                    "group relative border-2 border-border/30 rounded-2xl p-6 transition-all duration-500 bg-card/30 backdrop-blur-xl cursor-pointer hover-lift",
                    border
                  )}>
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-500 group-hover:scale-110", bg)}>
                      <Icon className={cn("h-6 w-6", text)} />
                    </div>
                    <h3 className="text-base font-black uppercase tracking-tight mb-1.5 group-hover:text-foreground transition-colors italic">
                      {t(`landing.actions.${key}`)}
                    </h3>
                    <p className="text-xs text-muted-foreground/60 leading-relaxed font-medium">
                      {t(`landing.actions.${key}Desc`)}
                    </p>
                    <ArrowRight className="absolute top-6 right-6 h-4 w-4 text-muted-foreground/15 group-hover:text-foreground/40 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* ── CONNECTION FLOW HINT ── */}
          <section className="animate-in fade-in duration-1000 delay-300">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground/40 font-medium uppercase tracking-widest">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border/40" />
                <span className="flex items-center gap-2 shrink-0">
                  <Scale className="h-3 w-3" />
                  {t('landing.flowHint')}
                  <Calculator className="h-3 w-3" />
                  {t('landing.flowImprove')}
                  <FlaskConical className="h-3 w-3" />
                </span>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border/40" />
              </div>
            </div>
          </section>

          {/* ── 3 STRUCTURED SECTIONS ── */}
          {SECTIONS.map(({ key, icon: SectionIcon, tools, accent, accentBg, accentBorder }, sectionIdx) => (
            <section
              key={key}
              className="animate-in fade-in slide-in-from-bottom-6 duration-700"
              style={{ animationDelay: `${(sectionIdx + 1) * 150}ms` }}
            >
              {/* Section header */}
              <div className="flex items-center gap-4 mb-8">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", accentBg)}>
                  <SectionIcon className={cn("h-5 w-5", accent)} />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight italic">
                    {t(`landing.sections.${key}`)}
                  </h2>
                  <p className="text-sm text-muted-foreground/50 font-medium">
                    {t(`landing.sections.${key}Desc`)}
                  </p>
                </div>
                <div className={cn("h-px flex-1", accentBorder, "border-t")} />
              </div>

              {/* Tool cards */}
              <div className={cn(
                "grid gap-4",
                tools.length <= 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              )}>
                {tools.map(({ href, icon: Icon, key: toolKey }) => (
                  <Link key={href} href={href} locale={locale}>
                    <div className={cn(
                      "group relative border border-border/30 rounded-2xl p-6 hover:border-border/60 transition-all duration-400 bg-card/20 backdrop-blur-xl h-full hover-lift",
                    )}>
                      <div className="flex items-start gap-4">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", accentBg)}>
                          <Icon className={cn("h-5 w-5", accent)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-black uppercase tracking-tight mb-1 group-hover:text-foreground transition-colors italic">
                            {t(`toolGrid.${toolKey}`)}
                          </h3>
                          <p className="text-xs text-muted-foreground/50 leading-relaxed font-medium">
                            {t(`toolGrid.${toolKey}Desc`)}
                          </p>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/15 group-hover:text-foreground/40 group-hover:translate-x-0.5 transition-all mt-1 shrink-0" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}

          {/* ── AI SOUS-CHEF CTA ── */}
          <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
            <div
              onClick={() => setActiveTab('ai')}
              className="border-2 border-primary/30 rounded-[2rem] p-8 sm:p-10 bg-primary/5 hover:bg-primary/10 transition-all duration-500 cursor-pointer group hover:border-primary/50 relative overflow-hidden shadow-2xl shadow-primary/5"
            >
              <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 relative z-10">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-all duration-700 shadow-xl shadow-primary/10">
                  <MessageCircle className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                </div>
                <div className="text-center sm:text-left flex-1">
                  <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground italic mb-1.5">
                    {t('toolGrid.aiChat')}
                  </h3>
                  <p className="text-sm text-muted-foreground/60 font-medium">
                    {t('toolGrid.aiChatDesc')}
                  </p>
                </div>
                <div className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-[0.2em] italic group-hover:shadow-[0_0_30px_rgba(239,68,68,0.4)] transition-all shrink-0">
                  {t('open')}
                </div>
              </div>
              <div className="absolute top-1/2 left-0 w-1/2 h-full bg-primary/10 blur-[120px] rounded-full -translate-y-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            </div>
          </section>

        </div>

        {/* ═══════════════════════════════════════════════════════
            Tab 2: AI Assistant
            ═══════════════════════════════════════════════════════ */}
        <div className={cn(
          "transition-all duration-700",
          activeTab === 'ai' ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12 pointer-events-none absolute inset-0"
        )}>
          <AISousChef />
        </div>

      </div>
    </div>
  );
}
