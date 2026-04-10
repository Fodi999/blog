'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import {
  Scale, Fish, FlaskConical, Calculator, Utensils, Sparkles,
  Search, BarChart3, Salad, ArrowRight, ChefHat,
  Microscope, Database, Wrench, Brain,
  Trophy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AISousChef } from './dashboard/AISousChef';

/* ══════════════════════════════════════════════════════════════
   3 Sections: Database → Tools → AI Core
   ══════════════════════════════════════════════════════════════ */

type ToolItem = {
  href: string;
  icon: typeof Search;
  key: string;
};

const QUICK_ACTIONS: ToolItem[] = [
  { href: '/chef-tools/recipe-analyzer',      icon: Calculator,    key: 'analyzeRecipe'    },
  { href: '/chef-tools/ingredients',          icon: Search,        key: 'checkIngredient'  },
  { href: '/chef-tools/converter',            icon: Scale,         key: 'convertUnits'     },
  { href: '/chef-tools/lab',                  icon: FlaskConical,  key: 'createRecipe'     },
];

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
  { href: '/chef-tools/chat',                icon: Sparkles,      key: 'aiChat'            },
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
  },
  {
    key: 'tools' as const,
    icon: Wrench,
    tools: UTILITY_TOOLS,
    accent: 'text-sky-500',
    accentBg: 'bg-sky-500/10',
    accentBorder: 'border-sky-500/20',
  },
  {
    key: 'ai' as const,
    icon: Brain,
    tools: AI_TOOLS,
    accent: 'text-rose-500',
    accentBg: 'bg-rose-500/10',
    accentBorder: 'border-rose-500/20',
  },
] as const;

/* ══════════════════════════════════════════════════════════════
   Component — Kitchen OS Layout
   ══════════════════════════════════════════════════════════════ */

