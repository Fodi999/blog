/**
 * studio/core/units.ts
 *
 * Unit system for the Studio.
 * Internal unit is always metres. Display unit is configurable.
 */

export type UnitSystem = 'm' | 'cm' | 'mm' | 'in' | 'ft';

const TO_METERS: Record<UnitSystem, number> = {
  m:  1,
  cm: 0.01,
  mm: 0.001,
  in: 0.0254,
  ft: 0.3048,
};

const FROM_METERS: Record<UnitSystem, number> = {
  m:  1,
  cm: 100,
  mm: 1000,
  in: 39.3701,
  ft: 3.28084,
};

export function toMeters(value: number, from: UnitSystem): number {
  return value * TO_METERS[from];
}

export function fromMeters(value: number, to: UnitSystem): number {
  return value * FROM_METERS[to];
}

export function convert(value: number, from: UnitSystem, to: UnitSystem): number {
  return fromMeters(toMeters(value, from), to);
}

export function formatUnit(value: number, unit: UnitSystem, decimals = 2): string {
  return `${fromMeters(value, unit).toFixed(decimals)} ${unit}`;
}

/** Pretty-print a distance for the measure tool overlay */
export function formatDistance(meters: number, unit: UnitSystem): string {
  const v = fromMeters(meters, unit);
  if (v < 0.01) return `< 0.01 ${unit}`;
  return `${v.toFixed(2)} ${unit}`;
}

export const UNIT_LABELS: Record<UnitSystem, string> = {
  m:  'Metres',
  cm: 'Centimetres',
  mm: 'Millimetres',
  in: 'Inches',
  ft: 'Feet',
};
