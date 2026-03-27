'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type Source = 'table' | 'analyzer' | 'catalog';

const BACK_ROUTES: Record<Source, string> = {
  table: '/chef-tools/nutrition',
  analyzer: '/chef-tools/ingredient-analyzer',
  catalog: '/chef-tools/ingredients',
};

interface Props {
  name: string;
  labels: {
    chefTools: string;
    table: string;
    analyzer: string;
    catalog: string;
    backTable: string;
    backAnalyzer: string;
    backCatalog: string;
  };
}

/**
 * Client-side breadcrumb that detects where the user came from
 * via document.referrer instead of query params.
 * This avoids Google crawling parameterized URLs.
 */
export function NutritionBackNav({ name, labels }: Props) {
  const [source, setSource] = useState<Source>('catalog');

  useEffect(() => {
    const ref = document.referrer;
    if (ref.includes('/ingredient-analyzer')) {
      setSource('analyzer');
    } else if (ref.includes('/nutrition') && !ref.includes('/nutrition/')) {
      // came from the nutrition table, not from another nutrition detail
      setSource('table');
    }
    // default: catalog
  }, []);

  const backHref = BACK_ROUTES[source];
  const parentLabel =
    source === 'table' ? labels.table :
    source === 'analyzer' ? labels.analyzer :
    labels.catalog;
  const backLabel =
    source === 'table' ? labels.backTable :
    source === 'analyzer' ? labels.backAnalyzer :
    labels.backCatalog;

  return (
    <div className="mb-8 space-y-2">
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
        <Link href="/chef-tools" className="hover:text-foreground transition-colors">
          {labels.chefTools}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={backHref as never} className="hover:text-foreground transition-colors">
          {parentLabel}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{name}</span>
      </div>
      <Link
        href={backHref as never}
        className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        {backLabel}
      </Link>
    </div>
  );
}
