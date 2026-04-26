'use client';

/**
 * EditRecipeSheet — slide-up panel for local (no-backend) recipe editing.
 *
 * Features:
 *   • List current ingredients with inline remove button
 *   • "+ Add ingredient" expands a search panel:
 *       – Debounced catalog search (/public/catalog/ingredients)
 *       – Click result → fill fields automatically
 *       – "Add manually" fallback when product not found
 *   • Status selector: ✅ In stock / ⚠️ Need to buy / 🌿 Optional
 *   • Unit selector: g / ml / pcs / tbsp / tsp → converted to gross_g
 *   • Save button: calls onSave(updatedDish) and fires a toast
 *   • All changes are LOCAL only — no backend call.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Loader2, Plus, Search, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

import { api } from '@/lib/chefos-api';
import { cn } from '@/lib/utils';
import { type CatalogIngredient } from '@/lib/chefos-types';
import { type SuggestedDish, type SuggestedIngredient, dishTitle } from '@/lib/cook-suggestions';

// ── Unit conversion to gross_g ───────────────────────────────────────────────

type Unit = 'g' | 'ml' | 'pcs' | 'tbsp' | 'tsp';
const UNIT_OPTIONS: Unit[] = ['g', 'ml', 'pcs', 'tbsp', 'tsp'];

/**
 * Map the backend's canonical `default_unit` strings (`liter`, `kilogram`,
 * `milliliter`, `gram`, `piece`, …) to the small UI-friendly enum we use
 * inside this form.  Unknown values fall back to `g` so the form is always
 * usable.
 */
function mapBackendUnit(s: string | null | undefined): Unit {
  if (!s) return 'g';
  const k = s.trim().toLowerCase();
  const m: Record<string, Unit> = {
    g: 'g', gr: 'g', gram: 'g', grams: 'g',
    kg: 'g', kilogram: 'g', kilograms: 'g',
    ml: 'ml', milliliter: 'ml', milliliters: 'ml', millilitre: 'ml',
    l: 'ml', liter: 'ml', liters: 'ml', litre: 'ml',
    pcs: 'pcs', pc: 'pcs', piece: 'pcs', pieces: 'pcs', шт: 'pcs', sztuka: 'pcs',
    tbsp: 'tbsp', tablespoon: 'tbsp',
    tsp: 'tsp', teaspoon: 'tsp',
  };
  return m[k] ?? 'g';
}

/**
 * Density-aware mass conversion.
 *   • `g`  → grams pass-through.
 *   • `ml` → multiply by density (water 1.00, milk 1.03, oil 0.91, honey 1.42 …).
 *   • `pcs` → multiply by `typical_portion_g` (egg 60 g, apple 180 g …); 100 g default.
 *   • `tbsp`/`tsp` → 15 ml / 5 ml × density.
 *
 * When the catalog item has no density attached we gracefully fall back to
 * 1.0 g/ml — same behaviour as before, just no longer hard-coded.
 */
function toGrams(
  qty: number,
  unit: Unit,
  density?: number | null,
  pieceG?: number | null,
): number {
  const d = density && density > 0 ? density : 1.0;
  const p = pieceG && pieceG > 0 ? pieceG : 100;
  switch (unit) {
    case 'g':    return qty;
    case 'ml':   return qty * d;
    case 'pcs':  return qty * p;
    case 'tbsp': return qty * 15 * d;
    case 'tsp':  return qty * 5  * d;
  }
}

// ── Status type ──────────────────────────────────────────────────────────────

type IngStatus = 'in_stock' | 'need_to_buy' | 'optional';

function statusToFields(status: IngStatus): {
  available: boolean;
  expiring_soon: boolean;
  role_override?: string;
} {
  if (status === 'in_stock') return { available: true, expiring_soon: false };
  if (status === 'optional') return { available: false, expiring_soon: false, role_override: 'garnish' };
  return { available: false, expiring_soon: false };
}

// ── Blank add-form state ─────────────────────────────────────────────────────

interface AddForm {
  // catalog-filled when selected from search:
  catalogId: string | null;
  imageUrl: string | null;
  category: string | null;
  density: number | null;        // g per ml (e.g. 1.03 for milk)
  pieceG: number | null;         // typical mass of 1 pcs in grams
  // always required:
  name: string;
  qty: string;       // raw string input
  unit: Unit;
  role: string;
  status: IngStatus;
}

