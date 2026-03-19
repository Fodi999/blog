'use client';

import { Link, usePathname } from '@/i18n/routing';
import { ArrowLeft, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

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
      lab?: { title: string };
      recipeAnalyzer?: { title: string };
      flavorPairing?: { title: string };
      nutrition?: { title: string };
    };
  };
}

/** Map path segments to a page title from translations */
function resolvePageTitle(
  pathname: string,
  tools: ChefToolsNavProps['translations']['tools'],
): string | null {
  if (pathname.includes('/converter'))          return tools.converter.title;
  if (pathname.includes('/fish-season'))        return tools.fishSeason.title;
  if (pathname.includes('/ingredient-analyzer'))return tools.ingredientAnalyzer.title;
  if (pathname.includes('/ingredients'))        return tools.ingredientsCatalog.title;
  if (pathname.includes('/lab'))                return tools.lab?.title ?? null;
  if (pathname.includes('/recipe-analyzer'))    return tools.recipeAnalyzer?.title ?? null;
  if (pathname.includes('/flavor-pairing'))     return tools.flavorPairing?.title ?? null;
  if (pathname.includes('/nutrition'))          return tools.nutrition?.title ?? null;
  return null;
}

export function ChefToolsNav({ locale, translations }: ChefToolsNavProps) {
  const pathname = usePathname();
  const isRoot = pathname === '/chef-tools' || pathname === `/${locale}/chef-tools`;
  const pageTitle = resolvePageTitle(pathname, translations.tools);

  /* On the root /chef-tools page — render nothing (dashboard has its own header) */
  if (isRoot) return null;

  return (
    <nav className="mb-10 border-b border-border/40 sticky top-[64px] bg-background/80 backdrop-blur-md z-20 -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex items-center gap-3 py-3">

        {/* ← Back to Smart Panel */}
        <Link
          href="/chef-tools"
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl border border-border/50",
            "text-xs font-black uppercase tracking-wider text-muted-foreground",
            "hover:border-primary/40 hover:text-primary hover:bg-primary/5",
            "transition-all duration-200"
          )}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {translations.back}
        </Link>

        {/* Separator + current page breadcrumb */}
        {pageTitle && (
          <>
            <span className="text-border/60 select-none">/</span>
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
              {pageTitle}
            </span>
          </>
        )}

        {/* Right side: home icon shortcut */}
        <Link
          href="/"
          className="ml-auto p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
          aria-label="Home"
        >
          <Home className="h-3.5 w-3.5" />
        </Link>
      </div>
    </nav>
  );
}
