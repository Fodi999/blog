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

type Unit = 'g' | 'kg' | 'ml' | 'l' | 'pcs' | 'tbsp' | 'tsp';
const UNIT_OPTIONS: Unit[] = ['g', 'kg', 'ml', 'l', 'pcs', 'tbsp', 'tsp'];

/**
 * Map the backend's canonical `default_unit` strings (`liter`, `kilogram`,
 * `milliliter`, `gram`, `piece`, …) to the UI-friendly enum used by the
 * form.  We keep `l` and `kg` distinct from `ml`/`g` so a value of `0.3`
 * for milk really means 300 ml, not 0.3 ml.
 */
function mapBackendUnit(s: string | null | undefined): Unit {
  if (!s) return 'g';
  const k = s.trim().toLowerCase();
  const m: Record<string, Unit> = {
    g: 'g', gr: 'g', gram: 'g', grams: 'g',
    kg: 'kg', kilogram: 'kg', kilograms: 'kg',
    ml: 'ml', milliliter: 'ml', milliliters: 'ml', millilitre: 'ml',
    l: 'l', liter: 'l', liters: 'l', litre: 'l',
    pcs: 'pcs', pc: 'pcs', piece: 'pcs', pieces: 'pcs', шт: 'pcs', sztuka: 'pcs',
    tbsp: 'tbsp', tablespoon: 'tbsp',
    tsp: 'tsp', teaspoon: 'tsp',
  };
  return m[k] ?? 'g';
}

/**
 * Density-aware mass conversion.
 *   • `g`   → grams pass-through.
 *   • `kg`  → qty × 1000.
 *   • `ml`  → qty × density (water 1.00, milk 1.03, oil 0.91, honey 1.42 …).
 *   • `l`   → qty × 1000 × density  (so 0.3 l of milk ≈ 309 g).
 *   • `pcs` → qty × `typical_portion_g` (egg 60 g, apple 180 g …); 100 g default.
 *   • `tbsp`/`tsp` → qty × 15 ml / 5 ml × density.
 *
 * When the catalog item has no density attached we gracefully fall back
 * to 1.0 g/ml — same behaviour as before, just no longer hard-coded.
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
    case 'kg':   return qty * 1000;
    case 'ml':   return qty * d;
    case 'l':    return qty * 1000 * d;
    case 'pcs':  return qty * p;
    case 'tbsp': return qty * 15 * d;
    case 'tsp':  return qty * 5  * d;
  }
}

/**
 * Pretty-print the gross mass back into a user-friendly unit so the list
 * row can show "0.3 l (309 g)" or "2 pcs (120 g)" instead of cryptic grams.
 *
 * Heuristic:
 *   • If `typical_portion_g` is set AND grams is a near-multiple of it,
 *     show pcs.
 *   • Else if `density_g_per_ml` is set, show ml/l (litres if ≥ 500 g).
 *   • Else show g/kg (kg if ≥ 1000 g).
 */