const BLANK: AddForm = {
  catalogId: null,
  imageUrl: null,
  category: null,
  density: null,
  pieceG: null,
  name: '',
  qty: '',
  unit: 'g',
  role: 'main',
  status: 'in_stock',
};

const ROLE_OPTIONS = [
  'main', 'protein', 'base', 'side',
  'sauce', 'spice', 'garnish', 'herb',
  'liquid', 'fat', 'acid', 'topping', 'binder', 'other',
];

// ── Main component ───────────────────────────────────────────────────────────

interface Props {
  dish: SuggestedDish;
  open: boolean;
  onClose: () => void;
  /** Called when user clicks "Save draft" — receives the mutated dish copy. */
  onSave: (updated: SuggestedDish) => void;
}

export function EditRecipeSheet({ dish, open, onClose, onSave }: Props) {
  const t = useTranslations('app.cookNow');
  const te = useTranslations('app.cookNow.edit');
  const locale = useLocale();

  // ── Local ingredient list (mutable copy) ──────────────────────────────
  const [ingredients, setIngredients] =
    useState<SuggestedIngredient[]>(dish.ingredients);

  // Re-sync when a new dish is passed (e.g. regenerated)
  useEffect(() => {
    if (open) setIngredients(dish.ingredients);
  }, [dish, open]);

  // ── Add-panel visibility ───────────────────────────────────────────────
  const [addOpen, setAddOpen] = useState(false);
  const [manual, setManual] = useState(false);
  const [form, setForm] = useState<AddForm>(BLANK);

  // ── Catalog search state ───────────────────────────────────────────────
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<CatalogIngredient[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!addOpen || manual) {
      setResults([]);
      return;
    }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const tid = setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({ lang: locale, limit: '30' });
        if (query.trim()) params.set('q', query.trim());
        const res = await api.get<{ ingredients: CatalogIngredient[] }>(
          `/public/catalog/ingredients?${params.toString()}`,
          { anonymous: true, signal: ctrl.signal },
        );
        if (!ctrl.signal.aborted) setResults(res.ingredients);
      } catch {
        // ignore aborts / errors
      } finally {
        if (!ctrl.signal.aborted) setSearching(false);
      }
    }, 250);
    return () => {
      clearTimeout(tid);
      ctrl.abort();
    };
  }, [addOpen, manual, query, locale]);

  // ── Pick a catalog ingredient ──────────────────────────────────────────
  function pickCatalog(ci: CatalogIngredient) {
    const mapped = mapBackendUnit(ci.default_unit);
    setForm((f) => ({
      ...f,
      catalogId: ci.id,
      imageUrl: ci.image_url ?? null,
      category: null,
      density: ci.density_g_per_ml ?? null,
      pieceG: ci.typical_portion_g ?? null,
      name: ci.name,
      // Auto-pick a sensible unit:
      //   liter / milliliter → ml
      //   kilogram / gram   → g
      //   piece             → pcs
      unit: mapped,
    }));
    setQuery(ci.name);
    setResults([]);
  }

  // ── Validate & add to list ─────────────────────────────────────────────
  function handleAdd() {
    if (!form.name.trim()) return;
    const qty = parseFloat(form.qty);
    if (isNaN(qty) || qty <= 0) return;

    const { available, expiring_soon, role_override } = statusToFields(form.status);
    const gross_g = toGrams(qty, form.unit, form.density, form.pieceG);

    const ing: SuggestedIngredient = {
      name: form.name.trim(),
      slug: form.catalogId ?? form.name.toLowerCase().replace(/\s+/g, '-'),
      gross_g,
      role: role_override ?? form.role,
      available,
      expiring_soon,
      image_url: form.imageUrl ?? undefined,
      category: form.category ?? undefined,
    };

    setIngredients((list) => [...list, ing]);
    setForm(BLANK);
    setQuery('');
    setResults([]);
    setAddOpen(false);
    setManual(false);
  }

  // ── Remove ingredient ──────────────────────────────────────────────────
  function handleRemove(idx: number) {
    setIngredients((list) => list.filter((_, i) => i !== idx));
  }

  // ── Save draft ─────────────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    const updated: SuggestedDish = { ...dish, ingredients };
    onSave(updated);
    toast.success(t('toast.draftSaved'), { description: t('toast.draftSavedHint') });
    onClose();
  }, [dish, ingredients, onSave, onClose, t]);

  // ── Derived ingredient groups (for the current list display) ──────────
  const inStock = ingredients.filter(
    (i) => i.available && i.gross_g > 0,
  );
  const toBuy = ingredients.filter(
    (i) => !i.available && i.gross_g > 0,
  );

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
      >
        <SheetHeader className="border-b border-border/60 px-5 py-4">
          <SheetTitle className="truncate text-base">
            {te('title')} — {dishTitle(dish)}
          </SheetTitle>
        </SheetHeader>

        {/* ── Scrollable body ─────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-5">

            {/* ── Current ingredients ─────────────────────────────────── */}
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold">{te('ingredientsTitle')}</h3>
                <Badge variant="secondary" className="tabular-nums">
                  {ingredients.filter(i => i.gross_g > 0).length}
                </Badge>
              </div>

              {ingredients.length === 0 && (
                <p className="rounded-lg border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
                  {te('noIngredients')}
                </p>
              )}

              <ul className="divide-y divide-border/60 rounded-lg border border-border/60 bg-background">
                {ingredients.filter(i => i.gross_g > 0).map((ing, idx) => (
                  <IngRow
                    key={`${ing.slug}-${idx}`}
                    ing={ing}
                    onRemove={() => handleRemove(
                      ingredients.findIndex((x, i) => x.slug === ing.slug && i === idx)
                    )}
                  />
                ))}
              </ul>

              {/* Summary pills */}
              {(inStock.length > 0 || toBuy.length > 0) && (
                <div className="mt-2 flex gap-2">
                  {inStock.length > 0 && (
                    <Badge variant="outline" className="border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-[11px]">
                      ✅ {inStock.length} {te('summaryInStock')}
                    </Badge>
                  )}
                  {toBuy.length > 0 && (
                    <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-300 text-[11px]">
                      ⚠️ {toBuy.length} {te('summaryToBuy')}
                    </Badge>
                  )}
                </div>
              )}
            </section>

            {/* ── Add ingredient toggle ────────────────────────────────── */}
            {!addOpen ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full border-dashed"
                onClick={() => { setAddOpen(true); setManual(false); setForm(BLANK); setQuery(''); }}
              >
                <Plus className="mr-2 h-4 w-4" />
                {te('addBtn')}
              </Button>
            ) : (
              <div className="rounded-xl border border-border/60 bg-muted/10 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">
                    {manual ? te('manualTitle') : te('searchTitle')}
                  </h4>
                  <button
                    onClick={() => { setAddOpen(false); setManual(false); setForm(BLANK); setQuery(''); }}
                    className="rounded p-1 hover:bg-muted"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>

                {/* ── Catalog search (default) ─────────────────────────── */}
                {!manual && (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder={te('searchPlaceholder')}
                        className="pl-9"
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setForm(BLANK); }}
                        autoFocus
                      />
                      {searching && (
                        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                      )}
                    </div>

                    {/* Results */}
                    {results.length > 0 && (
                      <ul className="max-h-48 divide-y divide-border/60 overflow-y-auto rounded-lg border border-border/60 bg-background">
                        {results.map((ci) => (
                          <li key={ci.id}>
                            <button
                              type="button"
                              onClick={() => pickCatalog(ci)}
                              className={cn(
                                'flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/40',
                                form.catalogId === ci.id && 'bg-primary/10',
                              )}
                            >
                              {ci.image_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={ci.image_url}
                                  alt={ci.name}
                                  className="h-8 w-8 flex-shrink-0 rounded-md object-cover"
                                />
                              ) : (
                                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-muted text-base">
                                  {ci.name.charAt(0).toUpperCase()}
                                </span>
                              )}
                              <span className="font-medium">{ci.name}</span>
                              {ci.default_unit && (
                                <span className="ml-auto text-[11px] text-muted-foreground">
                                  {ci.default_unit}
                                </span>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Not found fallback */}
                    <button
                      type="button"
                      className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                      onClick={() => { setManual(true); setForm({ ...BLANK, name: query }); }}
                    >
                      {te('notFound')}
                    </button>
                  </div>
                )}

                {/* ── Form fields (always shown after picking / in manual mode) */}
                {(form.catalogId || manual) && (
                  <div className="space-y-3">
                    <Separator />

                    {/* Name (editable in manual mode, read-only from catalog) */}
                    <div className="space-y-1">
                      <Label className="text-xs">{te('fieldName')}</Label>
                      <Input
                        value={form.name}
                        readOnly={!!form.catalogId && !manual}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder={te('fieldNamePlaceholder')}
                        className={!!form.catalogId && !manual ? 'bg-muted' : ''}
                      />
                    </div>

                    {/* Quantity + unit */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">{te('fieldQty')}</Label>
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          value={form.qty}
                          onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value }))}
                          placeholder="100"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{te('fieldUnit')}</Label>
                        <Select
                          value={form.unit}
                          onValueChange={(v) => setForm((f) => ({ ...f, unit: v as Unit }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {UNIT_OPTIONS.map((u) => (
                              <SelectItem key={u} value={u}>{u}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Live computed mass — helps users sanity-check ml ↔ g */}
                    {(() => {
                      const q = parseFloat(form.qty);
                      if (!q || q <= 0) return null;
                      const grams = toGrams(q, form.unit, form.density, form.pieceG);
                      const equal = form.unit === 'g';
                      const detail =
                        form.unit === 'ml' && form.density
                          ? ` (× ${form.density.toFixed(2)} g/ml)`
                          : form.unit === 'pcs' && form.pieceG
                            ? ` (× ${Math.round(form.pieceG)} g/pcs)`
                            : '';
                      return (
                        <p className="text-[11px] text-muted-foreground tabular-nums">
                          {equal
                            ? `≈ ${Math.round(grams)} g`
                            : `${q} ${form.unit}${detail} ≈ ${Math.round(grams)} g`}
                        </p>
                      );
                    })()}

                    {/* Role */}
                    <div className="space-y-1">
                      <Label className="text-xs">{te('fieldRole')}</Label>
                      <Select
                        value={form.role}
                        onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_OPTIONS.map((r) => (
                            <SelectItem key={r} value={r}>
                              {t.has(`role.${r}`) ? t(`role.${r}`) : r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Status */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">{te('fieldStatus')}</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {(
                          [
                            { value: 'in_stock', label: '✅', sub: te('statusInStock') },
                            { value: 'need_to_buy', label: '⚠️', sub: te('statusToBuy') },
                            { value: 'optional', label: '🌿', sub: te('statusOptional') },
                          ] as const
                        ).map(({ value, label, sub }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, status: value }))}
                            className={cn(
                              'flex flex-col items-center gap-0.5 rounded-lg border p-2.5 text-center text-xs transition-colors',
                              form.status === value
                                ? 'border-primary bg-primary/10 font-semibold text-primary'
                                : 'border-border/60 hover:bg-muted/40',
                            )}
                          >
                            <span className="text-base">{label}</span>
                            <span className="leading-tight">{sub}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      disabled={!form.name.trim() || !form.qty || parseFloat(form.qty) <= 0}
                      onClick={handleAdd}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {te('addConfirm')}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <SheetFooter className="border-t border-border/60 px-5 py-4">
          <SheetClose asChild>
            <Button variant="ghost">{te('cancel')}</Button>
          </SheetClose>
          <Button onClick={handleSave}>
            {te('save')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ── IngRow — one line in the current-ingredients list ───────────────────────

function IngRow({
  ing,
  onRemove,
}: {
  ing: SuggestedIngredient;
  onRemove: () => void;
}) {
  const status =
    ing.expiring_soon ? '🔥'
      : ing.available ? '✅'
      : '⚠️';

  return (
    <li className="group flex items-center gap-3 px-3 py-2.5 text-sm">
      {ing.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={ing.image_url}
          alt={ing.name}
          className="h-8 w-8 flex-shrink-0 rounded-md object-cover"
        />
      ) : (
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-muted text-sm font-semibold text-muted-foreground">
          {ing.name.charAt(0).toUpperCase()}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate font-medium capitalize">{ing.name}</span>
      <span className="tabular-nums text-xs text-muted-foreground">{Math.round(ing.gross_g)} g</span>
      <span className="text-base" title={String(ing.available)}>{status}</span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-1 rounded p-1 opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
        aria-label="remove"
      >
        <Trash2 className="h-3.5 w-3.5 text-destructive" />
      </button>
    </li>
  );
}
