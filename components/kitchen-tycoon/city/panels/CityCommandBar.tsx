'use client';

import { useKitchen } from '../../engine/StoreProvider';
import type { CityToolMode } from '../../engine/game-store';

const TOOLS: [CityToolMode, string, string][] = [
  ['select',  'Select',  'V'],
  ['build',   'Build',   'B'],
  ['move',    'Move',    'M'],
  ['rotate',  'Rotate',  'R'],
  ['demolish','Demolish','X'],
];

export function CityCommandBar() {
  const toolMode   = useKitchen((s) => s.cityUi.toolMode);
  const showGrid   = useKitchen((s) => s.cityUi.showGrid);
  const showOverlay = useKitchen((s) => s.cityUi.showDistrictOverlay);
  const setCityTool = useKitchen((s) => s.setCityTool);
  const rotLeft    = useKitchen((s) => s.rotateCameraLeft);
  const rotRight   = useKitchen((s) => s.rotateCameraRight);
  const zoomIn     = useKitchen((s) => s.zoomIn);
  const zoomOut    = useKitchen((s) => s.zoomOut);
  const toggleGrid = useKitchen((s) => s.toggleGrid);
  const toggleOverlay = useKitchen((s) => s.toggleDistrictOverlay);

  return (
    <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1.5 rounded-2xl border border-white/10 bg-black/85 p-2 shadow-2xl backdrop-blur">
      {/* Tool buttons */}
      {TOOLS.map(([mode, label, hotkey]) => (
        <button
          key={mode}
          onClick={() => setCityTool(mode)}
          title={`${label} (${hotkey})`}
          className={[
            'rounded-xl px-3 py-2 text-[11px] font-semibold transition-all',
            toolMode === mode
              ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/25'
              : mode === 'demolish'
                ? 'bg-white/5 text-red-400/70 hover:bg-red-400/10 hover:text-red-400'
                : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80',
          ].join(' ')}
        >
          {label}
          <span className="ml-1.5 text-[9px] opacity-50">{hotkey}</span>
        </button>
      ))}

      <div className="mx-1 h-5 w-px bg-white/10" />

      {/* Zoom */}
      <CmdBtn onClick={zoomIn} title="Zoom In (+)">+</CmdBtn>
      <CmdBtn onClick={zoomOut} title="Zoom Out (-)">−</CmdBtn>

      <div className="mx-1 h-5 w-px bg-white/10" />

      {/* Camera rotate */}
      <CmdBtn onClick={rotLeft} title="Rotate Left (Q)">↺</CmdBtn>
      <CmdBtn onClick={rotRight} title="Rotate Right (E)">↻</CmdBtn>

      <div className="mx-1 h-5 w-px bg-white/10" />

      {/* Toggles */}
      <button
        onClick={toggleGrid}
        title="Toggle Grid"
        className={[
          'rounded-xl px-3 py-2 text-[11px] font-semibold transition-all',
          showGrid ? 'bg-white/10 text-white/80' : 'bg-white/5 text-white/25',
        ].join(' ')}
      >
        Grid
      </button>
      <button
        onClick={toggleOverlay}
        title="Toggle District Labels"
        className={[
          'rounded-xl px-3 py-2 text-[11px] font-semibold transition-all',
          showOverlay ? 'bg-white/10 text-white/80' : 'bg-white/5 text-white/25',
        ].join(' ')}
      >
        Labels
      </button>
    </div>
  );
}

function CmdBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-sm text-white/50 transition-colors hover:bg-white/10 hover:text-white/80"
    >
      {children}
    </button>
  );
}
