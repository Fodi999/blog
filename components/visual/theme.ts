/**
 * Theme → color mapping. Single source of truth for the renderer.
 * Backend can override per-entity via `material.color`, but the theme
 * should always have a sensible default.
 */

import type { MaterialTheme } from './sceneTypes';

export const THEME_COLOR: Record<MaterialTheme, string> = {
  // status
  ok:       '#22c55e',
  warning:  '#eab308',
  critical: '#f97316',
  expired:  '#ef4444',
  risk:     '#ef4444',
  // zones
  cold:    '#3b82f6',
  dry:     '#f59e0b',
  freezer: '#38bdf8',
  // visual upgrades
  premium:   '#a78bfa',
  highlight: '#facc15',
  disabled:  '#6b7280',
  new:       '#34d399',
  // misc
  neutral: '#9ca3af',
};

export function themeColor(theme: MaterialTheme, overrideColor?: string): string {
  return overrideColor ?? THEME_COLOR[theme] ?? '#ffffff';
}
