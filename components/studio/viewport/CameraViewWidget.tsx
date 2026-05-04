'use client';
/**
 * studio/viewport/CameraViewWidget.tsx
 *
 * Top-right DOM overlay — Plasticity-style camera view buttons.
 * Dispatches `studio:set-camera-view` which CameraRig picks up
 * inside the Canvas and smoothly animates the camera.
 */

import React, { useState } from 'react';
import type { CameraViewName } from './CameraRig';

const VIEWS: { id: CameraViewName; label: string; shortLabel: string }[] = [
  { id: 'perspective', label: 'Perspective', shortLabel: 'Persp' },
  { id: 'top',         label: 'Top',         shortLabel: 'Top'  },
  { id: 'front',       label: 'Front',       shortLabel: 'Front'},
  { id: 'right',       label: 'Right',       shortLabel: 'Right'},
];

function setCameraView(view: CameraViewName) {
  window.dispatchEvent(
    new CustomEvent<CameraViewName>('studio:set-camera-view', { detail: view }),
  );
}

export function CameraViewWidget() {
  const [active, setActive] = useState<CameraViewName>('perspective');

  const handleClick = (view: CameraViewName) => {
    setActive(view);
    setCameraView(view);
  };

  return (
    <div
      className="pointer-events-none absolute right-3 top-3 z-20 flex flex-col items-end gap-1"
      aria-label="Camera view presets"
    >
      {/* Axis indicator — tiny RGB cube */}
      <div className="mb-1 flex gap-[3px] rounded-md bg-black/40 px-2 py-1 backdrop-blur-sm">
        <span className="text-[10px] font-bold text-red-400">X</span>
        <span className="text-[10px] font-bold text-green-400">Y</span>
        <span className="text-[10px] font-bold text-blue-400">Z</span>
      </div>

      {/* View buttons */}
      <div className="pointer-events-auto flex flex-col gap-[3px]">
        {VIEWS.map(({ id, shortLabel }) => (
          <button
            key={id}
            onClick={() => handleClick(id)}
            className={[
              'rounded px-2.5 py-0.5 text-[11px] font-medium transition-all',
              active === id
                ? 'bg-white/20 text-white shadow-inner ring-1 ring-white/30'
                : 'bg-black/40 text-white/60 hover:bg-white/10 hover:text-white/90',
              'backdrop-blur-sm',
            ].join(' ')}
            title={`Set camera to ${shortLabel} view`}
          >
            {shortLabel}
          </button>
        ))}
      </div>
    </div>
  );
}
