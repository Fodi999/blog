'use client';

/**
 * Inventory / Stock page — feature parity with iOS `StockViewModel`.
 *
 * Sections:
 *   1. KPI strip (total value / items / expiring / low)
 *   2. Search + filter chips (all / expiring / low / per-category)
 *   3. Grouped product list (one product = many batches → FIFO sorted)
 *   4. "Add product" dialog: catalog search + qty/price/dates
 *
 * Endpoints:
 *   GET    /api/inventory/products
 *   POST   /api/inventory/products
 *   DELETE /api/inventory/products/:id
 *   GET    /public/catalog/categories?lang=…
 *   GET    /public/catalog/ingredients?lang=…&q=&category_id=&limit=
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Pencil,
  AlertTriangle,
  Banknote,
  Package as PackageIcon,
  TriangleAlert,
  Layers,
  Loader2,
  X,
  ArrowRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

import { api, ApiError } from '@/lib/chefos-api';
import {
  addInventoryItem,
  deleteInventoryItem,
  updateInventoryItem,
} from '@/lib/chefos-mutations';
import { useChefOSSync } from '@/lib/chefos-store';
import {
  type AddInventoryRequest,
  type CatalogCategory,
  type CatalogIngredient,
  type InventoryItem,
  type InventoryListResponse,
} from '@/lib/chefos-types';
import { categoryEmoji, categoryLabel } from '@/lib/category';
import { cn } from '@/lib/utils';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Square avatar that *always* shows the category emoji, with the real
 * product photo overlaid on top when available. This way, even if R2
 * returns a transparent/broken image without firing onError, the user
 * still sees a meaningful icon underneath.
 */
function ProductAvatar({
  imageUrl,
  category,
  size = 'sm',
}: {
  imageUrl?: string | null;
  category?: string | null;
  size?: 'sm' | 'md';
}) {
  const [errored, setErrored] = useState(false);
  const dim = size === 'md' ? 'h-10 w-10 text-xl' : 'h-9 w-9 text-lg';
  const emoji = categoryEmoji(category);
  const showImage = !!imageUrl && !errored;
  return (
    <span
      className={cn(
        'relative flex flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-muted leading-none',
        dim,
      )}
    >
      {/* Always-visible emoji underneath */}
      <span aria-hidden>{emoji}</span>
      {showImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl!}
          alt=""
          className="absolute inset-0 h-full w-full bg-background object-cover"
          loading="lazy"
          onError={() => setErrored(true)}
        />
      )}
    </span>
  );
}

function daysUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.floor(ms / 86_400_000);
}

