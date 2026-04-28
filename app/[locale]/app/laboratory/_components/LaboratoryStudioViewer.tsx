'use client';

/**
 * LaboratoryStudioViewer — fullscreen 3D Product Studio (PR #19).
 *
 * Renders a three-pane layout:
 *
 *   ┌────────────────── TopBar ──────────────────┐
 *   │                                            │
 *   │ Left │      ModelViewer (canvas)    │ Right
 *   │ tool │      (studioMode = true)     │ panel
 *   │ bar  │                              │
 *   ├────────────── BottomBar ────────────────────┤
 *
 * Imperative actions (Reset Camera, Screenshot, Auto-rotate toggle) flow
 * through the `ModelViewerApi` exposed by `ModelViewer.onReady`.
 *
 * The component is mounted from `app/[locale]/app/laboratory/assets/[assetId]`
 * after the asset is fetched on the server-rendered shell page. All state
 * (auto-rotate, env preset, panel tab) is kept local — there's no backend
 * round-trip on UI changes.
 */

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { resolveAssetUrl, type Laboratory3DAsset } from '@/lib/laboratory-api';
import type { ModelViewerApi, StudioEnvPreset } from './ModelViewer';

// Dynamic import — three.js is large and ssr=false avoids hydration noise.
const ModelViewer = dynamic(
  () => import('./ModelViewer').then((m) => m.ModelViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-zinc-950 text-sm text-zinc-500">
        loading 3D engine…
      </div>
    ),
  },
);

const ENV_PRESETS: { id: StudioEnvPreset; label: string }[] = [
  { id: 'studio', label: 'Studio' },
  { id: 'city', label: 'City' },
  { id: 'warehouse', label: 'Warehouse' },
  { id: 'apartment', label: 'Soft' },
  { id: 'sunset', label: 'Sunset' },
  { id: 'night', label: 'Dark' },
];

interface Props {
  asset: Laboratory3DAsset;
  /** Locale-aware return path back to the regular Laboratory page. */
  backHref: string;
}

