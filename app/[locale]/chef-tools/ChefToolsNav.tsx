'use client';

import { Link, usePathname } from '@/i18n/routing';
import {
  Wrench,
  Table2,
  ShoppingBasket,
  ChevronLeft,
  LayoutGrid,
  Scale,
  Fish,
  FlaskConical,
  Apple,
  Salad
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
      nutrition: { title: string };
    };
  };
}

export function ChefToolsNav({ locale, translations }: ChefToolsNavProps) {
  const pathname = usePathname();

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
      pattern: /^\/chef-tools\/(converter|how-many|.*-to-.*)/,
      subItems: [
        { href: '/chef-tools/converter', label: translations.tools.converter.title, icon: Scale },
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
      pattern: /^\/chef-tools\/(ingredients|nutrition)/,
    },
  ];

  return (
    <nav className="mb-12 border-b border-border/40 pb-0 sticky top-[64px] bg-background/80 backdrop-blur-md z-10 -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex gap-1 overflow-x-auto scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = typeof item.pattern === 'string' 
            ? pathname === item.pattern 
            : item.pattern.test(pathname);

          if (item.subItems && item.subItems.length > 1) {
            return (
              <DropdownMenu key={item.href}>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "flex items-center gap-2 px-4 py-4 font-black text-xs uppercase tracking-widest border-b-2 -mb-px transition-all duration-200 whitespace-nowrap shrink-0 hover:text-primary outline-none",
                      isActive
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 rounded-xl p-2 border-border/60 bg-background/95 backdrop-blur-md">
                  {item.subItems.map((sub) => {
                    const SubIcon = sub.icon;
                    const isSubActive = pathname.startsWith(sub.href);
                    return (
                      <DropdownMenuItem key={sub.href} asChild>
                        <Link
                          href={sub.href}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer",
                            isSubActive 
                              ? "bg-primary/10 text-primary" 
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <SubIcon className="h-4 w-4" />
                          {sub.label}
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
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
    </nav>
  );
}
