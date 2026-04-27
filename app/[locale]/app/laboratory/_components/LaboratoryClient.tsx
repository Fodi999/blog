'use client';

/**
 * Laboratory dashboard.
 *
 * Layout (desktop):
 *
 *   ┌──────────────────────────────────────────────┐
 *   │  Copilot (top zone — input + suggestions)    │
 *   ├────────────────────┬─────────────────────────┤
 *   │ Ingredients        │ Process steps           │
 *   ├────────────────────┴─────────────────────────┤
 *   │ Analysis (5 sub-zones):                      │
 *   │  • Process effects   • Flavor    • Shelf     │
 *   │  • Pairing chips     • Warnings              │
 *   └──────────────────────────────────────────────┘
 *
 * On mobile zones stack vertically.
 *
 * State strategy: a single `project` object is kept in state and
 * replaced wholesale on every mutating call (every backend handler
 * already returns the full hydrated `LabProject`). This keeps the
 * client trivial — no optimistic updates, no diffing.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  FlaskConical,
  Plus,
  Trash2,
  Sparkles,
  AlertTriangle,
  Thermometer,
  Clock,
  Loader2,
  PlayCircle,
  Snowflake,
  Refrigerator,
  ChefHat,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ApiError } from '@/lib/chefos-api';
import {
  laboratoryApi,
  riskColor,
  severityColor,
  type LabProject,
  type LabProjectSummary,
  type LabAnalysis,
  type LabFlavorResult,
  type LabPairing,
  type LabStorageRec,
  type LabWarning,
  type LabStepEffect,
  type CopilotSuggestResponse,
  type LaboratoryVisualStory,
} from '@/lib/laboratory-api';
import {
  ProductProcessScene,
  type SceneStep,
} from '@/components/laboratory/ProductProcessScene';
import { VisualStoryPlayer } from '@/components/laboratory/VisualStoryPlayer';

// ────────────────────────────────────────────────────────────────────────────

/**
 * Backend may serialize a freshly-created project without arrays
 * (defaults missing). Guarantee shape on the client to avoid runtime
 * `.length` access on `undefined`.
 */
function normalizeProject(p: LabProject): LabProject {
  return {
    ...p,
    ingredients: p.ingredients ?? [],
    process_steps: p.process_steps ?? [],
  };
}

