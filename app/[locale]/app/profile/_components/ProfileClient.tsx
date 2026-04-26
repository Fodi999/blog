'use client';

/**
 * /app/profile — full ChefOS profile editor, 1:1 with iOS ProfileView.
 *
 * Sections (mirrors iOS):
 *   1. Identity strip       (avatar + email + tenant + role)
 *   2. Personal info        (display name read-only, age, weight, target)
 *   3. Goals                (fitness goal + calories + protein + meals/day)
 *   4. Preferences          (diet, cuisine, likes, dislikes)
 *   5. Restrictions         (allergies, intolerances, medical conditions)
 *   6. Lifestyle            (cooking level, cooking time)
 *   7. AI summary           (derived, read-only)
 *   8. Region & language    (avatar URL upload + UI language)
 *
 * Endpoints used:
 *   GET  /api/me               → identity + tenant
 *   GET  /api/preferences      → UserPreferences
 *   PUT  /api/preferences      → save full prefs
 *   PUT  /api/profile/avatar   → avatar URL
 *   PUT  /api/profile/language → UI language
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import {
  Loader2,
  LogOut,
  Mail,
  Building2,
  ImagePlus,
  Check,
  Save,
  X,
  Plus,
  Sparkles,
  Heart,
  ShieldAlert,
  Flame,
  ChefHat,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { api, ApiError } from '@/lib/chefos-api';
import { updateAvatarUrl } from '@/lib/chefos-mutations';
import { invalidate } from '@/lib/chefos-store';
import { logout } from '@/lib/auth-client';
import {
  DEFAULT_PREFERENCES,
  type ChefOSLanguage,
  type MeResponse,
  type UserPreferences,
} from '@/lib/chefos-types';
import {
  COOKING_LEVEL_OPTIONS,
  COOKING_TIME_OPTIONS,
  CUISINE_OPTIONS,
  DIET_OPTIONS,
  GOAL_OPTIONS,
  type EnumOption,
} from '@/lib/profile-options';

const LANGS: ChefOSLanguage[] = ['pl', 'en', 'uk', 'ru'];

type LoadState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; me: MeResponse; prefs: UserPreferences };

function signature(p: UserPreferences, lang: string): string {
  return [
    p.age ?? '',
    p.weight ?? '',
    p.target_weight ?? '',
    p.goal,
    p.calorie_target,
    p.protein_target,
    p.meals_per_day,
    p.diet,
    p.preferred_cuisine,
    p.cooking_level,
    p.cooking_time,
    lang,
    p.likes.join('|'),
    p.dislikes.join('|'),
    p.allergies.join('|'),
    p.intolerances.join('|'),
    p.medical_conditions.join('|'),
  ].join('||');
}

export function ProfileClient({ locale }: { locale: string }) {
  const t = useTranslations('app.profile');
  const uiLocale = useLocale();
  const router = useRouter();

  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [language, setLanguage] = useState<ChefOSLanguage>(
    (uiLocale as ChefOSLanguage) ?? 'pl',
  );
  const [avatarUrl, setAvatarUrl] = useState('');
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const baselineRef = useRef<string>('');

  const load = useCallback(async () => {
    setState({ kind: 'loading' });
    try {
      const [me, prefsRaw] = await Promise.all([
        api.get<MeResponse>('/api/me'),
        api.get<UserPreferences>('/api/preferences'),
      ]);
      const merged: UserPreferences = { ...DEFAULT_PREFERENCES, ...prefsRaw };
      setState({ kind: 'ready', me, prefs: merged });
      setPrefs(merged);
      const lang = (me.user.language as ChefOSLanguage) || 'pl';
      setLanguage(LANGS.includes(lang) ? lang : 'pl');
      setAvatarUrl(me.user.avatar_url ?? '');
      baselineRef.current = signature(merged, lang);
    } catch (e) {
      const message =
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : t('errorBody');
      setState({ kind: 'error', message });
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = useMemo(
    () => state.kind === 'ready' && signature(prefs, language) !== baselineRef.current,
    [prefs, language, state.kind],
  );

  // ── mutations ──────────────────────────────────────────────────────────
  function update<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) {
    setPrefs((p) => ({ ...p, [key]: value }));
  }

  function addTag(field: keyof UserPreferences, value: string) {
    const v = value.trim();
    if (!v) return;
    setPrefs((p) => {
      const arr = (p[field] as string[]) ?? [];
      if (arr.includes(v)) return p;
      return { ...p, [field]: [...arr, v] };
    });
  }

  function removeTag(field: keyof UserPreferences, value: string) {
    setPrefs((p) => {
      const arr = (p[field] as string[]) ?? [];
      return { ...p, [field]: arr.filter((x) => x !== value) };
    });
  }

  async function savePrefs() {
    setSavingPrefs(true);
    try {
      await api.put('/api/preferences', { ...prefs, language });
      baselineRef.current = signature(prefs, language);
      invalidate('preferences', 'me');
      toast.success(t('saved'));
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : t('errorBody');
      toast.error(msg);
    } finally {
      setSavingPrefs(false);
    }
  }

  async function saveAvatar() {
    setSavingAvatar(true);
    try {
      await updateAvatarUrl(avatarUrl.trim());
      toast.success(t('saved'));
      setState((s) =>
        s.kind === 'ready'
          ? {
              ...s,
              me: {
                ...s.me,
                user: { ...s.me.user, avatar_url: avatarUrl.trim() || null },
              },
            }
          : s,
      );
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : t('errorBody');
      toast.error(msg);
    } finally {
      setSavingAvatar(false);
    }
  }

  function discard() {
    if (state.kind !== 'ready') return;
    setPrefs(state.prefs);
    setLanguage((state.me.user.language as ChefOSLanguage) || 'pl');
  }

  function onLogout() {
    logout();
    router.push('/login');
  }

  // ── render: loading / error ─────────────────────────────────────────────
  if (state.kind === 'loading') {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-64" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (state.kind === 'error') {
    return (
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle>{t('errorTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{state.message}</p>
          <Button onClick={load}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('retry')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { me } = state;
  const displayName = me.user.display_name?.trim() || me.user.email;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="space-y-6 pb-32">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>

      {/* 1 — Identity strip */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-2xl font-semibold text-primary">
            {me.user.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={me.user.avatar_url}
                alt={displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              initial
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold">{displayName}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5" /> {me.user.email}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" /> {me.tenant.name}
            </p>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {me.user.role}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 2 — Personal info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('sections.personal')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FieldNumber
            label={t('fields.age')}
            value={prefs.age}
            onChange={(v) => update('age', v)}
            min={0}
            max={120}
          />
          <FieldNumber
            label={t('fields.weight')}
            value={prefs.weight}
            onChange={(v) => update('weight', v)}
            step={0.1}
            min={0}
            max={400}
            suffix="kg"
          />
          <FieldNumber
            label={t('fields.targetWeight')}
            value={prefs.target_weight}
            onChange={(v) => update('target_weight', v)}
            step={0.1}
            min={0}
            max={400}
            suffix="kg"
          />
        </CardContent>
      </Card>

      {/* 3 — Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Flame className="h-4 w-4 text-rose-600" />
            {t('sections.goals')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <EnumGrid
            options={GOAL_OPTIONS}
            value={prefs.goal}
            onChange={(v) => update('goal', v)}
            kind="goal"
            t={t}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FieldNumber
              label={t('fields.calorieTarget')}
              value={prefs.calorie_target}
              onChange={(v) => update('calorie_target', v ?? 0)}
              min={500}
              max={6000}
              suffix="kcal"
            />
            <FieldNumber
              label={t('fields.proteinTarget')}
              value={prefs.protein_target}
              onChange={(v) => update('protein_target', v ?? 0)}
              min={0}
              max={400}
              suffix="g"
            />
            <FieldNumber
              label={t('fields.mealsPerDay')}
              value={prefs.meals_per_day}
              onChange={(v) => update('meals_per_day', v ?? 1)}
              min={1}
              max={8}
            />
          </div>
        </CardContent>
      </Card>

      {/* 4 — Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Heart className="h-4 w-4 text-fuchsia-600" />
            {t('sections.preferences')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label className="mb-2 block text-xs uppercase tracking-wide text-muted-foreground">
              {t('fields.diet')}
            </Label>
            <EnumGrid
              options={DIET_OPTIONS}
              value={prefs.diet}
              onChange={(v) => update('diet', v)}
              kind="diet"
              t={t}
            />
          </div>
          <div>
            <Label className="mb-2 block text-xs uppercase tracking-wide text-muted-foreground">
              {t('fields.cuisine')}
            </Label>
            <EnumGrid
              options={CUISINE_OPTIONS}
              value={prefs.preferred_cuisine}
              onChange={(v) => update('preferred_cuisine', v)}
              kind="cuisine"
              t={t}
            />
          </div>
          <TagField
            label={t('fields.likes')}
            placeholder={t('placeholders.likes')}
            values={prefs.likes}
            onAdd={(v) => addTag('likes', v)}
            onRemove={(v) => removeTag('likes', v)}
          />
          <TagField
            label={t('fields.dislikes')}
            placeholder={t('placeholders.dislikes')}
            values={prefs.dislikes}
            onAdd={(v) => addTag('dislikes', v)}
            onRemove={(v) => removeTag('dislikes', v)}
          />
        </CardContent>
      </Card>

      {/* 5 — Restrictions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            {t('sections.restrictions')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <TagField
            label={t('fields.allergies')}
            placeholder={t('placeholders.allergies')}
            values={prefs.allergies}
            onAdd={(v) => addTag('allergies', v)}
            onRemove={(v) => removeTag('allergies', v)}
            tone="danger"
          />
          <TagField
            label={t('fields.intolerances')}
            placeholder={t('placeholders.intolerances')}
            values={prefs.intolerances}
            onAdd={(v) => addTag('intolerances', v)}
            onRemove={(v) => removeTag('intolerances', v)}
            tone="warning"
          />
          <TagField
            label={t('fields.medicalConditions')}
            placeholder={t('placeholders.medicalConditions')}
            values={prefs.medical_conditions}
            onAdd={(v) => addTag('medical_conditions', v)}
            onRemove={(v) => removeTag('medical_conditions', v)}
            tone="warning"
          />
        </CardContent>
      </Card>

      {/* 6 — Lifestyle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ChefHat className="h-4 w-4 text-emerald-600" />
            {t('sections.lifestyle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label className="mb-2 block text-xs uppercase tracking-wide text-muted-foreground">
              {t('fields.cookingLevel')}
            </Label>
            <EnumGrid
              options={COOKING_LEVEL_OPTIONS}
              value={prefs.cooking_level}
              onChange={(v) => update('cooking_level', v)}
              kind="cookingLevel"
              t={t}
            />
          </div>
          <div>
            <Label className="mb-2 block text-xs uppercase tracking-wide text-muted-foreground">
              {t('fields.cookingTime')}
            </Label>
            <EnumGrid
              options={COOKING_TIME_OPTIONS}
              value={prefs.cooking_time}
              onChange={(v) => update('cooking_time', v)}
              kind="cookingTime"
              t={t}
            />
          </div>
        </CardContent>
      </Card>

      {/* 7 — AI Summary */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-background">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            {t('sections.aiSummary')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 text-sm">
          <SummaryLine
            label={t('ai.goal')}
            value={`${emojiOf(GOAL_OPTIONS, prefs.goal)} ${t(`goal.${prefs.goal}`)}`}
          />
          <SummaryLine
            label={t('ai.calories')}
            value={`${prefs.calorie_target} ${t('ai.kcal')} · ${t('ai.protein')}: ${prefs.protein_target}${t('ai.g')}`}
          />
          {prefs.diet !== 'no_restrictions' && (
            <SummaryLine
              label={t('ai.diet')}
              value={`${emojiOf(DIET_OPTIONS, prefs.diet)} ${t(`diet.${prefs.diet}`)}`}
            />
          )}
          {prefs.allergies.length > 0 && (
            <SummaryLine label={t('ai.avoid')} value={prefs.allergies.join(', ')} />
          )}
          {prefs.cooking_time !== 'any' && (
            <SummaryLine
              label={t('ai.time')}
              value={`${emojiOf(COOKING_TIME_OPTIONS, prefs.cooking_time)} ${t(`cookingTime.${prefs.cooking_time}`)}`}
            />
          )}
          <SummaryLine
            label={t('ai.level')}
            value={`${emojiOf(COOKING_LEVEL_OPTIONS, prefs.cooking_level)} ${t(`cookingLevel.${prefs.cooking_level}`)}`}
          />
        </CardContent>
      </Card>

      {/* 8 — Region & Avatar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ImagePlus className="h-4 w-4" />
            {t('avatarTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label htmlFor="avatar-url" className="text-xs uppercase tracking-wide text-muted-foreground">
            {t('avatarUrl')}
          </Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="avatar-url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://…"
              className="flex-1"
            />
            <Button onClick={saveAvatar} disabled={savingAvatar}>
              {savingAvatar ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              {t('save')}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{t('avatarHint')}</p>
        </CardContent>
      </Card>

      {/* Sign out */}
      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm font-medium">{t('signOutTitle')}</p>
            <p className="text-xs text-muted-foreground">{t('signOutBody')}</p>
          </div>
          <Button variant="outline" onClick={onLogout} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            {t('signOut')}
          </Button>
        </CardContent>
      </Card>

      {/* Sticky save bar */}
      {dirty && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/95 backdrop-blur lg:bottom-0">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-3 lg:px-8">
            <p className="text-sm font-medium">{t('unsavedChanges')}</p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={discard} disabled={savingPrefs}>
                <X className="mr-2 h-4 w-4" />
                {t('discard')}
              </Button>
              <Button onClick={savePrefs} disabled={savingPrefs}>
                {savingPrefs ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {t('save')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── helper components ────────────────────────────────────────────────────

function emojiOf(opts: EnumOption[], v: string): string {
  return opts.find((o) => o.value === v)?.emoji ?? '';
}

type TFn = ReturnType<typeof useTranslations<'app.profile'>>;

function EnumGrid({
  options,
  value,
  onChange,
  kind,
  t,
}: {
  options: EnumOption[];
  value: string;
  onChange: (v: string) => void;
  kind: 'goal' | 'diet' | 'cuisine' | 'cookingLevel' | 'cookingTime';
  t: TFn;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
              active
                ? 'border-primary bg-primary/10 text-foreground shadow-sm'
                : 'border-border/60 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
            }`}
          >
            <span className="text-base leading-none">{o.emoji}</span>
            <span className="min-w-0 flex-1 truncate font-medium">
              {t(`${kind}.${o.value}`)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function FieldNumber({
  label,
  value,
  onChange,
  min,
  max,
  step,
  suffix,
}: {
  label: string;
  value: number | null | undefined;
  onChange: (v: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={min}
          max={max}
          step={step ?? 1}
          value={value ?? ''}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === '') {
              onChange(null);
              return;
            }
            const n = Number(raw);
            if (Number.isFinite(n)) onChange(n);
          }}
          className="flex-1"
        />
        {suffix && (
          <span className="text-xs font-medium uppercase text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function TagField({
  label,
  placeholder,
  values,
  onAdd,
  onRemove,
  tone = 'neutral',
}: {
  label: string;
  placeholder: string;
  values: string[];
  onAdd: (v: string) => void;
  onRemove: (v: string) => void;
  tone?: 'neutral' | 'warning' | 'danger';
}) {
  const [draft, setDraft] = useState('');
  const toneCls =
    tone === 'danger'
      ? 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30'
      : tone === 'warning'
      ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30'
      : 'bg-muted text-foreground border-border/60';

  function commit() {
    const v = draft.trim();
    if (!v) return;
    onAdd(v);
    setDraft('');
  }

  return (
    <div>
      <Label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit();
            }
          }}
          className="flex-1"
        />
        <Button type="button" variant="outline" onClick={commit}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {values.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {values.map((v) => (
            <span
              key={v}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${toneCls}`}
            >
              {v}
              <button
                type="button"
                onClick={() => onRemove(v)}
                className="-mr-1 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-foreground/10"
                aria-label="remove"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex items-baseline gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="font-medium">{value}</span>
    </p>
  );
}
