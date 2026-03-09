'use client';

import { useState } from 'react';
import { Link } from '@/i18n/routing';
import {
  ArrowRight,
  Scale,
  Fish,
  Apple,
  Wrench,
  Table2,
  ShoppingBasket,
  Salad,
  FlaskConical,
  LayoutGrid,
  type LucideIcon,
} from 'lucide-react';

/* ── Icon map ────────────────────────────────────────────────────────────── */

const iconMap: Record<string, LucideIcon> = {
  tools: Wrench,
  tables: Table2,
  products: ShoppingBasket,
  converter: Scale,
  fishSeason: Fish,
  ingredients: Apple,
  nutrition: Salad,
  ingredientAnalyzer: FlaskConical,
  ingredientsCatalog: LayoutGrid,
};

/* ── Types ───────────────────────────────────────────────────────────────── */

type TabItemData = {
  href: string;
  iconKey: string;
  title: string;
  description: string;
  openLabel: string;
};

type TabData = {
  id: string;
  label: string;
  desc: string;
  iconKey: string;
  items: TabItemData[];
};

/* ── Component ───────────────────────────────────────────────────────────── */

export function ChefToolsTabs({ tabs }: { tabs: TabData[] }) {
  const [active, setActive] = useState(0);

  return (
    <div className="pb-16 md:pb-24">
      {/* Horizontal tab bar */}
      <div className="flex gap-2 mb-10 overflow-x-auto scrollbar-none border-b border-border/40 pb-0">
        {tabs.map((tab, i) => {
          const Icon = iconMap[tab.iconKey] ?? Wrench;
          const isActive = i === active;
          return (
            <button
              key={tab.id}
              onClick={() => setActive(i)}
              className={`
                flex items-center gap-2 px-5 py-3 font-black text-sm uppercase tracking-widest
                border-b-2 -mb-px transition-all duration-200 whitespace-nowrap shrink-0
                ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }
              `}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab description */}
      <p className="text-lg text-muted-foreground font-medium mb-10">
        {tabs[active].desc}
      </p>

      {/* Cards grid — consistent with PostCard grid on homepage */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tabs[active].items.map(({ href, iconKey, title, description, openLabel }) => {
          const Icon = iconMap[iconKey] ?? Scale;
          return (
            <Link key={href} href={href}>
              <div className="group border border-border/60 rounded-2xl p-6 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 bg-background h-full flex flex-col">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight text-foreground mb-2 group-hover:text-primary transition-colors italic">
                  {title}
                </h3>
                <p className="text-muted-foreground font-medium leading-relaxed mb-5 flex-1 text-sm">
                  {description}
                </p>
                <div className="flex items-center gap-1.5 text-primary text-xs font-black uppercase tracking-widest group-hover:gap-3 transition-all">
                  {openLabel}
                  <ArrowRight className="h-3.5 w-3.5 stroke-[3px]" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
