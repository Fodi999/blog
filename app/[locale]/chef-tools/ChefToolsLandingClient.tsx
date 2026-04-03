'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import {
  Scale, Fish, FlaskConical, Calculator, Utensils,
  Sparkles, Search, BarChart3, Salad, MessageCircle, ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AISousChef } from './dashboard/AISousChef';

interface ChefToolsLandingClientProps {
  locale: string;
}

const TOOLS = [
  { href: '/chef-tools/ingredients',       icon: Search,        key: 'ingredients'     },
  { href: '/chef-tools/fish-season',       icon: Fish,          key: 'fishSeason'      },
  { href: '/chef-tools/lab',               icon: FlaskConical,  key: 'lab'             },
  { href: '/chef-tools/converter',         icon: Scale,         key: 'converter'       },
  { href: '/chef-tools/recipe-analyzer',   icon: Calculator,    key: 'recipeAnalyzer'  },
  { href: '/chef-tools/flavor-pairing',    icon: Utensils,      key: 'flavorPairing'   },
  { href: '/chef-tools/nutrition',         icon: BarChart3,     key: 'nutrition'       },
  { href: '/chef-tools/diet/vegan',        icon: Salad,         key: 'diet'            },
  { href: '/chef-tools/ranking/protein',   icon: Sparkles,      key: 'ranking'         },
] as const;

export function ChefToolsLandingClient({ locale }: ChefToolsLandingClientProps) {
  const t = useTranslations('chefTools');
  const [activeTab, setActiveTab] = useState<'tools' | 'ai'>('tools');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20">
      
      {/* ── Premium Tab Switcher ── */}
      <div className="flex justify-center mb-16 sm:mb-24">
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

          {/* Animated Background Pill */}
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
        
        {/* Tab 1: Tools Grid */}
        <div className={cn(
          "transition-all duration-700 space-y-12 sm:space-y-20",
          activeTab === 'tools' ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12 pointer-events-none absolute inset-0"
        )}>
          {/* Hero Section */}
          <section className="animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-[0.15em] mb-6 border border-primary/20">
                <Sparkles className="h-3 w-3 fill-primary" />
                {t('badge')}
              </div>
              <h1 className="text-4xl md:text-7xl font-black tracking-tighter uppercase italic mb-6 leading-none">
                {t('toolGrid.title')}
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground font-medium max-w-xl leading-relaxed">
                {t('toolGrid.subtitle')}
              </p>
            </div>
          </section>

          {/* Grid Section */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            {TOOLS.map(({ href, icon: Icon, key }, idx) => (
              <Link key={href} href={href} locale={locale}>
                <div 
                  className="group relative border-2 border-border/40 rounded-[2rem] p-8 hover:border-primary/40 transition-all duration-500 bg-card/20 backdrop-blur-xl h-full hover-lift hover-glow shadow-xl shadow-black/5"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-500">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-foreground mb-2.5 group-hover:text-primary transition-colors italic">
                    {t(`toolGrid.${key}`)}
                  </h3>
                  <p className="text-sm text-muted-foreground/60 leading-relaxed font-medium">
                    {t(`toolGrid.${key}Desc`)}
                  </p>
                  <ArrowRight className="absolute top-8 right-8 h-4 w-4 text-muted-foreground/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}

            {/* AI Assistant Card - Switch Tab Action */}
            <div 
              onClick={() => setActiveTab('ai')}
              className="sm:col-span-2 lg:col-span-3 border-2 border-primary/30 rounded-[2.5rem] p-10 bg-primary/5 hover:bg-primary/10 transition-all duration-500 cursor-pointer group hover:border-primary/50 relative overflow-hidden shadow-2xl shadow-primary/5"
            >
              <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10">
                <div className="w-20 h-20 rounded-[2rem] bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-all duration-700 shadow-xl shadow-primary/10">
                  <MessageCircle className="h-10 w-10 text-primary" />
                </div>
                <div className="text-center sm:text-left flex-1">
                  <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground italic mb-2">
                    {t('toolGrid.aiChat')}
                  </h3>
                  <p className="text-base text-muted-foreground/60 font-medium">
                    {t('toolGrid.aiChatDesc')}
                  </p>
                </div>
                <div className="px-8 py-3.5 rounded-full bg-primary text-primary-foreground font-black uppercase text-[11px] tracking-[0.2em] italic group-hover:shadow-[0_0_30px_rgba(239,68,68,0.4)] transition-all">
                  {t('open')}
                </div>
              </div>
              
              {/* Decorative Glow */}
              <div className="absolute top-1/2 left-0 w-1/2 h-full bg-primary/10 blur-[120px] rounded-full -translate-y-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            </div>
          </section>
        </div>

        {/* Tab 2: AI Assistant */}
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
