'use client';

/**
 * My Dishes — list of recipes the user has saved (RecipeV2).
 *
 * Endpoints:
 *   GET    /api/recipes/v2                 → user's recipes (localized)
 *   DELETE /api/recipes/v2/:id             → remove a recipe
 *
 * Each recipe is returned in the *user's* language by the backend, so we
 * just render fields directly. Pricing is stored in cents → divide by 100.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  Plus,
  RefreshCw,
  Search,
  Trash2,
  ChefHat,
  Clock,
  Users,
  Banknote,
  Loader2,
  ArrowRight,
  CookingPot,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CookDialog } from '@/components/app/CookDialog';

import { api, ApiError } from '@/lib/chefos-api';
import { deleteRecipe } from '@/lib/chefos-mutations';
import { useChefOSSync } from '@/lib/chefos-store';
import type { RecipeV2 } from '@/lib/chefos-types';
import { cn } from '@/lib/utils';

type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; recipes: RecipeV2[] };

export function MyDishesClient({ locale: _locale }: { locale: string }) {
  const t = useTranslations('app.myDishes');
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [cookTarget, setCookTarget] = useState<RecipeV2 | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (silent) setRefreshing(true);
      else setState({ kind: 'loading' });
      try {
        const recipes = await api.get<RecipeV2[]>('/api/recipes/v2');
        setState({ kind: 'ready', recipes });
      } catch (e) {
        const message =
          e instanceof ApiError ? e.message : e instanceof Error ? e.message : t('errorBody');
        setState({ kind: 'error', message });
      } finally {
        setRefreshing(false);
      }
    },
    [t],
  );

  useEffect(() => {
    load();
  }, [load]);

  // Cross-page sync: refetch when any client changes recipes; tab focus; 30 s.
  useChefOSSync('recipes', () => load(true), 30_000);

  const filtered = useMemo(() => {
    if (state.kind !== 'ready') return [];
    const q = search.trim().toLowerCase();
    if (!q) return state.recipes;
    return state.recipes.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.ingredients.some((i) => i.catalog_ingredient_name?.toLowerCase().includes(q)),
    );
  }, [state, search]);

  async function onDelete(id: string) {
    if (!confirm(t('confirmDelete'))) return;
    setDeletingId(id);
    try {
      await deleteRecipe(id);
      toast.success(t('toastDeleted'));
      // No reload — invalidation triggers refetch via useChefOSSync.
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : t('toastDeleteFailed');
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  }

  // ── header ────────────────────────────────────────────────────────────
  const header = (
    <header className="flex items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-black tracking-tight lg:text-3xl">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => load(true)}
          disabled={refreshing || state.kind === 'loading'}
        >
          <RefreshCw className={cn('mr-2 h-4 w-4', refreshing && 'animate-spin')} />
          {t('refresh')}
        </Button>
      </div>
    </header>
  );

  if (state.kind === 'loading') {
    return (
      <div className="space-y-6">
        {header}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (state.kind === 'error') {
    return (
      <div className="space-y-6">
        {header}
        <Card className="border-destructive/30">
          <CardContent className="space-y-3 p-6">
            <p className="text-sm font-semibold text-destructive">{t('errorTitle')}</p>
            <p className="text-sm text-muted-foreground">{state.message}</p>
            <Button onClick={() => load()} size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('retry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state.recipes.length === 0) {
    return (
      <div className="space-y-6">
        {header}
        <Card>
          <CardContent className="p-8 text-center">
            <ChefHat className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <h2 className="mt-4 text-lg font-bold">{t('emptyTitle')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('emptyBody')}</p>
            <p className="mt-4 text-xs text-muted-foreground">{t('comingSoon')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}

      {/* Search */}
      <Card className="border-border/60">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Grid */}
      {filtered.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">{t('noMatches')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => (
            <RecipeCard
              key={r.id}
              recipe={r}
              t={t}
              onDelete={() => onDelete(r.id)}
              onCook={() => setCookTarget(r)}
              deleting={deletingId === r.id}
            />
          ))}
        </div>
      )}

      <CookDialog recipe={cookTarget} onClose={() => setCookTarget(null)} />
    </div>
  );
}

// ── Recipe card ────────────────────────────────────────────────────────────

function RecipeCard({
  recipe,
  t,
  onDelete,
  onCook,
  deleting,
}: {
  recipe: RecipeV2;
  t: ReturnType<typeof useTranslations<'app.myDishes'>>;
  onDelete: () => void;
  onCook: () => void;
  deleting: boolean;
}) {
  const cost = recipe.cost_per_serving_cents;
  const totalCost = recipe.total_cost_cents;
  const ingredientCount = recipe.ingredients.length;

  return (
    <Card className="overflow-hidden border-border/60 transition-shadow hover:shadow-md">
      <div className="relative aspect-video w-full bg-muted">
        {recipe.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={recipe.image_url}
            alt={recipe.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
            <ChefHat className="h-10 w-10" />
          </div>
        )}
        {recipe.is_public && (
          <Badge className="absolute right-2 top-2" variant="secondary">
            {t('public')}
          </Badge>
        )}
      </div>

      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-base font-bold leading-tight">{recipe.name}</h3>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
            aria-label={t('delete')}
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {t('servings', { count: recipe.servings })}
          </span>
          <span className="inline-flex items-center gap-1">
            <Plus className="h-3.5 w-3.5" />
            {t('ingredients', { count: ingredientCount })}
          </span>
          {cost !== null && cost !== undefined && (
            <span className="inline-flex items-center gap-1">
              <Banknote className="h-3.5 w-3.5" />
              {t('costPerServing', { value: (cost / 100).toFixed(2) })}
            </span>
          )}
        </div>

        {recipe.instructions && (
          <p className="line-clamp-3 text-xs text-muted-foreground">{recipe.instructions}</p>
        )}

        {totalCost !== null && totalCost !== undefined && (
          <p className="text-xs font-semibold text-foreground">
            {t('totalCost', { value: (totalCost / 100).toFixed(2) })}
          </p>
        )}

        <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {new Date(recipe.updated_at).toLocaleDateString()}
          </span>
          <Button size="sm" variant="default" onClick={onCook} className="h-7 px-2 text-xs">
            <CookingPot className="mr-1 h-3.5 w-3.5" />
            {t('cook')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