export function LaboratoryClient({ locale }: { locale: string }) {
  const t = useTranslations('app.laboratory');
  const [projects, setProjects] = useState<LabProjectSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [project, setProject] = useState<LabProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visualStory, setVisualStory] = useState<LaboratoryVisualStory | null>(null);

  // Auto-analyze pulse — incremented on every successful constructor mutation
  // (add/remove ingredient, add/remove step). A debounced effect re-runs the
  // analysis a moment later, so the user always sees a fresh
  // `latest_analysis` + Visual Story matching the current recipe state
  // (no need to press "Analyze" again after every tweak).
  const [analyzeTick, setAnalyzeTick] = useState(0);
  const analyzeRunSeq = useRef(0);
  const projectRef = useRef<LabProject | null>(null);

  // Wrapped setter that always normalizes incoming project shape.
  const setProjectSafe = (p: LabProject) => setProject(normalizeProject(p));

  // Bump the auto-analyze clock together with state replacement.
  const setProjectAndPulse = (p: LabProject) => {
    setProject(normalizeProject(p));
    setAnalyzeTick((n) => n + 1);
  };

  // Load list on mount.
  useEffect(() => {
    let cancelled = false;
    laboratoryApi
      .list()
      .then((data) => {
        if (cancelled) return;
        setProjects(data);
        if (data.length > 0) setActiveId(data[0].id);
        else setLoading(false);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'load_failed');
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Load active project on switch.
  useEffect(() => {
    if (!activeId) {
      setProject(null);
      setVisualStory(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setVisualStory(null);
    laboratoryApi
      .get(activeId)
      .then((p) => {
        if (cancelled) return;
        setProject(normalizeProject(p));
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        // ── 404 self-heal: stale project id from cache or another tab.
        // Drop it from the list, pick a sibling (or empty state) instead
        // of leaving the user stuck on a "Resource not found" banner.
        if (e instanceof ApiError && e.status === 404) {
          setProjects((prev) => {
            const next = prev.filter((pp) => pp.id !== activeId);
            const fallback = next[0]?.id ?? null;
            // Schedule a microtask so we don't update activeId during the
            // current render commit phase.
            queueMicrotask(() => setActiveId(fallback));
            return next;
          });
          setProject(null);
          setLoading(false);
          return;
        }
        setError(e instanceof Error ? e.message : 'load_failed');
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  // ── Auto-analyze (debounced) ─────────────────────────────────────────────
  // Whenever the user mutates the recipe (add/remove ingredient or step),
  // schedule a fresh analyze + scenes pass after a short pause so we don't
  // hammer the backend during rapid edits. Cancellable via `analyzeRunSeq`
  // — only the latest scheduled run actually applies its result.
  useEffect(() => {
    projectRef.current = project;
  }, [project]);

  useEffect(() => {
    if (analyzeTick === 0) return;
    const snap = projectRef.current;
    if (!snap) return;
    if (snap.ingredients.length === 0) {
      setVisualStory(null);
      return;
    }
    const projectId = snap.id;
    const mySeq = ++analyzeRunSeq.current;
    const timer = setTimeout(async () => {
      setAnalyzing(true);
      try {
        const updated = await laboratoryApi.analyze(projectId, locale);
        if (mySeq !== analyzeRunSeq.current) return; // stale result
        setProject(normalizeProject(updated));
        try {
          const story = await laboratoryApi.generateScenes(projectId);
          if (mySeq !== analyzeRunSeq.current) return;
          setVisualStory(story);
        } catch {
          if (mySeq === analyzeRunSeq.current) setVisualStory(null);
        }
      } catch (e) {
        if (mySeq !== analyzeRunSeq.current) return;
        // Silent on auto-analyze; the manual button surfaces errors.
        // eslint-disable-next-line no-console
        console.warn('auto-analyze failed', e);
      } finally {
        if (mySeq === analyzeRunSeq.current) setAnalyzing(false);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [analyzeTick, locale]);

  async function handleCreate(name: string, productType?: string) {
    try {
      const created = await laboratoryApi.create({
        name,
        target_product_type: productType ?? null,
      });
      setProjects((prev) => [
        { id: created.id, name: created.name, description: null, target_product_type: created.target_product_type, status: created.status },
        ...prev,
      ]);
      setActiveId(created.id);
      setProject(normalizeProject(created));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'create_failed');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t('confirmDelete'))) return;
    try {
      await laboratoryApi.remove(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (activeId === id) {
        setActiveId(null);
        setProject(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'delete_failed');
    }
  }

  async function handleAnalyze() {
    if (!project) return;
    setAnalyzing(true);
    setError(null);
    try {
      const updated = await laboratoryApi.analyze(project.id, locale);
      setProject(normalizeProject(updated));
      // Build the visual story right after analysis. Best-effort —
      // a failure here doesn't break the rest of the analysis UI.
      try {
        const story = await laboratoryApi.generateScenes(project.id);
        setVisualStory(story);
      } catch (storyErr) {
        // eslint-disable-next-line no-console
        console.warn('generate-scenes failed', storyErr);
        setVisualStory(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'analyze_failed');
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="space-y-6 pb-24 lg:pb-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2 text-primary">
            <FlaskConical className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
          </div>
        </div>
        <NewProjectButton onCreate={handleCreate} t={t} />
      </header>

      {/* Project tabs */}
      {projects.length > 0 && (
        <ProjectTabs
          projects={projects}
          activeId={activeId}
          onSelect={setActiveId}
          onDelete={handleDelete}
        />
      )}

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> {t('loading')}
        </div>
      ) : !project ? (
        <EmptyState onCreate={handleCreate} t={t} />
      ) : (
        <>
          {/* Zone 1 — Copilot */}
          <CopilotZone
            project={project}
            onChange={setProjectSafe}
            onApplyAndAnalyze={async (updated) => {
              setProjectSafe(updated);
              setAnalyzing(true);
              setError(null);
              try {
                const analyzed = await laboratoryApi.analyze(updated.id, locale);
                setProjectSafe(analyzed);
              } catch (e) {
                setError(e instanceof Error ? e.message : 'analyze_failed');
              } finally {
                setAnalyzing(false);
              }
            }}
            locale={locale}
            t={t}
          />

          {/* Zone 2 — Constructor */}
          <ConstructorZone
            project={project}
            onChange={setProjectAndPulse}
            t={t}
          />

          {/* Analyze action */}
          <div className="flex items-center justify-end">
            <Button
              size="lg"
              onClick={handleAnalyze}
              disabled={analyzing || project.ingredients.length === 0}
            >
              {analyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('analyzing')}
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  {t('analyze')}
                </>
              )}
            </Button>
          </div>

          {/* Zone 3a — Visual Story Player (the "wow" block) */}
          {visualStory && visualStory.scenes.length > 0 && (
            <VisualStoryPlayer
              story={visualStory}
              labels={{
                title: t('story.title'),
                subtitle: t('story.subtitle'),
                prev: t('story.prev'),
                next: t('story.next'),
                play: t('story.play'),
                pause: t('story.pause'),
                placeholder: t('story.placeholder'),
                ofLabel: t('scene.of'),
                empty: t('story.empty'),
              }}
            />
          )}

          {/* Zone 3 — Process Scene (animation) */}
          {project.latest_analysis &&
            project.latest_analysis.process_effects.step_effects.length > 0 && (
              <ProductProcessScene
                steps={project.latest_analysis.process_effects.step_effects.map(
                  (s): SceneStep => ({
                    step_id: s.step_id,
                    order_index: s.order_index,
                    technique: s.technique,
                    temperature_c: s.temperature_c ?? null,
                    duration_min: s.duration_min ?? null,
                    effects: (s.effects ?? []).map((e) => ({
                      visual_token: e.visual_token,
                      effect_type: e.effect_type,
                      label: e.label,
                      intensity: e.intensity,
                      message: e.message ?? null,
                    })),
                  }),
                )}
                labels={{
                  title: t('scene.title'),
                  subtitle: t('scene.subtitle'),
                  nextEffect: t('scene.nextEffect'),
                  noData: t('scene.noData'),
                  noDataHint: t('scene.noDataHint'),
                  ofLabel: t('scene.of'),
                }}
              />
            )}

          {/* Zone 4 — Analysis */}
          {project.latest_analysis && (
            <AnalysisZone
              analysis={project.latest_analysis}
              onAddPairing={async (slug) => {
                try {
                  const updated = await laboratoryApi.addIngredient(project.id, {
                    ingredient_slug: slug,
                    quantity: 50,
                    unit: 'g',
                  });
                  const lastAdded = updated.ingredients?.find(
                    (i) => i.ingredient_slug === slug,
                  );
                  if (lastAdded?.merged) {
                    toast.info(t('ingredients.merged'), {
                      description: t('ingredients.mergedDesc', {
                        slug,
                        qty: lastAdded.quantity,
                        unit: lastAdded.unit,
                      }),
                    });
                  } else {
                    toast.success(t('ingredients.added'));
                  }
                  setProjectAndPulse(updated);
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'add_failed');
                }
              }}
              t={t}
            />
          )}
        </>
      )}
    </div>
  );
}

// ── New project button ──────────────────────────────────────────────────────

function NewProjectButton({
  onCreate,
  t,
}: {
  onCreate: (name: string, type?: string) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('');

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        {t('newProject')}
      </Button>
    );
  }

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onCreate(name.trim(), type.trim() || undefined);
        setName('');
        setType('');
        setOpen(false);
      }}
    >
      <Input
        placeholder={t('projectName')}
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-56"
        autoFocus
      />
      <Input
        placeholder={t('productType')}
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="w-40"
      />
      <Button type="submit" size="sm">
        {t('create')}
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
        {t('cancel')}
      </Button>
    </form>
  );
}

// ── Project tabs ────────────────────────────────────────────────────────────

function ProjectTabs({
  projects,
  activeId,
  onSelect,
  onDelete,
}: {
  projects: LabProjectSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {projects.map((p) => {
        const active = p.id === activeId;
        return (
          <div
            key={p.id}
            className={cn(
              'group flex shrink-0 items-center gap-1 rounded-full border px-1 py-1 text-sm transition-colors',
              active
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background hover:bg-muted',
            )}
          >
            <button
              type="button"
              onClick={() => onSelect(p.id)}
              className="px-3 py-1 font-medium"
            >
              {p.name}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(p.id);
              }}
              className="rounded-full p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/20 hover:text-destructive group-hover:opacity-100"
              aria-label="delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({
  onCreate,
  t,
}: {
  onCreate: (name: string, type?: string) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
        <FlaskConical className="h-12 w-12 text-muted-foreground" />
        <div>
          <h3 className="text-lg font-semibold">{t('emptyTitle')}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t('emptyBody')}</p>
        </div>
        <Button onClick={() => onCreate(t('exampleName'), 'sauce')}>
          <Plus className="mr-2 h-4 w-4" />
          {t('createFirst')}
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Zone 1: Copilot (placeholder for Step 8) ────────────────────────────────

function CopilotZone({
  project,
  onChange,
  onApplyAndAnalyze,
  locale,
  t,
}: {
  project: LabProject;
  onChange: (p: LabProject) => void;
  onApplyAndAnalyze: (updated: LabProject) => Promise<void>;
  locale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const [prompt, setPrompt] = useState('');
  const [draft, setDraft] = useState<CopilotSuggestResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSuggest(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setErr(null);
    setDraft(null);
    try {
      const res = await laboratoryApi.copilotSuggest(prompt.trim(), locale);
      setDraft(res);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'suggest_failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleApply(andAnalyze = false) {
    if (!draft) return;
    // Backend returns { ingredients, steps, ... } but be defensive in case the
    // shape changes or fields are missing — never call .length on undefined.
    const draftIngredients = draft.ingredients ?? [];
    const draftSteps = draft.steps ?? [];
    if (draftIngredients.length === 0 && draftSteps.length === 0) {
      setErr('Nothing to apply');
      return;
    }
    setApplying(true);
    setErr(null);
    let mergedCount = 0;
    let duplicateStepCount = 0;
    let addedSteps = 0;
    try {
      let updated: LabProject = project;
      // Add only catalog-known ingredients (others would 404 on the backend).
      for (const ing of draftIngredients) {
        if (!ing.in_catalog) continue;
        try {
          updated = await laboratoryApi.addIngredient(project.id, {
            ingredient_slug: ing.slug,
            quantity: ing.quantity,
            unit: ing.unit,
            role: ing.role,
          });
          // Last entry of returned ingredients with `merged: true` ⇒ it was a merge.
          const list = updated.ingredients ?? [];
          const last = list[list.length - 1];
          if (last && last.ingredient_slug === ing.slug && last.merged) {
            mergedCount += 1;
          }
        } catch (ingErr) {
          // 404 = ingredient not in catalog after all → skip silently.
          if (ingErr instanceof ApiError && ingErr.status === 404) {
            continue;
          }
          throw ingErr;
        }
      }
      for (const step of draftSteps) {
        try {
          updated = await laboratoryApi.addStep(project.id, {
            technique: step.technique,
            temperature_c: step.temperature_c ?? null,
            duration_min: step.duration_min ?? null,
            notes: step.note || null,
          });
          addedSteps += 1;
        } catch (stepErr) {
          // Backend rejects an identical back-to-back step with 409.
          // Skip it silently and keep going — the rest of the plan is still
          // valuable. We surface the count once at the end.
          const msg =
            stepErr instanceof Error ? String(stepErr.message ?? '') : '';
          if (
            (stepErr instanceof ApiError && stepErr.status === 409) ||
            msg.includes('DUPLICATE_STEP')
          ) {
            duplicateStepCount += 1;
            continue;
          }
          throw stepErr;
        }
      }
      setDraft(null);
      setPrompt('');
      if (mergedCount > 0) {
        toast.info(t('ingredients.merged'), {
          description: `×${mergedCount}`,
        });
      }
      if (duplicateStepCount > 0) {
        toast.warning(t('step.duplicate.title'), {
          description: t('step.duplicate.batchDesc', { count: duplicateStepCount }),
        });
      }
      if (andAnalyze) {
        await onApplyAndAnalyze(updated);
      } else {
        onChange(updated);
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'apply_failed');
    } finally {
      setApplying(false);
    }
  }

  const confPct = draft ? Math.round((draft.confidence ?? 0) * 100) : 0;
  const draftIngredientsView = draft?.ingredients ?? [];
  const draftStepsView = draft?.steps ?? [];
  const draftUnmatched = draft?.unmatched_tokens ?? [];
  const knownCount = draftIngredientsView.filter((i) => i.in_catalog).length;
  const skippedCount = draftIngredientsView.length - knownCount;

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          {t('copilot.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <form className="flex flex-col gap-2 sm:flex-row" onSubmit={handleSuggest}>
          <Input
            placeholder={t('copilot.placeholder')}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading || applying}
            maxLength={500}
          />
          <Button type="submit" disabled={loading || applying || !prompt.trim()}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('copilot.suggesting')}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                {t('copilot.suggest')}
              </>
            )}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground">{t('copilot.hint')}</p>

        {err && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {err}
          </div>
        )}

        {draft && (
          <div className="space-y-3 rounded-lg border bg-background/60 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="capitalize">
                {draft.product_type}
              </Badge>
              <span className="font-medium">{draft.suggested_name}</span>
              <Badge variant="outline" className="ml-auto text-[11px]">
                {t('copilot.confidence')}: {confPct}%
              </Badge>
            </div>

            {draft.rationale && (
              <p className="text-xs text-muted-foreground">{draft.rationale}</p>
            )}

            {draftIngredientsView.length > 0 && (
              <div>
                <div className="mb-1 text-xs font-medium text-muted-foreground">
                  {t('copilot.ingredients')} ({knownCount}/{draftIngredientsView.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {draftIngredientsView.map((i) => (
                    <Badge
                      key={i.slug}
                      variant={i.in_catalog ? 'default' : 'outline'}
                      className={cn(
                        'text-[11px]',
                        !i.in_catalog && 'border-amber-500/40 text-amber-700 dark:text-amber-400',
                      )}
                      title={i.in_catalog ? '' : t('copilot.notInCatalog')}
                    >
                      {i.slug} · {i.quantity}{i.unit}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {draftStepsView.length > 0 && (
              <div>
                <div className="mb-1 text-xs font-medium text-muted-foreground">
                  {t('copilot.steps')} ({draftStepsView.length})
                </div>
                <ul className="space-y-1 text-xs">
                  {draftStepsView.map((s, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {s.technique}
                      </Badge>
                      <span className="text-muted-foreground">
                        {s.temperature_c != null && `${s.temperature_c}°C`}
                        {s.temperature_c != null && s.duration_min != null && ' · '}
                        {s.duration_min != null && `${s.duration_min} min`}
                        {(s.temperature_c != null || s.duration_min != null) && s.note && ' — '}
                        {s.note}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {draftUnmatched.length > 0 && (
              <div className="text-xs text-muted-foreground">
                {t('copilot.unmatched')}: {draftUnmatched.join(', ')}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
              {skippedCount > 0 && (
                <span className="mr-auto text-xs text-amber-600 dark:text-amber-400">
                  {t('copilot.skipMissing', { count: skippedCount })}
                </span>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDraft(null)}
                disabled={applying}
              >
                {t('copilot.discard')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleApply(false)}
                disabled={applying || knownCount === 0}
              >
                {t('copilot.apply')}
              </Button>
              <Button
                size="sm"
                onClick={() => handleApply(true)}
                disabled={applying || knownCount === 0}
              >
                {applying ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    {t('copilot.applying')}
                  </>
                ) : (
                  <>
                    <PlayCircle className="mr-2 h-3.5 w-3.5" />
                    {t('copilot.applyAndAnalyze')}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Zone 2: Constructor ─────────────────────────────────────────────────────

function ConstructorZone({
  project,
  onChange,
  t,
}: {
  project: LabProject;
  onChange: (p: LabProject) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <IngredientsCard project={project} onChange={onChange} t={t} />
      <StepsCard project={project} onChange={onChange} t={t} />
    </div>
  );
}

function IngredientsCard({
  project,
  onChange,
  t,
}: {
  project: LabProject;
  onChange: (p: LabProject) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const [slug, setSlug] = useState('');
  const [qty, setQty] = useState('100');
  const [unit, setUnit] = useState('g');
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!slug.trim()) return;
    setBusy(true);
    try {
      const cleanSlug = slug.trim();
      const updated = await laboratoryApi.addIngredient(project.id, {
        ingredient_slug: cleanSlug,
        quantity: Number(qty) || 0,
        unit,
      });
      // The merged ingredient is the one whose slug+unit matches what we
      // just sent — backend marks it with `merged: true` for that single
      // response (skip_serializing_if = is_none → not present otherwise).
      const matched = updated.ingredients?.find(
        (i) => i.ingredient_slug === cleanSlug && i.unit === unit,
      );
      if (matched?.merged) {
        toast.info(t('ingredients.merged'), {
          description: t('ingredients.mergedDesc', {
            slug: cleanSlug,
            qty: matched.quantity,
            unit: matched.unit,
          }),
        });
      }
      onChange(updated);
      setSlug('');
      setQty('100');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(t('ingredients.addFailed') || 'Add failed', {
        description: msg,
      });
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      await laboratoryApi.removeIngredient(project.id, id);
      const fresh = await laboratoryApi.get(project.id);
      onChange(fresh);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ChefHat className="h-4 w-4" />
          {t('ingredients.title')}
          <Badge variant="secondary" className="ml-auto">
            {project.ingredients.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-1.5">
          {project.ingredients.map((ing) => (
            <li
              key={ing.id}
              className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{ing.ingredient_slug}</p>
                <p className="text-xs text-muted-foreground">
                  {ing.quantity} {ing.unit}
                  {ing.role && ` · ${ing.role}`}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => remove(ing.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
          {project.ingredients.length === 0 && (
            <li className="rounded-lg border border-dashed py-4 text-center text-xs text-muted-foreground">
              {t('ingredients.empty')}
            </li>
          )}
        </ul>
        <form onSubmit={add} className="flex flex-wrap gap-2">
          <Input
            placeholder={t('ingredients.slug')}
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="min-w-0 flex-1"
          />
          <Input
            type="number"
            min={0}
            step="0.1"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="w-20"
          />
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="rounded-md border bg-background px-2 text-sm"
          >
            <option value="g">g</option>
            <option value="ml">ml</option>
            <option value="pcs">pcs</option>
          </select>
          <Button type="submit" size="sm" disabled={busy || !slug.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function StepsCard({
  project,
  onChange,
  t,
}: {
  project: LabProject;
  onChange: (p: LabProject) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const [tech, setTech] = useState('heat');
  const [temp, setTemp] = useState('75');
  const [dur, setDur] = useState('10');
  const [busy, setBusy] = useState(false);

  const allSlugs = useMemo(
    () => project.ingredients.map((i) => i.ingredient_slug),
    [project.ingredients],
  );

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const updated = await laboratoryApi.addStep(project.id, {
        technique: tech,
        temperature_c: temp ? Number(temp) : null,
        duration_min: dur ? Number(dur) : null,
        target_slugs: allSlugs,
      });
      onChange(updated);
    } catch (e) {
      if (
        e instanceof ApiError &&
        e.status === 409 &&
        /DUPLICATE_STEP/i.test(e.message)
      ) {
        toast.warning(t('step.duplicate.title'), {
          description: t('step.duplicate.desc'),
        });
        return;
      }
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(t('step.addFailed') || 'Add failed', { description: msg });
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      await laboratoryApi.removeStep(project.id, id);
      const fresh = await laboratoryApi.get(project.id);
      onChange(fresh);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Thermometer className="h-4 w-4" />
          {t('steps.title')}
          <Badge variant="secondary" className="ml-auto">
            {project.process_steps.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ol className="space-y-1.5">
          {project.process_steps.map((s, i) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-medium">{s.technique}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.temperature_c && `${s.temperature_c}°C`}
                    {s.temperature_c && s.duration_min && ' · '}
                    {s.duration_min && `${s.duration_min} ${t('steps.min')}`}
                  </p>
                </div>
              </div>
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => remove(s.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
          {project.process_steps.length === 0 && (
            <li className="rounded-lg border border-dashed py-4 text-center text-xs text-muted-foreground">
              {t('steps.empty')}
            </li>
          )}
        </ol>
        <form onSubmit={add} className="flex flex-wrap gap-2">
          <select
            value={tech}
            onChange={(e) => setTech(e.target.value)}
            className="rounded-md border bg-background px-2 text-sm"
          >
            <option value="heat">heat</option>
            <option value="blend">blend</option>
            <option value="ferment">ferment</option>
            <option value="cool">cool</option>
            <option value="mix">mix</option>
          </select>
          <Input
            type="number"
            min={0}
            placeholder="°C"
            value={temp}
            onChange={(e) => setTemp(e.target.value)}
            className="w-20"
          />
          <Input
            type="number"
            min={0}
            placeholder={t('steps.min')}
            value={dur}
            onChange={(e) => setDur(e.target.value)}
            className="w-20"
          />
          <Button type="submit" size="sm" disabled={busy}>
            <Plus className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ── Zone 3: Analysis ────────────────────────────────────────────────────────

function AnalysisZone({
  analysis,
  onAddPairing,
  t,
}: {
  analysis: LabAnalysis;
  onAddPairing: (slug: string) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="space-y-4">
      {analysis.warnings.length > 0 && (
        <WarningsBanner warnings={analysis.warnings} t={t} />
      )}
      <div className="grid gap-4 lg:grid-cols-3">
        <ProcessEffectsCard effects={analysis.process_effects} t={t} />
        <FlavorCard flavor={analysis.flavor_result} t={t} />
        <ShelfLifeCard analysis={analysis} t={t} />
      </div>
      {analysis.pairing_suggestions.length > 0 && (
        <PairingsCard
          pairings={analysis.pairing_suggestions}
          onAdd={onAddPairing}
          t={t}
        />
      )}
    </div>
  );
}

function WarningsBanner({
  warnings,
  t: _t,
}: {
  warnings: LabWarning[];
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="space-y-2">
      {warnings.map((w, i) => (
        <div
          key={i}
          className={cn(
            'flex items-start gap-3 rounded-lg border px-4 py-3 text-sm',
            severityColor(w.severity),
          )}
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1">
            <p className="font-medium">{w.message}</p>
            <p className="mt-0.5 text-xs opacity-70">{w.kind}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProcessEffectsCard({
  effects,
  t,
}: {
  effects: { step_effects: LabStepEffect[]; global_effects: unknown[] };
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          {t('analysis.processTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {effects.step_effects.length === 0 && (
          <p className="text-sm text-muted-foreground">{t('analysis.processEmpty')}</p>
        )}
        {effects.step_effects.map((s) => (
          <div key={s.step_id} className="rounded-lg border bg-muted/20 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t('steps.title')} #{s.order_index + 1} · {s.technique}
              {s.temperature_c != null && ` · ${s.temperature_c}°C`}
            </p>
            <ul className="space-y-2">
              {s.effects.map((e, i) => (
                <li key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {e.ingredient_name} — {e.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(e.intensity * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${Math.round(e.intensity * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{e.message}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function FlavorCard({
  flavor,
  t,
}: {
  flavor: LabFlavorResult;
  t: ReturnType<typeof useTranslations>;
}) {
  const bars: Array<[string, number | null]> = [
    [t('flavor.sweet'), flavor.sweetness],
    [t('flavor.acid'), flavor.acidity],
    [t('flavor.bitter'), flavor.bitterness],
    [t('flavor.umami'), flavor.umami],
    [t('flavor.aroma'), flavor.aroma],
  ];
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span>{t('analysis.flavorTitle')}</span>
          <Badge variant="outline" className="text-[10px] uppercase">
            {flavor.dominant_profile}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm font-medium">{flavor.balance_label}</p>
        <ul className="space-y-1.5">
          {bars.map(([label, value]) => (
            <li key={label} className="space-y-0.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{value != null ? value.toFixed(1) : '—'}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary"
                  style={{ width: value != null ? `${Math.min(100, value * 10)}%` : '0%' }}
                />
              </div>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">{flavor.message}</p>
      </CardContent>
    </Card>
  );
}

function ShelfLifeCard({
  analysis,
  t,
}: {
  analysis: LabAnalysis;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {t('analysis.shelfTitle')}
          </span>
          <Badge className={cn('uppercase', riskColor(analysis.risk_level))}>
            {analysis.risk_level}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-3xl font-bold">
            {analysis.shelf_life_days ?? '—'}
            <span className="ml-1 text-base font-normal text-muted-foreground">
              {t('analysis.days')}
            </span>
          </p>
        </div>
        <ul className="space-y-2">
          {analysis.storage_recommendations.map((r, i) => (
            <StorageRecRow key={i} rec={r} />
          ))}
          {analysis.storage_recommendations.length === 0 && (
            <li className="text-xs text-muted-foreground">{t('analysis.noStorage')}</li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}

function StorageRecRow({ rec }: { rec: LabStorageRec }) {
  const Icon =
    rec.method === 'freezing'
      ? Snowflake
      : rec.method === 'refrigeration'
        ? Refrigerator
        : Thermometer;
  return (
    <li className="flex items-start gap-2 rounded-md border bg-muted/20 p-2">
      <Icon className="mt-0.5 h-4 w-4 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">
          {rec.label}
          {rec.extra_days != null && (
            <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">
              +{rec.extra_days}d
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">{rec.message}</p>
      </div>
    </li>
  );
}

function PairingsCard({
  pairings,
  onAdd,
  t,
}: {
  pairings: LabPairing[];
  onAdd: (slug: string) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Plus className="h-4 w-4 text-primary" />
          {t('analysis.pairingsTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {pairings.map((p) => (
            <button
              key={p.ingredient_slug}
              type="button"
              onClick={() => onAdd(p.ingredient_slug)}
              title={p.reason}
              className="group flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-sm transition-colors hover:border-primary hover:bg-primary/10"
            >
              <Plus className="h-3 w-3 opacity-50 group-hover:opacity-100" />
              <span className="font-medium">{p.ingredient_name}</span>
              {p.role && (
                <span className="text-xs text-muted-foreground">· {p.role}</span>
              )}
              <span className="rounded-full bg-muted px-1.5 text-xs text-muted-foreground">
                {Math.round(p.score)}
              </span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