export function LaboratoryStudioViewer({ asset, backHref }: Props) {
  const modelUrl = useMemo(
    () => (asset.model_url ? resolveAssetUrl(asset.model_url) : null),
    [asset.model_url],
  );

  const [autoRotate, setAutoRotate] = useState(true);
  const [envPreset, setEnvPreset] = useState<StudioEnvPreset>('studio');
  const [tab, setTab] = useState<'object' | 'materials' | 'lighting' | 'advanced'>(
    'object',
  );
  const [api, setApi] = useState<ModelViewerApi | null>(null);

  const onReset = useCallback(() => {
    api?.resetCamera();
    toast.success('Camera reset');
  }, [api]);

  const onScreenshot = useCallback(() => {
    const data = api?.takeScreenshot();
    if (!data) {
      toast.error('Screenshot failed');
      return;
    }
    const a = document.createElement('a');
    a.href = data;
    a.download = `${asset.object_type ?? 'chefos'}-${asset.id.slice(0, 8)}.png`;
    a.click();
    toast.success('Screenshot saved');
  }, [api, asset.id, asset.object_type]);

  const onDownloadModel = useCallback(() => {
    if (!modelUrl) return;
    const a = document.createElement('a');
    a.href = modelUrl;
    a.download = `${asset.object_type ?? 'chefos'}-${asset.id.slice(0, 8)}.${
      asset.model_format ?? 'glb'
    }`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
  }, [asset.id, asset.model_format, asset.object_type, modelUrl]);

  if (!modelUrl) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-zinc-950 text-zinc-300">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-center">
          <p className="font-medium">3D model not available</p>
          <p className="mt-1 text-sm text-zinc-500">
            Asset status: <span className="font-mono">{asset.status}</span>
          </p>
          <Link
            href={backHref}
            className="mt-4 inline-block rounded-md border border-zinc-700 px-3 py-1.5 text-sm hover:bg-zinc-800"
          >
            ← Back to Laboratory
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-zinc-950 text-zinc-100">
      {/* ── Top Bar ───────────────────────────────────────────────── */}
      <TopBar
        asset={asset}
        backHref={backHref}
        onReset={onReset}
        onScreenshot={onScreenshot}
        onDownloadModel={onDownloadModel}
      />

      {/* ── Main: left toolbar + canvas + right inspector ──────────── */}
      <div className="grid min-h-0 flex-1 grid-cols-[56px_1fr_320px]">
        <LeftToolbar
          autoRotate={autoRotate}
          onToggleAutoRotate={() => setAutoRotate((v) => !v)}
          onReset={onReset}
        />

        <div className="relative min-h-0 bg-zinc-950">
          <ModelViewer
            modelUrl={modelUrl}
            studioMode
            autoRotate={autoRotate}
            environmentPreset={envPreset}
            onReady={setApi}
            className="h-full w-full"
          />
        </div>

        <RightInspector
          asset={asset}
          tab={tab}
          onTabChange={setTab}
          envPreset={envPreset}
          onEnvPresetChange={setEnvPreset}
        />
      </div>

      {/* ── Bottom info strip ────────────────────────────────────── */}
      <BottomBar asset={asset} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function TopBar({
  asset,
  backHref,
  onReset,
  onScreenshot,
  onDownloadModel,
}: {
  asset: Laboratory3DAsset;
  backHref: string;
  onReset: () => void;
  onScreenshot: () => void;
  onDownloadModel: () => void;
}) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-900/60 px-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <Link
          href={backHref}
          className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          aria-label="Back to Laboratory"
        >
          ←
        </Link>
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="text-amber-400">●</span>
            ChefOS 3D Studio
          </div>
          <div className="text-xs text-zinc-500">
            Asset:{' '}
            <span className="font-mono text-zinc-400">
              {asset.object_type ?? 'unknown'}
            </span>{' '}
            · <span className="font-mono">{asset.id.slice(0, 8)}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ToolbarButton onClick={onReset} title="Reset camera (R)">
          Reset View
        </ToolbarButton>
        <ToolbarButton onClick={onScreenshot} title="Save PNG screenshot">
          Screenshot
        </ToolbarButton>
        <ToolbarButton
          onClick={onDownloadModel}
          title="Download GLB model"
          accent
        >
          Download GLB
        </ToolbarButton>
      </div>
    </header>
  );
}

function ToolbarButton({
  children,
  onClick,
  title,
  accent = false,
  active = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
  accent?: boolean;
  active?: boolean;
}) {
  const cls = accent
    ? 'border-amber-500/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20'
    : active
      ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
      : 'border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800';
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${cls}`}
    >
      {children}
    </button>
  );
}

function LeftToolbar({
  autoRotate,
  onToggleAutoRotate,
  onReset,
}: {
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  onReset: () => void;
}) {
  return (
    <aside className="flex flex-col items-center gap-1 border-r border-zinc-800 bg-zinc-900/40 py-3">
      <IconButton title="Rotate / Orbit" active>
        ↻
      </IconButton>
      <IconButton title="Pan (hold shift)">⇔</IconButton>
      <IconButton title="Zoom (scroll wheel)">⊕</IconButton>
      <div className="my-2 h-px w-8 bg-zinc-800" />
      <IconButton
        title={autoRotate ? 'Auto-rotate: ON' : 'Auto-rotate: OFF'}
        active={autoRotate}
        onClick={onToggleAutoRotate}
      >
        ⟳
      </IconButton>
      <IconButton title="Reset camera" onClick={onReset}>
        ⌂
      </IconButton>
    </aside>
  );
}

function IconButton({
  children,
  title,
  active = false,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const cls = active
    ? 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30'
    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100';
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex h-9 w-9 items-center justify-center rounded-md text-base transition ${cls}`}
    >
      {children}
    </button>
  );
}

