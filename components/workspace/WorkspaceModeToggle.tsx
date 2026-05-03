'use client';

/**
 * WorkspaceModeToggle — three-way switch between the classic data view,
 * the new spatial Visual Workspace and a future Simulation mode.
 *
 * Lives at the top-right of every page that supports a visual scene.
 * Stays minimal: a segmented control with icons + labels, persists the
 * choice into localStorage so it survives page reloads.
 */
import { LayoutGrid, Boxes, FlaskConical } from 'lucide-react';

import { cn } from '@/lib/utils';

export type WorkspaceView = 'data' | 'visual' | 'simulation';

const ITEMS: { id: WorkspaceView; label: string; icon: typeof LayoutGrid }[] = [
  { id: 'data', label: 'Data', icon: LayoutGrid },
  { id: 'visual', label: 'Visual', icon: Boxes },
  { id: 'simulation', label: 'Simulation', icon: FlaskConical },
];

export function WorkspaceModeToggle({
  value,
  onChange,
  available,
  className,
}: {
  value: WorkspaceView;
  onChange: (v: WorkspaceView) => void;
  /** Optionally restrict which modes are clickable (others render as soon™). */
  available?: WorkspaceView[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 rounded-xl border border-border/60 bg-muted/40 p-1',
        className,
      )}
      role="tablist"
      aria-label="Workspace view mode"
    >
      {ITEMS.map((it) => {
        const isAvailable = !available || available.includes(it.id);
        const isActive = value === it.id;
        const Icon = it.icon;
        return (
          <button
            key={it.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={!isAvailable}
            onClick={() => isAvailable && onChange(it.id)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all',
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
              !isAvailable && 'cursor-not-allowed opacity-40 hover:text-muted-foreground',
            )}
            title={!isAvailable ? 'Coming soon' : undefined}
          >
            <Icon className="h-3.5 w-3.5" />
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