function formatCurrencyPLN(locale: string, amount: number): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'PLN',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${Math.round(amount)} zł`;
  }
}

function formatQty(qty: number, unit: string): string {
  const rounded = Math.round(qty * 100) / 100;
  return `${rounded} ${unit}`;
}

function isLow(item: InventoryItem): boolean {
  const min = item.product.min_stock_threshold;
  if (min > 0) return item.remaining_quantity <= min;
  return item.remaining_quantity <= 0.2;
}

function isExpiring(item: InventoryItem): boolean {
  return item.severity === 'critical' || item.severity === 'warning';
}

type Filter =
  | { kind: 'all' }
  | { kind: 'expiring' }
  | { kind: 'low' }
  | { kind: 'category'; value: string };

type ProductGroup = {
  productId: string;
  name: string;
  category: string;
  unit: string;
  imageUrl: string | null;
  entries: InventoryItem[];
  totalQty: number;
  totalValuePLN: number;
  soonestExpiry: number | null;
  isExpiring: boolean;
  isLow: boolean;
};

function groupByProduct(items: InventoryItem[]): ProductGroup[] {
  const map = new Map<string, ProductGroup>();
  for (const it of items) {
    const key = it.product.id || it.product.name;
    const existing = map.get(key);
    const valuePLN = (it.remaining_quantity * it.price_per_unit_cents) / 100;
    if (existing) {
      existing.entries.push(it);
      existing.totalQty += it.remaining_quantity;
      existing.totalValuePLN += valuePLN;
      const d = daysUntil(it.expires_at);
      if (existing.soonestExpiry === null || d < existing.soonestExpiry) {
        existing.soonestExpiry = d;
      }
      existing.isExpiring = existing.isExpiring || isExpiring(it);
      existing.isLow = existing.isLow || isLow(it);
    } else {
      map.set(key, {
        productId: key,
        name: it.product.name,
        category: it.product.category,
        unit: it.product.base_unit,
        imageUrl: it.product.image_url,
        entries: [it],
        totalQty: it.remaining_quantity,
        totalValuePLN: valuePLN,
        soonestExpiry: daysUntil(it.expires_at),
        isExpiring: isExpiring(it),
        isLow: isLow(it),
      });
    }
  }
  // FIFO inside each group: soonest expiry first
  for (const g of map.values()) {
    g.entries.sort((a, b) => daysUntil(a.expires_at) - daysUntil(b.expires_at));
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

// ── Component ────────────────────────────────────────────────────────────────

export function InventoryClient({ locale }: { locale: string }) {
  const t = useTranslations('app.inventory');

  const [items, setItems] = useState<InventoryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>({ kind: 'all' });
  const [addOpen, setAddOpen] = useState(false);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setItems(null);
      setRefreshing(true);
      setError(null);
      try {
        const res = await api.get<InventoryListResponse>(
          '/api/inventory/products?per_page=200',
        );
        setItems(res.items);
      } catch (e) {
        const msg =
          e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Error';
        setError(msg);
      } finally {
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    load();
  }, [load]);

  // ── Single-organism sync: refetch when any other page or tab mutates
  // inventory, when the tab regains focus, or every 30s while visible.
  useChefOSSync('inventory', () => load(true), 30_000);

  // ── derived ────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (!items) return null;
    const totalValuePLN = items.reduce(
      (s, i) => s + (i.remaining_quantity * i.price_per_unit_cents) / 100,
      0,
    );
    const expiringCount = items.filter(isExpiring).length;
    const lowCount = items.filter(isLow).length;
    const categories = [...new Set(items.map((i) => i.product.category))]
      .filter(Boolean)
      .sort();
    return {
      totalValuePLN,
      itemsCount: items.length,
      expiringCount,
      lowCount,
      categories,
    };
  }, [items]);

  const filtered = useMemo(() => {
    if (!items) return [];
    let r = items;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      r = r.filter((i) => i.product.name.toLowerCase().includes(q));
    }
    switch (filter.kind) {
      case 'expiring':
        r = r.filter(isExpiring);
        break;
      case 'low':
        r = r.filter(isLow);
        break;
      case 'category':
        r = r.filter((i) => i.product.category === filter.value);
        break;
    }
    return r;
  }, [items, search, filter]);

  const grouped = useMemo(() => {
    const groups = groupByProduct(filtered);
    const byCat = new Map<string, ProductGroup[]>();
    for (const g of groups) {
      const arr = byCat.get(g.category) ?? [];
      arr.push(g);
      byCat.set(g.category, arr);
    }
    return [...byCat.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([category, groups]) => ({ category, groups }));
  }, [filtered]);

  // ── render: loading ────────────────────────────────────────────────────
  if (items === null && !error) {
    return (
      <div className="space-y-6">
        <Header t={t} />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  // ── render: error ──────────────────────────────────────────────────────
  if (error && !items) {
    return (
      <div className="space-y-6">
        <Header t={t} />
        <Card className="border-destructive/40">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold">{t('errorTitle')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            <Button onClick={() => load()} className="mt-4">
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('retry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) return null;

  // ── KPI tiles ──────────────────────────────────────────────────────────
  const tiles: { icon: LucideIcon; label: string; value: string; accent: string }[] = [
    {
      icon: Banknote,
      label: t('totalValue'),
      value: formatCurrencyPLN(locale, stats.totalValuePLN),
      accent: 'text-emerald-600',
    },
    {
      icon: PackageIcon,
      label: t('itemsCount'),
      value: String(stats.itemsCount),
      accent: 'text-cyan-600',
    },
    {
      icon: AlertTriangle,
      label: t('expiringSoon'),
      value: String(stats.expiringCount),
      accent: stats.expiringCount > 0 ? 'text-amber-600' : 'text-muted-foreground',
    },
    {
      icon: TriangleAlert,
      label: t('runningLow'),
      value: String(stats.lowCount),
      accent: stats.lowCount > 0 ? 'text-rose-600' : 'text-muted-foreground',
    },
  ];

  // ── filter chips ───────────────────────────────────────────────────────
  const filterChips: { key: string; active: boolean; label: string; onClick: () => void }[] = [
    {
      key: 'all',
      active: filter.kind === 'all',
      label: t('filter.all'),
      onClick: () => setFilter({ kind: 'all' }),
    },
  ];
  if (stats.expiringCount > 0) {
    filterChips.push({
      key: 'expiring',
      active: filter.kind === 'expiring',
      label: `${t('filter.expiring')} · ${stats.expiringCount}`,
      onClick: () => setFilter({ kind: 'expiring' }),
    });
  }
  if (stats.lowCount > 0) {
    filterChips.push({
      key: 'low',
      active: filter.kind === 'low',
      label: `${t('filter.low')} · ${stats.lowCount}`,
      onClick: () => setFilter({ kind: 'low' }),
    });
  }
  for (const cat of stats.categories) {
    filterChips.push({
      key: `cat:${cat}`,
      active: filter.kind === 'category' && filter.value === cat,
      label: `${categoryEmoji(cat)} ${categoryLabel(cat)}`,
      onClick: () => setFilter({ kind: 'category', value: cat }),
    });
  }

  return (
    <div className="space-y-6">
      <Header
        t={t}
        right={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => load(true)}
              disabled={refreshing}
            >
              <RefreshCw className={cn('mr-2 h-4 w-4', refreshing && 'animate-spin')} />
              {t('refresh')}
            </Button>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('addProduct')}
            </Button>
          </div>
        }
      />

      {/* KPI strip */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map(({ icon: Icon, label, value, accent }) => (
          <Card key={label} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {label}
                </p>
                <Icon className={cn('h-4 w-4', accent)} />
              </div>
              <p className="mt-3 text-xl font-black tracking-tight sm:text-2xl">{value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Search + filter chips */}
      <Card className="border-border/60">
        <CardContent className="space-y-3 p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="pl-9"
            />
          </div>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {filterChips.map((c) => (
              <button
                key={c.key}
                onClick={c.onClick}
                className={cn(
                  'flex-shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                  c.active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border/60 bg-background text-muted-foreground hover:bg-muted',
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Grouped list */}
      {stats.itemsCount === 0 ? (
        <EmptyState t={t} onAdd={() => setAddOpen(true)} />
      ) : grouped.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">{t('noMatches')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ category, groups }) => (
            <Card key={category} className="border-border/60">
              <CardContent className="p-0">
                <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
                  <span className="text-base leading-none">{categoryEmoji(category)}</span>
                  <h3 className="text-sm font-bold">{categoryLabel(category)}</h3>
                  <span className="text-xs text-muted-foreground">· {groups.length}</span>
                </div>
                <ul className="divide-y divide-border/60">
                  {groups.map((g) => (
                    <ProductRow
                      key={g.productId}
                      group={g}
                      locale={locale}
                      t={t}
                      onDelete={async (id) => {
                        try {
                          await deleteInventoryItem(id);
                          toast.success(t('toastDeleted'));
                          // No explicit reload — the mutation invalidates the
                          // 'inventory' key, our useChefOSSync subscriber refetches.
                        } catch (e) {
                          toast.error(
                            e instanceof ApiError ? e.message : t('toastDeleteFailed'),
                          );
                        }
                      }}
                      onEdit={async (id, patch) => {
                        try {
                          await updateInventoryItem(id, patch);
                          toast.success(t('toastUpdated'));
                        } catch (e) {
                          toast.error(
                            e instanceof ApiError ? e.message : t('toastUpdateFailed'),
                          );
                          throw e;
                        }
                      }}
                    />
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddProductDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        locale={locale}
        onAdded={async () => {
          setAddOpen(false);
          toast.success(t('toastAdded'));
          // No reload — addInventoryItem invalidates 'inventory'.
        }}
      />
    </div>
  );
}

// ── Header ──────────────────────────────────────────────────────────────────

function Header({
  t,
  right,
}: {
  t: ReturnType<typeof useTranslations<'app.inventory'>>;
  right?: React.ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-black tracking-tight lg:text-3xl">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>
      {right}
    </header>
  );
}

// ── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({
  t,
  onAdd,
}: {
  t: ReturnType<typeof useTranslations<'app.inventory'>>;
  onAdd: () => void;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-8 text-center">
        <PackageIcon className="mx-auto h-10 w-10 text-muted-foreground/40" />
        <h2 className="mt-4 text-lg font-bold">{t('emptyTitle')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('emptyBody')}</p>
        <Button onClick={onAdd} className="mt-4">
          <Plus className="mr-2 h-4 w-4" />
          {t('addFirstProduct')}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Product row ─────────────────────────────────────────────────────────────

function ProductRow({
  group,
  locale,
  t,
  onDelete,
  onEdit,
}: {
  group: ProductGroup;
  locale: string;
  t: ReturnType<typeof useTranslations<'app.inventory'>>;
  onDelete: (batchId: string) => Promise<void>;
  onEdit: (
    batchId: string,
    patch: { quantity?: number; price_per_unit_cents?: number },
  ) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editTarget, setEditTarget] = useState<InventoryItem | null>(null);
  const days = group.soonestExpiry;
  const expiryLabel =
    days === null
      ? '—'
      : days < 0
      ? t('expired')
      : days === 0
      ? t('expiresToday')
      : days === 1
      ? t('expiresTomorrow')
      : t('expiresInDays', { days });

  const expiryTone =
    days === null
      ? 'text-muted-foreground'
      : days < 0
      ? 'text-red-600'
      : days <= 1
      ? 'text-amber-600'
      : days <= 3
      ? 'text-yellow-600'
      : 'text-muted-foreground';

  return (
    <li className="px-4 py-3">
      <button
        type="button"
        onClick={() => group.entries.length > 1 && setExpanded((v) => !v)}
        className={cn(
          'flex w-full items-center gap-3 text-left',
          group.entries.length > 1 && 'cursor-pointer',
        )}
      >
        <ProductAvatar imageUrl={group.imageUrl} category={group.category} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold">{group.name}</p>
            {group.entries.length > 1 && (
              <Badge variant="secondary" className="gap-1">
                <Layers className="h-3 w-3" />
                {group.entries.length}
              </Badge>
            )}
            {group.isLow && (
              <Badge variant="destructive">{t('lowBadge')}</Badge>
            )}
            {group.isExpiring && !group.isLow && (
              <Badge className="bg-amber-500 text-white hover:bg-amber-500/90">
                {t('expiringBadge')}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatQty(group.totalQty, group.unit)}
            {' · '}
            <span className={expiryTone}>{expiryLabel}</span>
          </p>
        </div>
        <p className="text-sm font-semibold tabular-nums">
          {formatCurrencyPLN(locale, group.totalValuePLN)}
        </p>
      </button>

      {expanded && group.entries.length > 1 && (
        <ul className="mt-3 space-y-2 border-l-2 border-border/60 pl-4">
          {group.entries.map((entry) => {
            const d = daysUntil(entry.expires_at);
            const v = (entry.remaining_quantity * entry.price_per_unit_cents) / 100;
            return (
              <li
                key={entry.id}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <span className="flex-1 tabular-nums">
                  {formatQty(entry.remaining_quantity, entry.product.base_unit)}
                  {' · '}
                  {entry.severity === 'expired'
                    ? t('expired')
                    : d <= 0
                    ? t('expiresToday')
                    : d === 1
                    ? t('expiresTomorrow')
                    : t('expiresInDays', { days: d })}
                </span>
                <span className="tabular-nums">{formatCurrencyPLN(locale, v)}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditTarget(entry);
                  }}
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label={t('edit')}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(t('confirmDelete'))) onDelete(entry.id);
                  }}
                  className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label={t('delete')}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {group.entries.length === 1 && (
        <div className="mt-2 flex justify-end gap-1">
          <button
            type="button"
            onClick={() => setEditTarget(group.entries[0])}
            className="inline-flex items-center gap-1 rounded p-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
            {t('edit')}
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm(t('confirmDelete'))) onDelete(group.entries[0].id);
            }}
            className="inline-flex items-center gap-1 rounded p-1 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t('delete')}
          </button>
        </div>
      )}

      <EditBatchDialog
        item={editTarget}
        onClose={() => setEditTarget(null)}
        onSubmit={onEdit}
        t={t}
      />
    </li>
  );
}

// ── Edit Batch Dialog ───────────────────────────────────────────────────────

function EditBatchDialog({
  item,
  onClose,
  onSubmit,
  t,
}: {
  item: InventoryItem | null;
  onClose: () => void;
  onSubmit: (
    batchId: string,
    patch: { quantity?: number; price_per_unit_cents?: number },
  ) => Promise<void>;
  t: ReturnType<typeof useTranslations<'app.inventory'>>;
}) {
  const [qty, setQty] = useState('');
  const [price, setPrice] = useState('');
  const [saving, setSaving] = useState(false);

  // Re-prime state whenever a new item opens.
  useEffect(() => {
    if (!item) return;
    setQty(String(item.remaining_quantity));
    const totalPLN = (item.remaining_quantity * item.price_per_unit_cents) / 100;
    setPrice(totalPLN > 0 ? totalPLN.toFixed(2) : '');
    setSaving(false);
  }, [item]);

  if (!item) return null;

  async function save() {
    if (!item) return;
    const qtyNum = Number(qty.replace(',', '.'));
    if (!Number.isFinite(qtyNum) || qtyNum < 0) {
      toast.error(t('invalidQty'));
      return;
    }
    const patch: { quantity?: number; price_per_unit_cents?: number } = {};
    if (qtyNum !== item.remaining_quantity) patch.quantity = qtyNum;

    const priceNum = Number(price.replace(',', '.'));
    if (Number.isFinite(priceNum) && qtyNum > 0) {
      const newPerUnitCents = Math.round((priceNum * 100) / qtyNum);
      if (newPerUnitCents !== item.price_per_unit_cents) {
        patch.price_per_unit_cents = newPerUnitCents;
      }
    }

    if (Object.keys(patch).length === 0) {
      onClose();
      return;
    }

    setSaving(true);
    try {
      await onSubmit(item.id, patch);
      onClose();
    } catch {
      // Toast already shown upstream.
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={!!item} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('editProduct')}</DialogTitle>
          <DialogDescription>{item.product.name}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="edit-qty">
              {t('qty')} ({item.product.base_unit})
            </Label>
            <Input
              id="edit-qty"
              inputMode="decimal"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-price">{t('priceTotal')}</Label>
            <Input
              id="edit-price"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0,00"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t('cancel')}
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Add Product Dialog ──────────────────────────────────────────────────────

function AddProductDialog({
  open,
  onOpenChange,
  locale,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  locale: string;
  onAdded: () => void | Promise<void>;
}) {
  const t = useTranslations('app.inventory');
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<CatalogIngredient[]>([]);
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState<CatalogIngredient | null>(null);

  const [qty, setQty] = useState('1');
  const [price, setPrice] = useState('');
  const [shelfDays, setShelfDays] = useState('7');
  const [saving, setSaving] = useState(false);

  // Map category_id → localized category name (for emoji fallback).
  const categoryName = useCallback(
    (id: string | null | undefined) =>
      categories.find((c) => c.id === id)?.name ?? null,
    [categories],
  );

  // Load categories once on open.
  useEffect(() => {
    if (!open) return;
    api
      .get<{ categories: CatalogCategory[] }>(
        `/public/catalog/categories?lang=${locale}`,
        { anonymous: true },
      )
      .then((r) => setCategories(r.categories))
      .catch(() => setCategories([]));
  }, [open, locale]);

  // Search ingredients (debounced).
  useEffect(() => {
    if (!open) return;
    const ctrl = new AbortController();
    const handle = setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({ lang: locale, limit: '50' });
        if (search.trim()) params.set('q', search.trim());
        if (categoryId) params.set('category_id', categoryId);
        const res = await api.get<{ ingredients: CatalogIngredient[] }>(
          `/public/catalog/ingredients?${params.toString()}`,
          { anonymous: true, signal: ctrl.signal },
        );
        setResults(res.ingredients);
      } catch {
        // ignore aborts
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => {
      clearTimeout(handle);
      ctrl.abort();
    };
  }, [open, search, categoryId, locale]);

  // When picked changes, prime form defaults from ingredient.
  useEffect(() => {
    if (!picked) return;
    setShelfDays(String(picked.default_shelf_life_days ?? 7));
    setQty('1');
    setPrice('');
  }, [picked]);

  function reset() {
    setSearch('');
    setCategoryId(null);
    setPicked(null);
    setQty('1');
    setPrice('');
    setShelfDays('7');
  }

  async function submit() {
    if (!picked) return;
    const qtyNum = Number(qty.replace(',', '.'));
    if (!Number.isFinite(qtyNum) || qtyNum <= 0) {
      toast.error(t('invalidQty'));
      return;
    }
    const priceNum = Number(price.replace(',', '.'));
    const priceCents = Number.isFinite(priceNum) ? Math.round(priceNum * 100) : 0;
    const days = Math.max(1, Number(shelfDays) || 7);

    const now = new Date();
    const expires = new Date(now.getTime() + days * 86_400_000);
    const body: AddInventoryRequest = {
      catalog_ingredient_id: picked.id,
      price_per_unit_cents: priceCents,
      quantity: qtyNum,
      received_at: now.toISOString(),
      expires_at: expires.toISOString(),
    };

    setSaving(true);
    try {
      await addInventoryItem(body);
      reset();
      await onAdded();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t('toastAddFailed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="flex max-h-[calc(100vh-64px)] w-[calc(100vw-32px)] max-w-3xl flex-col overflow-hidden p-0 sm:w-[calc(100vw-48px)]">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-2">
          <DialogTitle>{t('addProduct')}</DialogTitle>
          <DialogDescription>{t('addProductHint')}</DialogDescription>
        </DialogHeader>

        {!picked ? (
          <>
            <div className="shrink-0 px-6 pb-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('catalogSearchPlaceholder')}
                  className="w-full pl-9"
                />
              </div>
            </div>

            {categories.length > 0 && (
              <div className="w-full shrink-0 overflow-x-auto px-6 pb-3">
                <div className="flex min-w-max gap-2">
                  <button
                    onClick={() => setCategoryId(null)}
                    className={cn(
                      'shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                      categoryId === null
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border/60 bg-background text-muted-foreground hover:bg-muted',
                    )}
                  >
                    {t('filter.all')}
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setCategoryId(c.id)}
                      className={cn(
                        'shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                        categoryId === c.id
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border/60 bg-background text-muted-foreground hover:bg-muted',
                      )}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto border-y border-border/60">
              {searching ? (
                <div className="flex h-40 items-center justify-center p-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : results.length === 0 ? (
                <div className="flex h-40 items-center justify-center p-6 text-sm text-muted-foreground">
                  {t('noCatalogResults')}
                </div>
              ) : (
                <ul className="divide-y divide-border/60">
                  {results.map((ing) => (
                    <li key={ing.id}>
                      <button
                        type="button"
                        onClick={() => setPicked(ing)}
                        className="flex w-full items-center gap-3 px-6 py-2.5 text-left hover:bg-muted"
                      >
                        <ProductAvatar
                          imageUrl={ing.image_url}
                          category={categoryName(ing.category_id) ?? ing.name}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{ing.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {ing.default_unit}
                            {ing.default_shelf_life_days
                              ? ` · ${t('shelfDaysShort', { days: ing.default_shelf_life_days })}`
                              : ''}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        ) : (
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 pb-2">
            <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/40 px-3 py-2">
              <ProductAvatar
                imageUrl={picked.image_url}
                category={categoryName(picked.category_id) ?? picked.name}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{picked.name}</p>
                <p className="truncate text-xs text-muted-foreground">{picked.default_unit}</p>
              </div>
              <button
                type="button"
                onClick={() => setPicked(null)}
                className="shrink-0 rounded p-1 text-muted-foreground hover:bg-background"
                aria-label={t('changeProduct')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="add-qty">
                  {t('qty')} ({picked.default_unit})
                </Label>
                <Input
                  id="add-qty"
                  inputMode="decimal"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="add-price">{t('priceTotal')}</Label>
                <Input
                  id="add-price"
                  inputMode="decimal"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="add-shelf">{t('shelfDays')}</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    id="add-shelf"
                    inputMode="numeric"
                    value={shelfDays}
                    onChange={(e) => setShelfDays(e.target.value)}
                    className="w-24"
                  />
                  {[3, 7, 14, 30].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setShelfDays(String(d))}
                      className={cn(
                        'shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors',
                        Number(shelfDays) === d
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border/60 bg-background text-muted-foreground hover:bg-muted',
                      )}
                    >
                      +{d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="shrink-0 gap-2 border-t border-border/60 bg-background px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={submit} disabled={!picked || saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