export function ChefToolsLandingClient({ locale }: { locale: string }) {
  const t = useTranslations('chefTools');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20">

      {/* ═══════════════════════════════════════════════════════════
          SECTION 0: ACTION PICKER — "Co chcesz zrobić?"
          ═══════════════════════════════════════════════════════════ */}
      <section className="mb-20 sm:mb-28">
        <div className="text-center space-y-4 max-w-2xl mx-auto mb-12 animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
            <Sparkles className="h-3 w-3" />
            {t('landing.heroTitle')}
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black italic tracking-tighter uppercase leading-none text-balance">
            {t('landing.heroSubtitle')}
          </h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {QUICK_ACTIONS.map(({ href, icon: Icon, key: toolKey }, idx) => (
            <Link 
              key={href} 
              href={href} 
              locale={locale}
              className="group relative"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-blue-500/30 rounded-[2.5rem] blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
              <div className={cn(
                "relative flex flex-col items-center text-center p-8 rounded-[2.5rem] h-full transition-all duration-500",
                "bg-card/40 backdrop-blur-3xl border border-white/10",
                "hover:border-primary/40 hover:bg-card/60 hover:-translate-y-2 hover:shadow-2xl"
              )}>
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                  <Icon className="h-8 w-8 text-primary shadow-glow-primary" />
                </div>
                <h3 className="text-lg font-black uppercase italic tracking-tight mb-2 text-foreground group-hover:text-primary transition-colors">
                  {t(`landing.actions.${toolKey}`)}
                </h3>
                <p className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest leading-relaxed mb-4">
                  {t(`landing.actions.${toolKey}Desc`)}
                </p>

                {/* Flow hint for specific actions */}
                {toolKey === 'checkIngredient' && (
                  <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-500/60 uppercase tracking-widest mb-4 italic">
                    {t('landing.flowHint')}
                  </div>
                )}
                {toolKey === 'analyzeRecipe' && (
                  <div className="flex items-center gap-1.5 text-[9px] font-black text-amber-500/60 uppercase tracking-widest mb-4 italic">
                    {t('landing.flowImprove')}
                  </div>
                )}
                
                <div className="mt-auto pt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary/40 group-hover:text-primary transition-all">
                  {t('open')}
                  <ArrowRight className="h-3 w-3 translate-x-0 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 1: AI SOUS-CHEF — The AI Core
          ═══════════════════════════════════════════════════════════ */}
      <section className="mb-20 sm:mb-28">
        <div className="flex items-center gap-6 mb-12 sm:mb-16">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
            <Brain className="h-6 w-6 text-rose-500" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl sm:text-4xl font-black italic uppercase tracking-tighter">
              {t('landing.sections.ai')}
            </h2>
            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground/30">
              {t('landing.sections.aiDesc')}
            </p>
          </div>
          <div className="hidden sm:block h-px flex-1 bg-rose-500/10" />
        </div>

        {/* AI Sous-Chef — full-width hero block with enhanced ambient glow */}
        <div className="relative rounded-[3rem] border border-primary/20 bg-primary/[0.01] dark:bg-primary/[0.03] overflow-hidden shadow-2xl shadow-primary/5">
          {/* Ambient decorative elements */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[10%] left-[5%] w-[30%] h-[40%] bg-primary/5 blur-[120px] rounded-full animate-pulse-slow" />
            <div className="absolute bottom-[10%] right-[5%] w-[40%] h-[30%] bg-primary/10 blur-[140px] rounded-full opacity-50" />
          </div>

          <div className="relative z-10 p-6 sm:p-12 md:p-16">
            <AISousChef />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 2: TOOLS — secondary layer: Database & Kitchen Tools
          ═══════════════════════════════════════════════════════════ */}
      <section className="space-y-24 sm:space-y-32">

        {/* ── 2 TOOL SECTIONS ── */}
        {SECTIONS.filter(s => s.key !== 'ai').map(({ key, icon: SectionIcon, tools, accent, accentBg, accentBorder }, sectionIdx) => (
          <div
            key={key}
            className="animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both"
            style={{ animationDelay: `${sectionIdx * 150}ms` }}
          >
            {/* Section heading with decorative line */}
            <div className="flex items-center gap-6 mb-10 group/header">
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover/header:rotate-12", accentBg, "border border-current/10 shadow-lg shadow-current/5")}>
                <SectionIcon className={cn("h-6 w-6", accent)} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl sm:text-3xl font-black uppercase tracking-tight italic leading-none mb-1">
                  {t(`landing.sections.${key}`)}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground/40 font-bold uppercase tracking-widest">
                  {t(`landing.sections.${key}Desc`)}
                </p>
              </div>
              <div className={cn("hidden lg:block h-px flex-[2] opacity-20", accentBorder, "border-t")} />
            </div>

            {/* Bento Grid — First item is larger as "Feature" */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {tools.map(({ href, icon: Icon, key: toolKey }, idx) => (
                <Link 
                    key={href} 
                    href={href} 
                    locale={locale}
                    className={cn(
                        "group relative",
                        idx === 0 && "sm:col-span-2 sm:row-span-1"
                    )}
                >
                  <div className={cn(
                    "relative overflow-hidden h-full rounded-[2.5rem] p-8 transition-all duration-500",
                    "border border-border/30 bg-card/20 backdrop-blur-2xl backdrop-saturate-150",
                    "hover:border-current/40 hover:bg-card/40 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] hover:-translate-y-2",
                    accent // Applies text color which we use for current color borders
                  )}>
                    {/* Hover Glow — subtle and matched to section accent */}
                    <div className={cn(
                        "absolute -inset-1 opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-3xl rounded-[3rem]",
                        accentBg
                    )} />

                    <div className="relative z-10 flex flex-col h-full">
                      {/* Top row: Icon + Intent Badge */}
                      <div className="flex items-center justify-between mb-8">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                          accentBg,
                          "group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-current/10 border border-current/5",
                        )}>
                          <Icon className={cn("h-6 w-6", accent)} />
                        </div>
                        
                        {/* Status/Intent badge — visible on hover or feature card */}
                        <div className={cn(
                            "opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500",
                            "px-4 py-1.5 rounded-full border border-current/20 bg-current/5 text-[10px] font-black uppercase tracking-widest",
                            idx === 0 && "opacity-100 translate-x-0"
                        )}>
                            {idx === 0 ? "Featured" : t('open')}
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="flex-1">
                        <h4 className={cn(
                            "font-black uppercase tracking-tight italic transition-colors duration-300",
                            idx === 0 ? "text-xl sm:text-3xl mb-3" : "text-base mb-2",
                            "group-hover:text-foreground"
                        )}>
                          {t(`toolGrid.${toolKey}`)}
                        </h4>
                        <p className={cn(
                            "text-muted-foreground/50 font-medium leading-relaxed group-hover:text-muted-foreground/80 transition-colors duration-300",
                            idx === 0 ? "text-sm sm:text-base max-w-md" : "text-[12px] line-clamp-2"
                        )}>
                          {t(`toolGrid.${toolKey}Desc`)}
                        </p>
                      </div>

                      {/* Action Line */}
                      <div className="mt-12 flex items-center gap-3 text-primary overflow-hidden">
                        <div className="h-px w-0 group-hover:w-12 bg-primary transition-all duration-500" />
                        <span className="text-[11px] font-black uppercase tracking-[0.3em] translate-y-12 group-hover:translate-y-0 transition-transform duration-500 italic">
                           {t('open')}
                        </span>
                        <ArrowRight className="h-4 w-4 translate-x-[-30px] group-hover:translate-x-0 transition-transform duration-500" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

