'use client';

/**
 * LaboratoryStudioViewer — fullscreen 3D Product Studio (PR #19 revised).
 *
 * Covers the site header (z-[60] > glass-nav z-50).
 * Layout: TopBar / [LeftToolbar | Canvas | RightInspector] / BottomBar
 */

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { resolveAssetUrl, generateLaboratoryModel, tuneSurface, type GeometryQuality, type Laboratory3DAsset, type SurfaceTuneInfo } from '@/lib/laboratory-api';
import type {
  CameraPresetKey,
  DisplayMode,
  LightingPreset,
  ModelViewerApi,
  RenderQuality,
  StudioEnvPreset,
  StudioLightSettings,
} from './ModelViewer';
import { LIGHT_PRESETS, RENDER_QUALITY_CONFIG, lightSettingsFromPreset } from './ModelViewer';

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
  // Live asset — replaced after a successful regenerate so the viewer can
  // swap to the freshly-baked GLB without reloading the page.
  const [currentAsset, setCurrentAsset] = useState<Laboratory3DAsset>(asset);

  const modelUrl = useMemo(
    () => (currentAsset.model_url ? resolveAssetUrl(currentAsset.model_url) : null),
    [currentAsset.model_url],
  );

  const [autoRotate, setAutoRotate]       = useState(true);
  const [displayMode, setDisplayMode]     = useState<DisplayMode>('floor');
  const [renderQuality, setRenderQuality] = useState<RenderQuality>('hd');

  // Geometry quality (PR #24). `generatedQuality` is what the live GLB was
  // baked at; `pendingQuality` is the user's current pick. When they differ,
  // the inspector shows a "Regenerate GLB" CTA — we never auto-regenerate
  // on click because regeneration is slow/expensive.
  const [generatedQuality, setGeneratedQuality] = useState<GeometryQuality>('high');
  const [pendingQuality, setPendingQuality]     = useState<GeometryQuality>('high');
  const [regenerating, setRegenerating]         = useState(false);

  const [lightSettings, setLightSettings] = useState<StudioLightSettings>(
    () => lightSettingsFromPreset('softFood'),
  );
  const [activePreset, setActivePreset]   = useState<CameraPresetKey>('default');
  const [zoom, setZoom]                   = useState(0.55);
  const [tab, setTab] = useState<'object' | 'surface' | 'camera' | 'light' | 'display'>('object');
  const [api, setApi] = useState<ModelViewerApi | null>(null);

  // PR #31 — Smoothness Slider state
  const [smoothness, setSmoothness]   = useState(0.55);
  const [tuning, setTuning]           = useState(false);
  const [tuneInfo, setTuneInfo]       = useState<SurfaceTuneInfo | null>(null);
  const tuneTimerRef                  = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Use refs so the debounce closure always sees fresh values without
  // recreating the callback (avoids the stale-closure / tuning-stuck bug).
  const tuningRef    = useRef(false);
  const assetIdRef   = useRef(currentAsset.id);
  const smoothnessRef = useRef(smoothness);
  const apiRef        = useRef<ModelViewerApi | null>(null);
  // Keep refs in sync
  assetIdRef.current   = currentAsset.id;
  smoothnessRef.current = smoothness;

  // Patch a single field in lightSettings
  const patchLight = useCallback(
    <K extends keyof StudioLightSettings>(key: K, value: StudioLightSettings[K]) => {
      setLightSettings((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  // Apply a full preset reset
  const applyLightPreset = useCallback((preset: LightingPreset) => {
    setLightSettings(lightSettingsFromPreset(preset));
  }, []);

  // PR #31 — Smoothness debounce → draft preview
  // Fixed bugs vs original:
  //   ① Use refs for tuning/assetId so closure never goes stale
  //   ② Never early-return inside the timer — always set tuning=false in finally
  //   ③ deps array is stable (only the setter functions, which never change)
  const onSmoothnessChange = useCallback((val: number) => {
    setSmoothness(val);
    smoothnessRef.current = val;
    // ── Instant real-time feedback ─────────────────────────────────────────
    // 1. Geometry: Laplacian smooth vertices (val=0 bumpy, val=1 smooth)
    apiRef.current?.setFoodSmooth(val);
    // 2. Material: roughness also tracks smoothness (smooth = low roughness)
    const roughness = 0.85 - val * 0.80;
    apiRef.current?.setFoodRoughness(roughness);
    // ── Debounced full geometry rebake (backend) ───────────────────────────
    if (tuneTimerRef.current) clearTimeout(tuneTimerRef.current);
    tuneTimerRef.current = setTimeout(async () => {
      if (tuningRef.current) return; // skip if a request is already in flight
      tuningRef.current = true;
      setTuning(true);
      try {
        const res = await tuneSurface(assetIdRef.current, smoothnessRef.current, 'draft');
        setCurrentAsset(res.asset);
        setTuneInfo(res.surface_info);
      } catch {
        // silent — stale GLB stays in view
      } finally {
        tuningRef.current = false;
        setTuning(false);
      }
    }, 320);
  }, []); // stable — reads live values from refs

  const onSmoothnessApply = useCallback(async (quality: GeometryQuality = 'high') => {
    if (tuningRef.current) return;
    tuningRef.current = true;
    setTuning(true);
    try {
      const res = await tuneSurface(assetIdRef.current, smoothnessRef.current, quality);
      setCurrentAsset(res.asset);
      setTuneInfo(res.surface_info);
      toast.success(`Baked at ${quality.toUpperCase()} ✦`);
    } catch {
      toast.error('Failed to apply surface');
    } finally {
      tuningRef.current = false;
      setTuning(false);
    }
  }, []); // stable

  const handleApiReady = useCallback((readyApi: ModelViewerApi) => {
    setApi(readyApi);
    apiRef.current = readyApi;
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

  /**
   * Regenerate the GLB at `pendingQuality`. Hits the same Vision pipeline
   * as the original generate, just with a stricter (or coarser) tessellation.
   * The whole call is sync end-to-end, so we just `await` and swap the
   * asset on success.
   */
  const onRegenerate = useCallback(async () => {
    if (regenerating) return;
    if (!currentAsset.image_id) {
      toast.error('Cannot regenerate: source image is missing');
      return;
    }
    setRegenerating(true);
    const t = toast.loading(`Regenerating GLB at ${pendingQuality.toUpperCase()}…`);
    try {
      const next = await generateLaboratoryModel(currentAsset.image_id, pendingQuality);
      if (next.status !== 'ready' || !next.model_url) {
        throw new Error(next.error_message ?? `Pipeline returned status=${next.status}`);
      }
      setCurrentAsset(next);
      setGeneratedQuality(pendingQuality);
      toast.success(`GLB rebuilt at ${pendingQuality.toUpperCase()}`, { id: t });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Regenerate failed';
      toast.error(msg, { id: t });
    } finally {
      setRegenerating(false);
    }
  }, [currentAsset.image_id, pendingQuality, regenerating]);

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

  // PR #32 — track if the GLB returned 404 (Koyeb ephemeral FS wipe on redeploy).
  // When true we show a "Model lost — Regenerate" overlay instead of crashing.
  const [modelLost, setModelLost] = useState(false);

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

      {/* ── PR #32 Model-lost overlay (Koyeb ephemeral FS wipe) ──────────── */}
      {modelLost && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-950/95 backdrop-blur-sm">
          <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-6 text-center shadow-2xl max-w-xs">
            <div className="mb-2 text-2xl">⚠️</div>
            <p className="font-semibold text-zinc-100">Model file not found</p>
            <p className="mt-1 text-sm text-zinc-400">
              The 3D file was lost after a server redeploy. Regenerate to rebuild it.
            </p>
            <button
              onClick={() => { setModelLost(false); onRegenerate(); }}
              className="mt-4 w-full rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-400 transition-colors"
            >
              ✦ Regenerate model
            </button>
          </div>
        </div>
      )}

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
            displayMode={displayMode}
            renderQuality={renderQuality}
            lightSettings={lightSettings}
            onReady={handleApiReady}
            onModelError={() => setModelLost(true)}
            className="h-full w-full"
          />
          <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-[10px] text-zinc-400 backdrop-blur-sm select-none whitespace-nowrap">
            Drag to orbit · Scroll to zoom · Right-drag to pan
          </div>

          {/* ── PR #31 Smoothness Island ──────────────────────────── */}
          <SmoothnessIsland
            smoothness={smoothness}
            tuneInfo={tuneInfo}
            tuning={tuning}
            onChange={onSmoothnessChange}
            onApply={onSmoothnessApply}
          />
        </main>

        {/* Right Inspector */}
        <aside className="flex flex-col border-l border-zinc-800 bg-zinc-900/60">
          <div className="flex shrink-0 border-b border-zinc-800">
            {(['object', 'surface', 'camera', 'light', 'display'] as const).map((t) => (
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
            {tab === 'object'  && <ObjectTab asset={currentAsset} />}
            {tab === 'surface' && (
              <SurfaceTab
                smoothness={smoothness}
                tuneInfo={tuneInfo}
                tuning={tuning}
                onSmoothness={onSmoothnessChange}
                onApply={onSmoothnessApply}
              />
            )}
            {tab === 'camera'  && <CameraTab activePreset={activePreset} onPreset={applyPreset} onReset={onReset} />}
            {tab === 'light'   && (
              <LightingTab
                lightSettings={lightSettings}
                onPatch={patchLight}
                onApplyPreset={applyLightPreset}
              />
            )}
            {tab === 'display' && (
              <DisplayTab
                displayMode={displayMode}
                onDisplayMode={setDisplayMode}
                autoRotate={autoRotate}
                onAutoRotate={() => setAutoRotate((v) => !v)}
                renderQuality={renderQuality}
                onRenderQuality={setRenderQuality}
                generatedQuality={generatedQuality}
                pendingQuality={pendingQuality}
                onPendingQuality={setPendingQuality}
                regenerating={regenerating}
                onRegenerate={onRegenerate}
              />
            )}
          </div>
        </aside>
      </div>

      {/* ── Bottom status bar ───────────────────────────────────────── */}
      <footer className="flex h-7 shrink-0 items-center justify-between border-t border-zinc-800 bg-zinc-900/60 px-4">
        <span className="text-[10px] text-zinc-600">
          {currentAsset.model_format?.toUpperCase() ?? 'GLB'} · {currentAsset.id.slice(0, 8)}
        </span>
        <span className="text-[10px] text-zinc-600">
          {lightSettings.preset} · {displayMode} · render {RENDER_QUALITY_CONFIG[renderQuality].label} · model {generatedQuality.toUpperCase()}
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

// ── PR #31 — Surface Tuning Tab ───────────────────────────────────────────────

function SurfaceTab({
  smoothness,
  tuneInfo,
  tuning,
  onSmoothness,
  onApply,
}: {
  smoothness: number;
  tuneInfo: SurfaceTuneInfo | null;
  tuning: boolean;
  onSmoothness: (v: number) => void;
  onApply: (q: GeometryQuality) => void;
}) {
  const pct = Math.round(smoothness * 100);

  return (
    <div className="space-y-4">
      <InspectorSection title="Surface">
        {/* Main smoothness slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Smoothness</span>
            <span className="font-mono text-amber-400">{pct}</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={pct}
            disabled={tuning}
            onChange={(e) => onSmoothness(Number(e.target.value) / 100)}
            className="w-full cursor-pointer accent-amber-400 disabled:opacity-50"
          />
          <div className="flex justify-between text-[9px] text-zinc-600">
            <span>Textured</span>
            <span>Smooth</span>
          </div>
        </div>

        {/* Derived values — shown after first tune */}
        {tuneInfo && (
          <div className="mt-3 rounded border border-zinc-800 bg-zinc-950/60 p-2 space-y-1">
            <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-widest text-zinc-600">Derived</p>
            {(
              [
                ['Ridge',        tuneInfo.ridge_height],
                ['Groove',       tuneInfo.groove_depth],
                ['Peak',         tuneInfo.center_peak],
                ['Irregularity', tuneInfo.surface_irregularity],
                ['Highlight',    tuneInfo.highlight_strength],
              ] as [string, number][]
            ).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2">
                <span className="w-20 shrink-0 text-zinc-500">{k}</span>
                <div className="flex-1 h-1 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-500/70 transition-all"
                    style={{ width: `${Math.round(v * 100)}%` }}
                  />
                </div>
                <span className="w-7 text-right font-mono text-[10px] text-zinc-400">
                  {v.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}

        {tuning && (
          <p className="text-center text-[10px] text-amber-400 animate-pulse">Rebuilding…</p>
        )}
      </InspectorSection>

      {/* Bake buttons */}
      <InspectorSection title="Bake">
        <div className="space-y-1.5">
          <button
            onClick={() => onApply('draft')}
            disabled={tuning}
            className="w-full rounded border border-zinc-700 py-1.5 text-[11px] font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white disabled:opacity-40"
          >
            Preview (Draft)
          </button>
          <button
            onClick={() => onApply('high')}
            disabled={tuning}
            className="w-full rounded border border-amber-500/50 bg-amber-500/10 py-1.5 text-[11px] font-medium text-amber-300 transition-colors hover:bg-amber-500/20 disabled:opacity-40"
          >
            Apply High ✦
          </button>
          <button
            onClick={() => onApply('ultra')}
            disabled={tuning}
            className="w-full rounded border border-zinc-700 py-1.5 text-[11px] font-medium text-zinc-500 transition-colors hover:border-zinc-500 hover:text-zinc-300 disabled:opacity-40"
          >
            Bake Ultra
          </button>
        </div>
      </InspectorSection>
    </div>
  );
}

// ── PR #31 — Floating Smoothness Island: defined further below ───────────────

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

function LightingTab({
  lightSettings: ls,
  onPatch,
  onApplyPreset,
}: {
  lightSettings: StudioLightSettings;
  onPatch: <K extends keyof StudioLightSettings>(key: K, value: StudioLightSettings[K]) => void;
  onApplyPreset: (preset: LightingPreset) => void;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const PRESETS: { id: LightingPreset; label: string; desc: string }[] = [
    { id: 'softFood',     label: '🍜 Soft Food',    desc: 'Bowls · sauce · plates' },
    { id: 'cleanProduct', label: '🫙 Clean Product', desc: 'Jars · bottles · cards' },
    { id: 'darkPremium',  label: '🖤 Dark Premium',  desc: 'Dramatic presentation' },
  ];

  return (
    <div className="space-y-4">
      {/* ── Presets ── */}
      <InspectorSection title="Preset">
        <div className="flex flex-col gap-1.5">
          {PRESETS.map((o) => (
            <button
              key={o.id}
              onClick={() => onApplyPreset(o.id)}
              className={`flex flex-col items-start rounded border px-2 py-2 text-left transition-colors ${
                ls.preset === o.id
                  ? 'border-amber-500/60 bg-amber-500/10 text-amber-400'
                  : 'border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
              }`}
            >
              <span className="text-[11px] font-medium">{o.label}</span>
              <span className="text-[9px] text-zinc-500">{o.desc}</span>
            </button>
          ))}
        </div>
      </InspectorSection>

      {/* ── Exposure ── */}
      <InspectorSection title="Exposure">
        <SliderRow
          label="Exposure"
          value={ls.exposure}
          min={0.4} max={1.6} step={0.01}
          display={(v) => v.toFixed(2)}
          onChange={(v) => onPatch('exposure', v)}
        />
      </InspectorSection>

      {/* ── Environment ── */}
      <InspectorSection title="Environment">
        <SliderRow
          label="Intensity"
          value={ls.envIntensity}
          min={0} max={2} step={0.05}
          display={(v) => v.toFixed(2)}
          onChange={(v) => onPatch('envIntensity', v)}
        />
        <div className="mt-2 grid grid-cols-3 gap-1">
          {ENV_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => onPatch('preset', ls.preset)} // env is from lightSettings.preset's env — use HDRI override via patch trick
              className="rounded border border-zinc-700 px-1 py-1 text-[9px] text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors"
              title={p.id}
            >
              {p.label}
            </button>
          ))}
        </div>
      </InspectorSection>

      {/* ── Lights ── */}
      <InspectorSection title="Lights">
        <SliderRow
          label="Key"
          value={ls.keyIntensity}
          min={0} max={2} step={0.05}
          display={(v) => v.toFixed(2)}
          onChange={(v) => onPatch('keyIntensity', v)}
        />
        <SliderRow
          label="Fill"
          value={ls.fillIntensity}
          min={0} max={1} step={0.02}
          display={(v) => v.toFixed(2)}
          onChange={(v) => onPatch('fillIntensity', v)}
        />
        <SliderRow
          label="Rim"
          value={ls.rimIntensity}
          min={0} max={1.5} step={0.05}
          display={(v) => v.toFixed(2)}
          onChange={(v) => onPatch('rimIntensity', v)}
        />
      </InspectorSection>

      {/* ── Shadows ── */}
      <InspectorSection title="Shadows">
        <SliderRow
          label="Strength"
          value={ls.shadowOpacity}
          min={0} max={1} step={0.05}
          display={(v) => v.toFixed(2)}
          onChange={(v) => onPatch('shadowOpacity', v)}
        />
        <SliderRow
          label="Softness"
          value={ls.shadowBlur}
          min={0.5} max={8} step={0.1}
          display={(v) => v.toFixed(1)}
          onChange={(v) => onPatch('shadowBlur', v)}
        />
        <SliderRow
          label="Size"
          value={ls.shadowScale}
          min={1} max={12} step={0.5}
          display={(v) => v.toFixed(1)}
          onChange={(v) => onPatch('shadowScale', v)}
        />
      </InspectorSection>

      {/* ── Advanced (collapsible) ── */}
      <button
        onClick={() => setShowAdvanced((v) => !v)}
        className="flex w-full items-center justify-between rounded border border-zinc-700 px-2 py-1.5 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <span>Advanced</span>
        <span>{showAdvanced ? '▲' : '▼'}</span>
      </button>

      {showAdvanced && (
        <div className="space-y-3">
          <InspectorSection title="Key Position">
            <XYZSliders
              value={ls.keyPosition}
              onChange={(v) => onPatch('keyPosition', v)}
            />
          </InspectorSection>
          <InspectorSection title="Fill Position">
            <XYZSliders
              value={ls.fillPosition}
              onChange={(v) => onPatch('fillPosition', v)}
            />
          </InspectorSection>
          <InspectorSection title="Rim Position">
            <XYZSliders
              value={ls.rimPosition}
              onChange={(v) => onPatch('rimPosition', v)}
            />
          </InspectorSection>
        </div>
      )}
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <span className="w-10 shrink-0 text-[10px] text-zinc-500">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-zinc-700 accent-amber-400"
      />
      <span className="w-8 text-right font-mono text-[10px] text-zinc-300">
        {display(value)}
      </span>
    </div>
  );
}

function XYZSliders({
  value,
  onChange,
}: {
  value: [number, number, number];
  onChange: (v: [number, number, number]) => void;
}) {
  const labels = ['X', 'Y', 'Z'] as const;
  return (
    <>
      {labels.map((ax, i) => (
        <SliderRow
          key={ax}
          label={ax}
          value={value[i]}
          min={-6} max={6} step={0.1}
          display={(v) => v.toFixed(1)}
          onChange={(v) => {
            const next: [number, number, number] = [...value] as [number, number, number];
            next[i] = v;
            onChange(next);
          }}
        />
      ))}
    </>
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
  renderQuality,
  onRenderQuality,
  generatedQuality,
  pendingQuality,
  onPendingQuality,
  regenerating,
  onRegenerate,
}: {
  displayMode: DisplayMode;
  onDisplayMode: (v: DisplayMode) => void;
  autoRotate: boolean;
  onAutoRotate: () => void;
  renderQuality: RenderQuality;
  onRenderQuality: (v: RenderQuality) => void;
  generatedQuality: GeometryQuality;
  pendingQuality: GeometryQuality;
  onPendingQuality: (v: GeometryQuality) => void;
  regenerating: boolean;
  onRegenerate: () => void;
}) {
  const modes: { id: DisplayMode; label: string }[] = [
    { id: 'clean', label: '○ Clean' },
    { id: 'floor', label: '◑ Shadow Floor' },
    { id: 'grid',  label: '⊞ Grid' },
  ];
  const qualities = (Object.keys(RENDER_QUALITY_CONFIG) as RenderQuality[]).map((id) => ({
    id,
    label: RENDER_QUALITY_CONFIG[id].label,
  }));
  const modelQualities: { id: GeometryQuality; label: string; desc: string; segs: string }[] = [
    { id: 'draft',    label: 'Draft',    desc: 'fast preview',   segs: '32 / 8'   },
    { id: 'standard', label: 'Standard', desc: 'balanced',       segs: '48 / 14'  },
    { id: 'high',     label: 'High',     desc: 'studio default', segs: '96 / 24'  },
    { id: 'ultra',    label: 'Ultra',    desc: 'smoothest GLB',  segs: '128 / 32' },
  ];
  const dirty = pendingQuality !== generatedQuality;

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

      <InspectorSection title="Render Quality">
        <p className="mb-1.5 text-[9px] text-zinc-500 leading-snug">
          Pixels · DPR · shadows · AA. <span className="text-emerald-400/90">Changes instantly.</span>
        </p>
        <div className="grid grid-cols-4 gap-1">
          {qualities.map((q) => (
            <button
              key={q.id}
              onClick={() => onRenderQuality(q.id)}
              title={q.id === '4k' ? '⚠ Heavy on GPU' : undefined}
              className={`rounded border py-1.5 text-[10px] font-semibold transition-colors ${
                renderQuality === q.id
                  ? 'border-amber-500/60 bg-amber-500/10 text-amber-400'
                  : 'border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
              }`}
            >
              {q.label}
            </button>
          ))}
        </div>
        {renderQuality === '4k' && (
          <p className="mt-1.5 text-[9px] text-amber-500/80">
            ⚠ 4K is GPU-heavy. Best for screenshots, not live orbit.
          </p>
        )}
        <div className="mt-1.5 space-y-0.5">
          <InspectorRow label="DPR" value={RENDER_QUALITY_CONFIG[renderQuality].dpr.join('–')} />
          <InspectorRow label="Shadow res" value={`${RENDER_QUALITY_CONFIG[renderQuality].shadowResolution}px`} />
          <InspectorRow label="Anisotropy" value={`${RENDER_QUALITY_CONFIG[renderQuality].textureAnisotropy}x`} />
        </div>
      </InspectorSection>

      <InspectorSection title="Model Quality">
        <p className="mb-1.5 text-[9px] text-zinc-500 leading-snug">
          Polygons · circle smoothness · GLB topology.{' '}
          <span className="text-amber-400/90">Requires regeneration.</span>
        </p>
        <div className="flex flex-col gap-1">
          {modelQualities.map((q) => {
            const isPending  = pendingQuality === q.id;
            const isCurrent  = generatedQuality === q.id;
            return (
              <button
                key={q.id}
                onClick={() => onPendingQuality(q.id)}
                disabled={regenerating}
                className={`flex items-center justify-between rounded border px-2 py-1.5 text-left text-[11px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isPending
                    ? 'border-amber-500/60 bg-amber-500/10 text-amber-400'
                    : 'border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                }`}
              >
                <span className="flex flex-col">
                  <span>
                    {q.label}
                    {isCurrent && (
                      <span className="ml-1 text-[8px] uppercase tracking-wider text-emerald-400/80">
                        · live
                      </span>
                    )}
                  </span>
                  <span className="text-[9px] text-zinc-500">{q.desc}</span>
                </span>
                <span className="font-mono text-[9px] text-zinc-500">{q.segs}</span>
              </button>
            );
          })}
        </div>
        {dirty ? (
          <button
            onClick={onRegenerate}
            disabled={regenerating}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded border border-amber-500/60 bg-amber-500/10 py-1.5 text-[11px] font-semibold text-amber-300 hover:bg-amber-500/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {regenerating ? (
              <>
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Regenerating…
              </>
            ) : (
              <>↻ Regenerate GLB at {pendingQuality.toUpperCase()}</>
            )}
          </button>
        ) : (
          <p className="mt-2 text-[9px] text-zinc-500 leading-snug">
            Live model is at <span className="text-emerald-400/90">{generatedQuality.toUpperCase()}</span>.
            Pick another preset above to enable Regenerate.
          </p>
        )}
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

// ── PR #31 — Smoothness Island (floating bottom-centre of canvas) ─────────────
//
// Architecture note — why is this a server round-trip and not instant like ZBrush?
//
//   ZBrush: deforms vertices already in GPU memory (microseconds)
//   ChefOS: smoothness → POST /tune-surface → Rust regenerates full GLB
//           → stored to disk → new URL → ModelViewer reloads GLB
//
// This is intentional: the mesh is procedural (parametric geometry kernel),
// not a sculpt. The tradeoff is perfect PBR materials + physics-accurate
// fill volume at the cost of ~0.5–2 s per regeneration.
// Draft quality makes each rebuild ~3–5× faster than High.

function SmoothnessIsland({
  smoothness,
  tuneInfo,
  tuning,
  onChange,
  onApply,
}: {
  smoothness: number;
  tuneInfo: SurfaceTuneInfo | null;
  tuning: boolean;
  onChange: (v: number) => void;
  onApply: (q: GeometryQuality) => void;
}) {
  const pct = Math.round(smoothness * 100);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="pointer-events-auto absolute bottom-10 left-1/2 -translate-x-1/2 z-20 select-none">
      {/* Main island pill */}
      <div className="flex items-center gap-3 rounded-2xl border border-zinc-700/80 bg-zinc-900/90 px-4 py-2.5 shadow-2xl backdrop-blur-md">

        {/* Label */}
        <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 whitespace-nowrap">
          Smoothness
        </span>

        {/* Slider */}
        <div className="relative flex items-center gap-2">
          <span className="text-[9px] text-zinc-600">Rough</span>
          <input
            type="range"
            min={0}
            max={100}
            value={pct}
            disabled={tuning}
            onChange={(e) => onChange(Number(e.target.value) / 100)}
            className="w-36 cursor-pointer accent-amber-400 disabled:opacity-50"
          />
          <span className="text-[9px] text-zinc-600">Smooth</span>
        </div>

        {/* Live value */}
        <span className={`w-7 text-right font-mono text-[12px] font-bold transition-colors ${tuning ? 'text-amber-400 animate-pulse' : 'text-white'}`}>
          {pct}
        </span>

        {/* Apply High button */}
        <button
          onClick={() => onApply('high')}
          disabled={tuning}
          className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-[10px] font-semibold text-amber-300 transition-all hover:bg-amber-500/20 disabled:opacity-40 whitespace-nowrap"
        >
          {tuning ? 'Building…' : 'Apply ✦'}
        </button>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-zinc-600 hover:text-zinc-300 transition-colors text-[14px] leading-none"
          title="Show derived values"
        >
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {/* Expanded derived-values panel */}
      {expanded && tuneInfo && (
        <div className="mt-1.5 rounded-xl border border-zinc-700/80 bg-zinc-900/90 px-4 py-3 shadow-2xl backdrop-blur-md">
          <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-zinc-600">
            Surface Parameters
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
            {(
              [
                ['Ridge height',    tuneInfo.ridge_height],
                ['Groove depth',    tuneInfo.groove_depth],
                ['Center peak',     tuneInfo.center_peak],
                ['Irregularity',    tuneInfo.surface_irregularity],
                ['Highlight',       tuneInfo.highlight_strength],
              ] as [string, number][]
            ).map(([label, val]) => (
              <div key={label} className="flex items-center gap-2">
                <span className="w-24 shrink-0 text-[10px] text-zinc-500">{label}</span>
                <div className="h-1 w-20 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-amber-500/70 transition-all duration-300"
                    style={{ width: `${Math.round(val * 100)}%` }}
                  />
                </div>
                <span className="w-8 text-right font-mono text-[10px] text-zinc-400">
                  {val.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2.5 flex gap-1.5">
            {(['draft', 'standard', 'high', 'ultra'] as GeometryQuality[]).map((q) => (
              <button
                key={q}
                onClick={() => onApply(q)}
                disabled={tuning}
                className="flex-1 rounded border border-zinc-700 py-1 text-[9px] font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white disabled:opacity-40"
              >
                {q.charAt(0).toUpperCase() + q.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