function prettyMass(
  grams: number,
  density?: number | null,
  pieceG?: number | null,
): string {
  if (!Number.isFinite(grams) || grams <= 0) return '0 g';

  // pcs branch — only if pieceG is known and grams ≈ k × pieceG (±5 %)
  if (pieceG && pieceG > 0) {
    const pcs = grams / pieceG;
    const rounded = Math.round(pcs);
    if (rounded >= 1 && Math.abs(pcs - rounded) / pcs < 0.05) {
      return rounded === 1 ? `1 pcs (${Math.round(grams)} g)` : `${rounded} pcs (${Math.round(grams)} g)`;
    }
  }

  // liquid branch
  if (density && density > 0) {
    const ml = grams / density;
    if (ml >= 1000) return `${(ml / 1000).toFixed(2).replace(/\.?0+$/, '')} l (${Math.round(grams)} g)`;
    if (ml >= 50)   return `${Math.round(ml)} ml (${Math.round(grams)} g)`;
  }

  // dry branch
  if (grams >= 1000) return `${(grams / 1000).toFixed(2).replace(/\.?0+$/, '')} kg`;
  return `${Math.round(grams)} g`;
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

  // ── Editable name + cooking steps ─────────────────────────────────────
  const [name, setName] = useState<string>(dishTitle(dish));
  const [steps, setSteps] = useState(dish.steps.map((s) => ({ ...s })));

  // Re-sync when a new dish is passed (e.g. regenerated)
  useEffect(() => {
    if (open) {
      setIngredients(dish.ingredients);
      setName(dishTitle(dish));
      setSteps(dish.steps.map((s) => ({ ...s })));
    }
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
      density_g_per_ml: form.density ?? undefined,
      typical_portion_g: form.pieceG ?? undefined,
      display_qty: qty,
      display_unit: form.unit,
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

  // ── Steps editing ──────────────────────────────────────────────────────
  function updateStep(i: number, patch: Partial<{ text: string; time_min: number | null; temp_c: number | null; tip: string | null }>) {
    setSteps((list) => list.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function removeStep(i: number) {
    setSteps((list) => list.filter((_, idx) => idx !== i));
  }
  function addStep() {
    setSteps((list) => [
      ...list,
      { step: list.length + 1, text: '', time_min: null, temp_c: null, tip: null },
    ]);
  }

  // ── Save draft ─────────────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    // Renumber steps in case the user reordered / removed any.
    const renumbered = steps
      .map((s) => ({ ...s, text: (s.text ?? '').trim() }))
      .filter((s) => s.text.length > 0)
      .map((s, i) => ({ ...s, step: i + 1 }));

    const trimmed = name.trim();
    const updated: SuggestedDish = {
      ...dish,
      ingredients,
      steps: renumbered,
      // Write the user-edited title into `display_name` — `dishTitle()`
      // gives it priority over the original AI-generated names.
      display_name: trimmed || dish.display_name,
    };
    onSave(updated);
    toast.success(t('toast.draftSaved'), { description: t('toast.draftSavedHint') });
    onClose();
  }, [dish, ingredients, name, steps, onSave, onClose, t]);

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

            {/* ── Dish name ───────────────────────────────────────────── */}
            <section className="space-y-1.5">
              <Label className="text-xs font-semibold">{te('fieldDishName')}</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={te('fieldDishNamePlaceholder')}
                className="text-base font-medium"
              />
            </section>

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

            {/* ── Cooking steps ────────────────────────────────────────── */}
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold">{te('stepsTitle')}</h3>
                <Badge variant="secondary" className="tabular-nums">{steps.length}</Badge>
              </div>

              {steps.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
                  {te('noSteps')}
                </p>
              ) : (
                <ol className="space-y-2.5">
                  {steps.map((s, i) => (
                    <li
                      key={i}
                      className="space-y-2 rounded-lg border border-border/60 bg-background p-3"
                    >
                      <div className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-1 shrink-0 tabular-nums">
                          {i + 1}
                        </Badge>
                        <textarea
                          value={s.text}
                          onChange={(e) => updateStep(i, { text: e.target.value })}
                          placeholder={te('stepTextPlaceholder')}
                          rows={2}
                          className={cn(
                            'flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs',
                            'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                            'resize-y',
                          )}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeStep(i)}
                          aria-label={te('removeStep')}
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pl-9">
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            {te('stepTime')}
                          </Label>
                          <Input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            value={s.time_min ?? ''}
                            onChange={(e) =>
                              updateStep(i, {
                                time_min: e.target.value === '' ? null : Math.max(0, parseInt(e.target.value, 10) || 0),
                              })
                            }
                            placeholder="—"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            {te('stepTemp')}
                          </Label>
                          <Input
                            type="number"
                            inputMode="numeric"
                            value={s.temp_c ?? ''}
                            onChange={(e) =>
                              updateStep(i, {
                                temp_c: e.target.value === '' ? null : parseInt(e.target.value, 10) || 0,
                              })
                            }
                            placeholder="—"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            {te('stepTip')}
                          </Label>
                          <Input
                            value={s.tip ?? ''}
                            onChange={(e) =>
                              updateStep(i, { tip: e.target.value || null })
                            }
                            placeholder={te('stepTipPlaceholder')}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addStep}
                className="mt-2 w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                {te('addStep')}
              </Button>
            </section>
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

  /**
   * Display priority:
   *   1. If the user picked the unit explicitly while editing → show
   *      the original number + unit (e.g. "0.3 l (309 g)").
   *   2. Else fall back to a smart pretty-print from grams using density
   *      and typical_portion_g (eggs become "2 pcs", milk becomes ml).
   *   3. Last resort — plain grams.
   */
  let label: string;
  if (ing.display_qty != null && ing.display_unit) {
    const grams = Math.round(ing.gross_g);
    label = grams > 0
      ? `${ing.display_qty} ${ing.display_unit} (${grams} g)`
      : `${ing.display_qty} ${ing.display_unit}`;
  } else {
    label = prettyMass(ing.gross_g, ing.density_g_per_ml, ing.typical_portion_g);
  }

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
      <span className="tabular-nums text-xs text-muted-foreground">{label}</span>
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