function RightInspector({
  asset,
  tab,
  onTabChange,
  envPreset,
  onEnvPresetChange,
}: {
  asset: Laboratory3DAsset;
  tab: 'object' | 'materials' | 'lighting' | 'advanced';
  onTabChange: (t: 'object' | 'materials' | 'lighting' | 'advanced') => void;
  envPreset: StudioEnvPreset;
  onEnvPresetChange: (p: StudioEnvPreset) => void;
}) {
  return (
    <aside className="flex min-h-0 flex-col border-l border-zinc-800 bg-zinc-900/40">
      <nav className="flex border-b border-zinc-800 text-xs">
        {(['object', 'materials', 'lighting', 'advanced'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onTabChange(t)}
            className={`flex-1 border-b-2 px-3 py-2 capitalize transition ${
              tab === t
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-zinc-500 hover:text-zinc-200'
            }`}
          >
            {t}
          </button>
        ))}
      </nav>

      <div className="flex-1 overflow-auto p-4 text-xs">
        {tab === 'object' ? <ObjectPanel asset={asset} /> : null}
        {tab === 'materials' ? <MaterialsPanel asset={asset} /> : null}
        {tab === 'lighting' ? (
          <LightingPanel preset={envPreset} onChange={onEnvPresetChange} />
        ) : null}
        {tab === 'advanced' ? <AdvancedPanel asset={asset} /> : null}
      </div>
    </aside>
  );
}

function ObjectPanel({ asset }: { asset: Laboratory3DAsset }) {
  const created = new Date(asset.created_at).toLocaleString();
  return (
    <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1.5 text-zinc-400">
      <dt>Type</dt>
      <dd className="font-mono text-zinc-200">{asset.object_type ?? '—'}</dd>
      <dt>Format</dt>
      <dd className="font-mono uppercase text-zinc-200">
        {asset.model_format ?? 'glb'}
      </dd>
      <dt>Status</dt>
      <dd>
        <StatusPill status={asset.status} />
      </dd>
      <dt>Provider</dt>
      <dd className="font-mono text-zinc-200">{asset.provider}</dd>
      <dt>Created</dt>
      <dd className="text-zinc-300">{created}</dd>
      <dt>ID</dt>
      <dd className="break-all font-mono text-[10px] text-zinc-500">
        {asset.id}
      </dd>
    </dl>
  );
}

