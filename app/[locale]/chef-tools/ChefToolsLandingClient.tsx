'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import {
  FlaskConical, Sparkles,
  Search, BarChart3, ArrowRight, ChefHat,
  Database, Wrench, Brain,
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
  { href: '/chef-tools/lab',                  icon: FlaskConical,  key: 'createRecipe'     },
  { href: '/chef-tools/ingredients',          icon: Search,        key: 'checkIngredient'  },
  { href: '/chef-tools/nutrition',            icon: BarChart3,     key: 'convertUnits'     },
  { href: '/chef-tools/lab',                  icon: FlaskConical,  key: 'analyzeRecipe'    },
];

const DATABASE_TOOLS: ToolItem[] = [
  { href: '/chef-tools/ingredients',          icon: Search,      key: 'ingredients'         },
  { href: '/chef-tools/nutrition',            icon: BarChart3,   key: 'ingredientAnalyzer'  },
  { href: '/chef-tools/lab',                  icon: FlaskConical, key: 'fishSeason'         },
];

const UTILITY_TOOLS: ToolItem[] = [
  { href: '/chef-tools/nutrition',            icon: BarChart3,   key: 'nutrition'           },
  { href: '/chef-tools/ingredients',          icon: Search,      key: 'ingredients'         },
  { href: '/chef-tools/lab',                  icon: FlaskConical, key: 'lab'                },
  { href: '/chef-tools/chat',                 icon: Sparkles,    key: 'aiChat'              },
];

const AI_TOOLS: ToolItem[] = [
  { href: '/chef-tools/lab',                  icon: FlaskConical,  key: 'lab'               },
  { href: '/chef-tools/chat',                icon: Sparkles,      key: 'aiChat'            },
  { href: '/chef-tools/dashboard',            icon: Brain,         key: 'recipeAnalyzer'    },
  { href: '/chef-tools/chat',                icon: Sparkles,      key: 'flavorPairing'     },
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20">
      
      {/* ── Page Header ── */}
      <div className="text-center space-y-6 mb-16 animate-in fade-in slide-in-from-top-4 duration-1000">
        <h1 className="text-3xl sm:text-6xl md:text-7xl font-black italic tracking-tighter uppercase leading-[0.9] text-balance px-2">
          Kitchen OS <span className="text-primary text-2xl sm:text-6xl md:text-7xl">2026</span>
        </h1>
        <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.5em] text-muted-foreground/30 max-w-xl mx-auto">
          {t('description').split('\n')[1]}
        </p>
      </div>

      {/* ── Main Interface ── */}
      <section className="relative">
        <div className="relative z-10">
          <AISousChef />
        </div>
        
        {/* Decorative elements behind the interface */}
        <div className="absolute inset-x-0 -top-20 -bottom-20 pointer-events-none -z-10">
          <div className="absolute top-1/4 left-0 w-96 h-96 bg-primary/5 blur-[120px] rounded-full opacity-30" />
          <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-violet-500/5 blur-[120px] rounded-full opacity-30" />
        </div>
      </section>

      {/* ── Version Footer ── */}
      <div className="mt-32 pt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 italic">
          Deterministic Rule Engine · Pro Culinary Catalog v4.2
        </p>
        <div className="flex items-center gap-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/20">112+ Ingredients</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/20">4 Languages</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/20">AI Optimized</p>
        </div>
      </div>
    </div>
  );
}

