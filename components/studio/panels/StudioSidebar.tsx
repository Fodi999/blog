'use client';
/**
 * studio/panels/StudioSidebar.tsx
 *
 * Left sidebar: Hierarchy + Assets tabs.
 */

import React, { useState } from 'react';
import { StudioHierarchy } from './StudioHierarchy';
import type { SceneObject } from '../core/types';

type Tab = 'hierarchy' | 'assets';

export interface StudioSidebarProps {
  objects: SceneObject[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleVisible: (id: string) => void;
  onToggleLock: (id: string) => void;
  onRemove: (id: string) => void;
}

export function StudioSidebar(props: StudioSidebarProps) {
  const [tab, setTab] = useState<Tab>('hierarchy');

  return (
    <div className="flex h-full w-52 flex-shrink-0 flex-col border-r border-white/6 bg-[#090909]">
      {/* Tab bar */}
      <div className="flex border-b border-white/6">
        {(['hierarchy', 'assets'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 text-[10px] font-semibold uppercase tracking-widest transition-colors ${
              tab === t ? 'text-white/80 bg-white/4' : 'text-white/25 hover:text-white/50'
            }`}
          >
            {t === 'hierarchy' ? '⊞ Scene' : '⊟ Assets'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {tab === 'hierarchy' && <StudioHierarchy {...props} />}
        {tab === 'assets' && (
          <div className="p-3 text-[11px] text-white/20">Assets panel — coming soon</div>
        )}
      </div>
    </div>
  );
}
