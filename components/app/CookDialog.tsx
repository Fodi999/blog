'use client';

/**
 * CookDialog — "Готовить блюдо?" sheet shared across My Dishes and Dashboard.
 *
 * Mirrors iOS chat action `addToPlan`: the user picks a day + meal slot
 * for a saved recipe, we upsert it via `addRecipeToPlan`, and show a toast.
 * `useChefOSSync('plan', …)` on the Plan page picks up the change instantly.
 */
import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { CookingPot, Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { addRecipeToPlan } from '@/lib/chefos-mutations';
import { ApiError } from '@/lib/chefos-api';
import { MEAL_SLOTS, type MealSlot, type RecipeV2 } from '@/lib/chefos-types';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function isoPlusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function CookDialog({
  recipe,
  onClose,
}: {
  recipe: RecipeV2 | null;
  onClose: () => void;
}) {
  const t = useTranslations('app.cook');
  const [date, setDate] = useState<string>(todayIso());
  const [slot, setSlot] = useState<MealSlot>('lunch');
  const [saving, setSaving] = useState(false);

  // Reset state whenever a new recipe opens.
  useEffect(() => {
    if (recipe) {
      setDate(todayIso());
      setSlot('lunch');
      setSaving(false);
    }
  }, [recipe]);

  const dayChips = useMemo(
    () =>
      [0, 1, 2].map((d) => ({
        iso: isoPlusDays(d),
        label:
          d === 0
            ? t('today')
            : d === 1
              ? t('tomorrow')
              : new Date(isoPlusDays(d)).toLocaleDateString(undefined, {
                  weekday: 'short',
                }),
      })),
    [t],
  );

  if (!recipe) return null;

  async function confirm() {
    if (!recipe) return;
    setSaving(true);
    try {
      await addRecipeToPlan(date, slot, recipe);
      toast.success(t('toastAdded'));
      onClose();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t('toastFailed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={!!recipe} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CookingPot className="h-5 w-5 text-primary" />
            {t('title')}
          </DialogTitle>
          <DialogDescription>{recipe.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              {t('day')}
            </Label>
            <div className="flex flex-wrap gap-2">
              {dayChips.map((d) => (
                <button
                  key={d.iso}
                  type="button"
                  onClick={() => setDate(d.iso)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                    date === d.iso
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border/60 bg-background text-muted-foreground hover:bg-muted',
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              {t('slot')}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {MEAL_SLOTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSlot(s)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-sm font-semibold transition-colors',
                    slot === s
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border/60 bg-background text-muted-foreground hover:bg-muted',
                  )}
                >
                  {t(`slots.${s}`)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t('cancel')}
          </Button>
          <Button onClick={confirm} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CookingPot className="mr-2 h-4 w-4" />
            )}
            {t('confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
