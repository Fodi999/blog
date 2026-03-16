'use client';

import { Link, usePathname } from '@/i18n/routing';
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Wrench,
  Table2,
  ShoppingBasket,
  LayoutGrid,
  Scale,
  Fish,
  FlaskConical,
  Apple,
  ChevronDown,
  ChefHat,
  Sparkles,
  FlameKindling,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type SubItem = {
  href: string;
  label: string;
  icon: any;
};

type NavItem = {
  href: string;
  icon: any;
  label: string;
  pattern: string | RegExp;
  subItems?: SubItem[];
};

interface ChefToolsNavProps {
  locale: string;
  translations: {
    back: string;
    tabs: {
      tools: string;
      tables: string;
      products: string;
    };
    tools: {
      converter: { title: string };
      fishSeason: { title: string };
      ingredientAnalyzer: { title: string };
      ingredientsCatalog: { title: string };
    };
  };
}

export function ChefToolsNav({ locale, translations }: ChefToolsNavProps) {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dropdownLeft, setDropdownLeft] = useState(0);
  const navRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setOpenDropdown(null);
  }, [pathname]);

  const handleDropdownToggle = useCallback((href: string) => {
    setOpenDropdown((prev) => {
      if (prev === href) return null;
      // Calculate left position relative to nav, accounting for scroll
      const btn = buttonRefs.current.get(href);
      const scroll = scrollRef.current;
      if (btn && scroll) {
        const btnRect = btn.getBoundingClientRect();
        const navRect = navRef.current!.getBoundingClientRect();
        setDropdownLeft(btnRect.left - navRect.left);
      }
      return href;
    });
  }, []);

  const navItems: NavItem[] = [
    {
      href: '/chef-tools',
      icon: LayoutGrid,
      label: translations.back,
      pattern: /^\/chef-tools$/,
    },
    {
      href: '/chef-tools/converter',
      icon: Wrench,
      label: translations.tabs.tools,
      pattern: /^\/chef-tools\/(converter|recipe-analyzer|flavor-pairing|lab|.*-to-.*)/,
      subItems: [
        { href: '/chef-tools/lab', label: 'Culinary Lab', icon: FlameKindling },
        { href: '/chef-tools/converter', label: translations.tools.converter.title, icon: Scale },
        { href: '/chef-tools/recipe-analyzer', label: 'Recipe Analyzer', icon: ChefHat },
        { href: '/chef-tools/flavor-pairing', label: 'Flavor Pairing', icon: Sparkles },
      ]
    },
    {
      href: '/chef-tools/fish-season',
      icon: Table2,
      label: translations.tabs.tables,
      pattern: /^\/chef-tools\/(fish-season|ingredient-analyzer)/,
      subItems: [
        { href: '/chef-tools/fish-season', label: translations.tools.fishSeason.title, icon: Fish },
        { href: '/chef-tools/ingredient-analyzer', label: translations.tools.ingredientAnalyzer.title, icon: FlaskConical },
      ]
    },
    {
      href: '/chef-tools/ingredients',
      icon: ShoppingBasket,
      label: translations.tabs.products,
      pattern: /^\/chef-tools\/ingredients/,
      subItems: [
        { href: '/chef-tools/ingredients', label: translations.tools.ingredientsCatalog.title, icon: Apple },
      ]
    },
  ];

  const activeItem = navItems.find((i) => i.href === openDropdown);

  return (
    <nav
      ref={navRef}
      className="relative mb-12 border-b border-border/40 sticky top-[64px] bg-background/80 backdrop-blur-md z-20 -mx-4 px-4 sm:mx-0 sm:px-0"
    >
      {/* Scroll container — only holds the tab buttons */}
      <div ref={scrollRef} className="flex gap-1 overflow-x-auto scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = typeof item.pattern === 'string'
            ? pathname === item.pattern
            : item.pattern.test(pathname);

          if (item.subItems && item.subItems.length >= 1) {
            const isOpen = openDropdown === item.href;
            return (
              <button
                key={item.href}
                type="button"
                ref={(el) => {
                  if (el) buttonRefs.current.set(item.href, el);
                  else buttonRefs.current.delete(item.href);
                }}
                onClick={() => handleDropdownToggle(item.href)}
                className={cn(
                  "flex items-center gap-2 px-4 py-4 font-black text-xs uppercase tracking-widest border-b-2 -mb-px transition-all duration-200 whitespace-nowrap shrink-0 hover:text-primary outline-none",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
                <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", isOpen && "rotate-180")} />
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-4 py-4 font-black text-xs uppercase tracking-widest border-b-2 -mb-px transition-all duration-200 whitespace-nowrap shrink-0 hover:text-primary",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Dropdown panel — rendered OUTSIDE overflow-x-auto, as sibling */}
      {openDropdown && activeItem?.subItems && (
        <div
          style={{ left: dropdownLeft }}
          className="absolute top-full mt-1 w-56 rounded-xl p-2 border border-border/60 bg-background/95 backdrop-blur-md shadow-lg z-50"
        >
          {activeItem.subItems.map((sub) => {
            const SubIcon = sub.icon;
            const isSubActive = pathname === sub.href || pathname.startsWith(sub.href + '/');
            return (
              <Link
                key={sub.href}
                href={sub.href}
                onClick={() => setOpenDropdown(null)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors",
                  isSubActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <SubIcon className="h-4 w-4" />
                {sub.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
