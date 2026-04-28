'use client';

/**
 * LaboratoryStudioViewer — fullscreen 3D Product Studio (PR #19 revised).
 *
 * Covers the site header (z-[60] > glass-nav z-50).
 * Layout: TopBar / [LeftToolbar | Canvas | RightInspector] / BottomBar
 */

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { resolveAssetUrl, type Laboratory3DAsset } from '@/lib/laboratory-api';
import type {
  CameraPresetKey,
  DisplayMode,
  ModelViewerApi,
  StudioEnvPreset,
} from './ModelViewer';

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

const CAMERA_PRESET_LIST: { id: CameraPresetKey; label: string; icon: string }[] = [
  { id: 'default', label: 'Default', icon: '⬡' },
  { id: 'front',   label: 'Front',   icon: '▣' },
  { id: 'side',    label: 'Side',    icon: '▤' },
  { id: 'top',     label: 'Top',     icon: '▥' },
  { id: 'iso',     label: 'Iso',     icon: '◈' },
];

interface Props {
  asset: Laboratory3DAsset;
  backHref: string;
}

export function LaboratoryStudioViewer({ asset, backHref }: Props) {
  const modelUrl = useMemo(
    () => (asset.model_url ? resolveAssetUrl(asset.model_url) : null),
    [asset.model_url],
  );

  const [autoRotate, setAutoRotate]     = useState(true);
  const [envPreset, setEnvPreset]       = useState<StudioEnvPreset>('studio');
  const [displayMode, setDisplayMode]   = useState<DisplayMode>('floor');
  const [activePreset, setActivePreset] = useState<CameraPresetKey>('default');
  const [zoom, setZoom]                 = useState(0.55); // 0 = closest, 1 = farthest
  const [tab, setTab] = useState<'object' | 'camera' | 'environment' | 'display'>('object');
  const [api, setApi] = useState<ModelViewerApi | null>(null);

  const handleApiReady = useCallback((readyApi: ModelViewerApi) => {
    setApi(readyApi);
  }, []);

  const handleZoomChange = useCallback((val: number) => {
    setZoom(val);
    api?.setZoom(val);
  }, [api]);

  const applyPreset = useCallback(
    (preset: CameraPresetKey) => {
      setActivePreset(preset);
      api?.setCameraPreset(preset);
    },
    [api],
  );

  const onReset = useCallback(() => {
    applyPreset('default');
    toast.success('Camera reset');
  }, [applyPreset]);

  const onScreenshot = useCallback(() => {
    const data = api?.takeScreenshot();
    if (!data) { toast.error('Screenshot failed'); return; }
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
    a.download = `${asset.object_type ?? 'chefos'}-${asset.id.slice(0, 8)}.${asset.model_format ?? 'glb'}`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
  }, [asset.id, asset.model_format, asset.object_type, modelUrl]);

  if (!modelUrl) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-950 text-zinc-300">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-center">
          <p className="font-medium">3D model not available</p>
          <p className="mt-1 text-sm text-zinc-500">
            Status: <span className="font-mono">{asset.status}</span>
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
    /* z-[60] covers glass-nav (z-50) and MobileAppNav (z-40) */
    <div className="fixed inset-0 z-[60] flex flex-col bg-zinc-950 text-zinc-100">

      {/* ── Top Bar ─────────────────────────────────────────────────── */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-900/80 px-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Link
            href={backHref}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
          >
            <span>←</span>
            <span className="hidden sm:inline">Laboratory</span>
          </Link>
          <div className="h-4 w-px bg-zinc-700" />
          <span className="text-xs font-semibold tracking-wide text-amber-400">ChefOS Studio</span>
          <span className="hidden rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400 sm:inline">
            {asset.object_type ?? asset.id.slice(0, 8)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <TopBarBtn onClick={onReset} title="Reset camera">⊙ Reset</TopBarBtn>
          <TopBarBtn onClick={onScreenshot} title="Save PNG screenshot">⬛ Shot</TopBarBtn>
          <TopBarBtn onClick={onDownloadModel} title="Download GLB">↓ GLB</TopBarBtn>
          <TopBarBtn
            onClick={() => setAutoRotate((v) => !v)}
            title={autoRotate ? 'Pause rotation' : 'Start rotation'}
            active={autoRotate}
          >
            {autoRotate ? '⏸' : '▶'} Rotate
          </TopBarBtn>
        </div>
      </header>

      {/* ── Main Area ────────────────────────────────────────────────── */}
      <div className="grid min-h-0 flex-1 grid-cols-[52px_1fr_300px]">

        {/* Left Toolbar — camera presets + display modes */}
        <aside className="flex flex-col items-center gap-1 border-r border-zinc-800 bg-zinc-900/40 py-3">
          <SideSection label="VIEW">
            {CAMERA_PRESET_LIST.map((p) => (
              <ToolBtn
                key={p.id}
                title={p.label}
                active={activePreset === p.id}
                onClick={() => applyPreset(p.id)}
              >
                <span className="text-base leading-none">{p.icon}</span>
                <span className="text-[8px] leading-none">{p.label}</span>
              </ToolBtn>
            ))}
          </SideSection>

          <div className="my-1.5 h-px w-8 bg-zinc-700" />

          <SideSection label="FLOOR">
            <ToolBtn title="Clean" active={displayMode === 'clean'} onClick={() => setDisplayMode('clean')}>
              <span className="text-base leading-none">○</span>
              <span className="text-[8px] leading-none">Clean</span>
            </ToolBtn>
            <ToolBtn title="Shadow Floor" active={displayMode === 'floor'} onClick={() => setDisplayMode('floor')}>
              <span className="text-base leading-none">◑</span>
              <span className="text-[8px] leading-none">Floor</span>
            </ToolBtn>
            <ToolBtn title="Grid" active={displayMode === 'grid'} onClick={() => setDisplayMode('grid')}>
              <span className="text-base leading-none">⊞</span>
              <span className="text-[8px] leading-none">Grid</span>
            </ToolBtn>
          </SideSection>

          <div className="my-1.5 h-px w-8 bg-zinc-700" />

          {/* Zoom slider — вертикальная шкала */}
          <SideSection label="ZOOM">
            <div className="flex flex-col items-center gap-1 px-1">
              <span className="text-[9px] text-zinc-500">+</span>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(zoom * 100)}
                onChange={(e) => handleZoomChange(Number(e.target.value) / 100)}
                className="zoom-slider h-24 cursor-pointer appearance-none rounded-full bg-zinc-800"
                style={{
                  writingMode: 'vertical-lr' as React.CSSProperties['writingMode'],
                  direction: 'rtl',
                  width: '6px',
                  accentColor: '#f59e0b',
                }}
                title={`Zoom: ${Math.round(zoom * 100)}%`}
              />
              <span className="text-[9px] text-zinc-500">−</span>
            </div>
          </SideSection>
        </aside>

        {/* Canvas */}
        <main
          className="relative min-h-0 overflow-hidden"
          style={{
            background:
              'radial-gradient(ellipse at 50% 40%, #17191f 0%, #0d0f14 55%, #06070a 100%)',
          }}
        >
          <ModelViewer
            modelUrl={modelUrl}
            studioMode
            autoRotate={autoRotate}
            environmentPreset={envPreset}
            displayMode={displayMode}
            onReady={handleApiReady}
            className="h-full w-full"
          />
          <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-[10px] text-zinc-400 backdrop-blur-sm select-none whitespace-nowrap">
            Drag to orbit · Scroll to zoom · Right-drag to pan
          </div>
        </main>

        {/* Right Inspector */}
        <aside className="flex flex-col border-l border-zinc-800 bg-zinc-900/60">
          <div className="flex shrink-0 border-b border-zinc-800">
            {(['object', 'camera', 'environment', 'display'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                  tab === t
                    ? 'border-b-2 border-amber-400 text-amber-400'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3 text-xs">
            {tab === 'object'      && <ObjectTab asset={asset} />}
            {tab === 'camera'      && <CameraTab activePreset={activePreset} onPreset={applyPreset} onReset={onReset} />}
            {tab === 'environment' && <EnvironmentTab envPreset={envPreset} onEnvPreset={setEnvPreset} />}
            {tab === 'display'     && (
              <DisplayTab
                displayMode={displayMode}
                onDisplayMode={setDisplayMode}
                autoRotate={autoRotate}
                onAutoRotate={() => setAutoRotate((v) => !v)}
              />
            )}
          </div>
        </aside>
      </div>

      {/* ── Bottom status bar ───────────────────────────────────────── */}
      <footer className="flex h-7 shrink-0 items-center justify-between border-t border-zinc-800 bg-zinc-900/60 px-4">
        <span className="text-[10px] text-zinc-600">
          {asset.model_format?.toUpperCase() ?? 'GLB'} · {asset.id.slice(0, 8)}
        </span>
        <span className="text-[10px] text-zinc-600">
          env: {envPreset} · {displayMode}
        </span>
      </footer>
    </div>
  );
}

// ─── Inspector Tabs ───────────────────────────────────────────────────────────

function ObjectTab({ asset }: { asset: Laboratory3DAsset }) {
  const fields: [string, string][] = [
    ['Type',     asset.object_type ?? '—'],
    ['Format',   (asset.model_format ?? 'glb').toUpperCase()],
    ['Status',   asset.status],
    ['Provider', asset.provider ?? '—'],
    ['ID',       asset.id.slice(0, 12) + '…'],
  ];
  return (
    <InspectorSection title="Asset">
      {fields.map(([k, v]) => (
        <InspectorRow key={k} label={k} value={v} />
      ))}
    </InspectorSection>
  );
}

function CameraTab({
  activePreset,
  onPreset,
  onReset,
}: {
  activePreset: CameraPresetKey;
  onPreset: (k: CameraPresetKey) => void;
  onReset: () => void;
}) {
  return (
    <div className="space-y-3">
      <InspectorSection title="Preset Views">
        <div className="grid grid-cols-2 gap-1.5">
          {CAMERA_PRESET_LIST.map((p) => (
            <button
              key={p.id}
              onClick={() => onPreset(p.id)}
              className={`rounded border px-2 py-1.5 text-[11px] font-medium transition-colors ${
                activePreset === p.id
                  ? 'border-amber-500/60 bg-amber-500/10 text-amber-400'
                  : 'border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
              }`}
            >
              {p.icon} {p.label}
            </button>
          ))}
        </div>
      </InspectorSection>
      <InspectorSection title="Actions">
        <button
          onClick={onReset}
          className="w-full rounded border border-zinc-700 py-1.5 text-[11px] text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
        >
          Reset to Default
        </button>
      </InspectorSection>
      <InspectorSection title="Lens">
        <InspectorRow label="FOV"  value="35°" />
        <InspectorRow label="Near" value="0.01" />
        <InspectorRow label="Far"  value="50" />
      </InspectorSection>
    </div>
  );
}

function EnvironmentTab({
  envPreset,
  onEnvPreset,
}: {
  envPreset: StudioEnvPreset;
  onEnvPreset: (v: StudioEnvPreset) => void;
}) {
  return (
    <InspectorSection title="HDRI Preset">
      <div className="grid grid-cols-2 gap-1.5">
        {ENV_PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => onEnvPreset(p.id)}
            className={`rounded border px-2 py-1.5 text-[11px] font-medium transition-colors ${
              envPreset === p.id
                ? 'border-amber-500/60 bg-amber-500/10 text-amber-400'
                : 'border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </InspectorSection>
  );
}

function DisplayTab({
  displayMode,
  onDisplayMode,
  autoRotate,
  onAutoRotate,
}: {
  displayMode: DisplayMode;
  onDisplayMode: (v: DisplayMode) => void;
  autoRotate: boolean;
  onAutoRotate: () => void;
}) {
  const modes: { id: DisplayMode; label: string }[] = [
    { id: 'clean', label: '○ Clean' },
    { id: 'floor', label: '◑ Shadow Floor' },
    { id: 'grid',  label: '⊞ Grid' },
  ];
  return (
    <div className="space-y-3">
      <InspectorSection title="Ground">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => onDisplayMode(m.id)}
            className={`mb-1 flex w-full items-center rounded border px-2 py-1.5 text-[11px] font-medium transition-colors ${
              displayMode === m.id
                ? 'border-amber-500/60 bg-amber-500/10 text-amber-400'
                : 'border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
            }`}
          >
            {m.label}
          </button>
        ))}
      </InspectorSection>
      <InspectorSection title="Animation">
        <button
          onClick={onAutoRotate}
          className={`flex w-full items-center rounded border px-2 py-1.5 text-[11px] font-medium transition-colors ${
            autoRotate
              ? 'border-amber-500/60 bg-amber-500/10 text-amber-400'
              : 'border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
          }`}
        >
          {autoRotate ? '⏸ Auto-rotate ON' : '▶ Auto-rotate OFF'}
        </button>
      </InspectorSection>
    </div>
  );
}

// ─── Primitive UI ─────────────────────────────────────────────────────────────

function TopBarBtn({
  children,
  onClick,
  title,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
        active
          ? 'bg-amber-500/15 text-amber-400'
          : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
      }`}
    >
      {children}
    </button>
  );
}

function ToolBtn({
  children,
  onClick,
  title,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex w-10 flex-col items-center gap-0.5 rounded py-1.5 text-center transition-colors ${
        active
          ? 'bg-amber-500/15 text-amber-400'
          : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
      }`}
    >
      {children}
    </button>
  );
}

function SideSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="mb-0.5 text-[7px] font-bold tracking-widest text-zinc-600">{label}</span>
      {children}
    </div>
  );
}

function InspectorSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <p className="mb-1.5 text-[9px] font-bold uppercase tracking-widest text-zinc-500">{title}</p>
      {children}
    </div>
  );
}

function InspectorRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-zinc-500">{label}</span>
      <span className="font-mono text-zinc-300">{value}</span>
    </div>
  );
}