function StatusPill({ status }: { status: Laboratory3DAsset['status'] }) {
  const map: Record<Laboratory3DAsset['status'], string> = {
    ready: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
    pending: 'bg-zinc-500/15 text-zinc-300 ring-zinc-500/30',
    analyzing_image: 'bg-sky-500/15 text-sky-300 ring-sky-500/30',
    generating_model: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
    failed: 'bg-rose-500/15 text-rose-300 ring-rose-500/30',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${map[status]}`}
    >
      {status}
    </span>
  );
}

function MaterialsPanel({ asset }: { asset: Laboratory3DAsset }) {
  // Best-effort material list from object_type — the actual material names
  // live inside the GLB and are only knowable client-side after the model
  // has been parsed. Until we wire a callback up from ModelViewer, show
  // the canonical list per object_type so users see what's there.
  const materials = inferMaterials(asset.object_type ?? '');
  if (materials.length === 0) {
    return <p className="text-zinc-500">No material info available.</p>;
  }
  return (
    <ul className="space-y-1.5">
      {materials.map((m) => (
        <li
          key={m.name}
          className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/60 px-2 py-1.5"
        >
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full ring-1 ring-zinc-700"
              style={{ background: m.swatch }}
            />
            <span className="font-mono text-zinc-200">{m.name}</span>
          </div>
          <span className="text-[10px] uppercase tracking-wide text-zinc-500">
            {m.kind}
          </span>
        </li>
      ))}
    </ul>
  );
}

function inferMaterials(
  objectType: string,
): { name: string; kind: string; swatch: string }[] {
  switch (objectType) {
    case 'sauce_in_bowl':
      return [
        { name: 'bowl_outer', kind: 'ceramic', swatch: '#e8e2d6' },
        { name: 'bowl_inner', kind: 'ceramic', swatch: '#e8e2d6' },
        { name: 'bowl_rim', kind: 'ceramic', swatch: '#e8e2d6' },
        { name: 'bowl_foot', kind: 'ceramic', swatch: '#e8e2d6' },
        { name: 'sauce_material', kind: 'liquid', swatch: '#b8321f' },
      ];
    case 'bottled_sauce':
      return [
        { name: 'bottle_glass', kind: 'glass', swatch: '#dde8e2' },
        { name: 'cap_metal', kind: 'metal', swatch: '#8a8a90' },
        { name: 'liquid_material', kind: 'liquid', swatch: '#b8321f' },
        { name: 'bottle_label', kind: 'label', swatch: '#f7f5e8' },
      ];
    case 'jar_product':
      return [
        { name: 'jar_glass', kind: 'glass', swatch: '#dde8e2' },
        { name: 'product_material', kind: 'product', swatch: '#a85b12' },
        { name: 'lid_metal', kind: 'metal', swatch: '#9e802e' },
        { name: 'jar_label', kind: 'label', swatch: '#f7f5e8' },
      ];
    case 'plate_food':
      return [
        { name: 'plate_ceramic', kind: 'ceramic', swatch: '#f0eadf' },
        { name: 'product_material', kind: 'food', swatch: '#a85b12' },
      ];
    default:
      return [];
  }
}

function LightingPanel({
  preset,
  onChange,
}: {
  preset: StudioEnvPreset;
  onChange: (p: StudioEnvPreset) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-[10px] uppercase tracking-wide text-zinc-500">
        HDRI environment
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        {ENV_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onChange(p.id)}
            className={`rounded-md border px-2 py-2 text-xs transition ${
              preset === p.id
                ? 'border-amber-500/50 bg-amber-500/10 text-amber-200'
                : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-zinc-500">
        Studio: brushed metal &amp; glass.
        <br />
        Sunset / Night: cinematic mood.
        <br />
        Soft: pastel product photography.
      </p>
    </div>
  );
}

function AdvancedPanel({ asset }: { asset: Laboratory3DAsset }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1 text-[10px] uppercase tracking-wide text-zinc-500">
          Model URL
        </p>
        <p className="break-all rounded-md bg-zinc-900 p-2 font-mono text-[10px] text-zinc-400">
          {asset.model_url ?? '—'}
        </p>
      </div>
      {asset.thumbnail_url ? (
        <div>
          <p className="mb-1 text-[10px] uppercase tracking-wide text-zinc-500">
            Thumbnail
          </p>
          <p className="break-all rounded-md bg-zinc-900 p-2 font-mono text-[10px] text-zinc-400">
            {asset.thumbnail_url}
          </p>
        </div>
      ) : null}
      {asset.object_spec ? (
        <details open>
          <summary className="cursor-pointer text-[10px] uppercase tracking-wide text-zinc-500">
            Product3DSpec
          </summary>
          <pre className="mt-1 max-h-72 overflow-auto rounded-md bg-zinc-900 p-2 text-[10px] text-zinc-300">
            {JSON.stringify(asset.object_spec, null, 2)}
          </pre>
        </details>
      ) : null}
      {asset.error_message ? (
        <div className="rounded-md border border-rose-500/30 bg-rose-500/10 p-2 text-[11px] text-rose-200">
          {asset.error_message}
        </div>
      ) : null}
    </div>
  );
}

function BottomBar({ asset }: { asset: Laboratory3DAsset }) {
  return (
    <footer className="flex h-9 items-center justify-between border-t border-zinc-800 bg-zinc-900/60 px-4 text-[11px] text-zinc-500">
      <div className="flex items-center gap-3">
        <span>
          object: <span className="text-zinc-300">{asset.object_type ?? '—'}</span>
        </span>
        <span>·</span>
        <span>
          format:{' '}
          <span className="uppercase text-zinc-300">
            {asset.model_format ?? 'glb'}
          </span>
        </span>
        <span>·</span>
        <span>
          status: <StatusPill status={asset.status} />
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-zinc-600">drag · rotate</span>
        <span className="text-zinc-600">shift+drag · pan</span>
        <span className="text-zinc-600">scroll · zoom</span>
      </div>
    </footer>
  );
}
