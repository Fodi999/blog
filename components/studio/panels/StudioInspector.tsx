'use client';
/**
 * studio/panels/StudioInspector.tsx
 *
 * Right-side inspector — shows transform, shape params and material
 * for the currently selected object.
 */

import React from 'react';
import type { SceneObject, Vec3, Euler, ShapeParams } from '../core/types';
import { radToDeg, degToRad } from '../core/transform';

// ── Numeric input row ─────────────────────────────────────────────────────────

function NumRow({
  label,
  values,
  onChange,
  step = 0.01,
}: {
  label: string;
  values: [number, number, number];
  onChange: (v: [number, number, number]) => void;
  step?: number;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="w-6 text-[10px] font-semibold uppercase text-white/30">{label}</span>
      {(['x', 'y', 'z'] as const).map((axis, i) => (
        <div key={axis} className="flex flex-1 items-center gap-0.5">
          <span className="text-[9px] text-white/20">{axis.toUpperCase()}</span>
          <input
            type="number"
            step={step}
            value={+values[i].toFixed(4)}
            onChange={(e) => {
              const next = [...values] as [number, number, number];
              next[i] = parseFloat(e.target.value) || 0;
              onChange(next);
            }}
            className="w-full rounded border border-white/8 bg-white/4 px-1 py-0.5 text-center font-mono text-[10px] text-white/80 focus:border-sky-400/50 focus:outline-none"
          />
        </div>
      ))}
    </div>
  );
}

// ── Inspector ─────────────────────────────────────────────────────────────────

export interface StudioInspectorProps {
  obj: SceneObject | undefined;
  onPatchTransform: (patch: Partial<SceneObject['transform']>) => void;
  onPatchMaterial: (patch: Partial<SceneObject['material']>) => void;
  onPatchShape: (patch: Partial<ShapeParams>) => void;
}

export function StudioInspector({
  obj,
  onPatchTransform,
  onPatchMaterial,
  onPatchShape,
}: StudioInspectorProps) {
  if (!obj) {
    return (
      <div className="flex h-full items-center justify-center border-l border-white/6 bg-[#090909]">
        <p className="text-[11px] text-white/20">No selection</p>
      </div>
    );
  }

  const rotDeg = obj.transform.rotation.map(radToDeg) as [number, number, number];

  return (
    <div className="flex h-full flex-col gap-0 overflow-y-auto border-l border-white/6 bg-[#090909] text-white">
      {/* Header */}
      <div className="border-b border-white/6 px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">
        Inspector
      </div>

      {/* Object name */}
      <div className="border-b border-white/6 px-3 py-2">
        <p className="mb-0.5 text-[9px] uppercase tracking-wider text-white/25">Name</p>
        <p className="text-[12px] font-medium text-white/80">{obj.label}</p>
        <p className="text-[9px] text-white/20">{obj.kind} · {obj.id.slice(-6)}</p>
      </div>

      {/* Transform */}
      <Section title="Transform">
        <NumRow
          label="P"
          values={obj.transform.position as [number, number, number]}
          onChange={(v) => onPatchTransform({ position: v })}
        />
        <NumRow
          label="R"
          values={rotDeg}
          step={1}
          onChange={(v) => onPatchTransform({ rotation: v.map(degToRad) as Euler })}
        />
        <NumRow
          label="S"
          values={obj.transform.scale as [number, number, number]}
          onChange={(v) => onPatchTransform({ scale: v })}
        />
      </Section>

      {/* Material */}
      <Section title="Material">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/40">Color</span>
          <input
            type="color"
            value={obj.material.color_hex}
            onChange={(e) => onPatchMaterial({ color_hex: e.target.value })}
            className="h-6 w-12 cursor-pointer rounded border border-white/10 bg-transparent"
          />
          <span className="font-mono text-[10px] text-white/40">{obj.material.color_hex}</span>
        </div>
      </Section>

      {/* Shape params */}
      <Section title="Shape">
        <ShapeParamsEditor shape={obj.shape} onPatch={onPatchShape} />
      </Section>
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-white/6 px-3 py-2">
      <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-white/25">{title}</p>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

// ── Shape params editor ───────────────────────────────────────────────────────

function ShapeParamsEditor({
  shape,
  onPatch,
}: {
  shape: ShapeParams;
  onPatch: (p: Partial<ShapeParams>) => void;
}) {
  switch (shape.kind) {
    case 'cube':
      return (
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/40">Subdivisions</span>
          <input
            type="range" min={1} max={5} step={1}
            value={shape.subdivisions}
            onChange={(e) => onPatch({ subdivisions: +e.target.value })}
            className="flex-1"
          />
          <span className="font-mono text-[10px] text-white/60">{shape.subdivisions}</span>
        </div>
      );
    case 'cylinder':
    case 'cone':
      return (
        <>
          <SliderRow label="Radius" value={shape.radius} min={0.05} max={3} step={0.025} onChange={(v) => onPatch({ radius: v } as Partial<ShapeParams>)} />
          <SliderRow label="Height" value={shape.height} min={0.1} max={5} step={0.05} onChange={(v) => onPatch({ height: v } as Partial<ShapeParams>)} />
        </>
      );
    case 'torus':
      return (
        <>
          <SliderRow label="Major R" value={shape.major_radius} min={0.1} max={3} step={0.025} onChange={(v) => onPatch({ major_radius: v } as Partial<ShapeParams>)} />
          <SliderRow label="Minor R" value={shape.minor_radius} min={0.02} max={1} step={0.01} onChange={(v) => onPatch({ minor_radius: v } as Partial<ShapeParams>)} />
        </>
      );
    default:
      return <p className="text-[10px] text-white/20">No params</p>;
  }
}

function SliderRow({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 text-[10px] text-white/40">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="flex-1" />
      <span className="w-10 text-right font-mono text-[10px] text-white/60">{value.toFixed(2)}</span>
    </div>
  );
}
