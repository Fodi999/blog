/**
 * kitchen-tycoon/viewport/KitchenGrid.tsx
 * Top-down 2D grid (no 3D needed for MVP).
 * - Click empty tile in 'build' mode → place asset
 * - Click placed asset in 'select' mode → select
 * - Click placed asset in 'delete' mode → remove
 */
'use client';

import { useMemo, useState } from 'react';
import { useKitchen } from '../engine/StoreProvider';
import { ASSET_CATALOG } from '../core/catalog';
import type { KitchenAsset, KitchenAssetType } from '../core/types';

const TILE = 56; // px

function assetTiles(a: KitchenAsset): { w: number; h: number } {
  const spec = ASSET_CATALOG[a.type];
  const rotated = a.rotation === 90 || a.rotation === 270;
  return {
    w: rotated ? spec.size.h : spec.size.w,
    h: rotated ? spec.size.w : spec.size.h,
  };
}

function ghostFootprint(type: KitchenAssetType): { w: number; h: number } {
  const s = ASSET_CATALOG[type].size;
  return { w: s.w, h: s.h };
}

export function KitchenGrid() {
  const gridW           = useKitchen((s) => s.gridW);
  const gridH           = useKitchen((s) => s.gridH);
  const assets          = useKitchen((s) => s.assets);
  const tool            = useKitchen((s) => s.tool);
  const buildType       = useKitchen((s) => s.buildType);
  const selectedAssetId = useKitchen((s) => s.selectedAssetId);
  const placeAsset      = useKitchen((s) => s.placeAsset);
  const removeAsset     = useKitchen((s) => s.removeAsset);
  const selectAsset     = useKitchen((s) => s.selectAsset);

  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);

  const occupiedSet = useMemo(() => {
    const s = new Set<string>();
    for (const a of assets) {
      const { w, h } = assetTiles(a);
      for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) s.add(`${a.pos.x + dx},${a.pos.y + dy}`);
      }
    }
    return s;
  }, [assets]);

  const W = gridW * TILE;
  const H = gridH * TILE;

  function onTileClick(x: number, y: number) {
    if (tool === 'build' && buildType) {
      placeAsset(buildType, x, y);
    }
  }

  function onAssetClick(e: React.MouseEvent, a: KitchenAsset) {
    e.stopPropagation();
    if (tool === 'delete') {
      removeAsset(a.id);
      return;
    }
    selectAsset(a.id === selectedAssetId ? null : a.id);
  }

  // Ghost preview during build
  const ghost = tool === 'build' && buildType && hover ? hover : null;
  const ghostFp = buildType ? ghostFootprint(buildType) : null;
  const ghostInvalid =
    ghost && ghostFp
      ? ghost.x + ghostFp.w > gridW ||
        ghost.y + ghostFp.h > gridH ||
        Array.from({ length: ghostFp.h }).some((_, dy) =>
          Array.from({ length: ghostFp.w }).some((_, dx) =>
            occupiedSet.has(`${ghost.x + dx},${ghost.y + dy}`),
          ),
        )
      : false;

  return (
    <div
      className="relative rounded-2xl border border-white/10 bg-zinc-900/60 p-4 shadow-inner"
      style={{ width: W + 32, height: H + 32 }}
      onMouseLeave={() => setHover(null)}
    >
      <svg width={W} height={H} className="block">
        {/* Tiles */}
        {Array.from({ length: gridH }).map((_, y) =>
          Array.from({ length: gridW }).map((_, x) => {
            const occupied = occupiedSet.has(`${x},${y}`);
            return (
              <rect
                key={`${x},${y}`}
                x={x * TILE}
                y={y * TILE}
                width={TILE}
                height={TILE}
                fill={(x + y) % 2 === 0 ? '#0f172a' : '#111827'}
                stroke="#1f2937"
                strokeWidth={1}
                onMouseEnter={() => setHover({ x, y })}
                onClick={() => !occupied && onTileClick(x, y)}
                style={{ cursor: tool === 'build' && !occupied ? 'crosshair' : 'default' }}
              />
            );
          }),
        )}

        {/* Ghost preview */}
        {ghost && ghostFp && (
          <rect
            x={ghost.x * TILE}
            y={ghost.y * TILE}
            width={ghostFp.w * TILE}
            height={ghostFp.h * TILE}
            fill={ghostInvalid ? 'rgba(239,68,68,0.25)' : 'rgba(34,197,94,0.25)'}
            stroke={ghostInvalid ? '#ef4444' : '#22c55e'}
            strokeDasharray="4 3"
            pointerEvents="none"
          />
        )}

        {/* Placed assets */}
        {assets.map((a) => {
          const spec = ASSET_CATALOG[a.type];
          const { w, h } = assetTiles(a);
          const isSelected = a.id === selectedAssetId;
          return (
            <g
              key={a.id}
              transform={`translate(${a.pos.x * TILE}, ${a.pos.y * TILE})`}
              onClick={(e) => onAssetClick(e, a)}
              style={{ cursor: 'pointer' }}
            >
              <rect
                x={2}
                y={2}
                width={w * TILE - 4}
                height={h * TILE - 4}
                rx={8}
                fill={spec.color}
                fillOpacity={0.18}
                stroke={isSelected ? '#fde047' : spec.color}
                strokeWidth={isSelected ? 3 : 2}
              />
              <text
                x={(w * TILE) / 2}
                y={(h * TILE) / 2 + 4}
                textAnchor="middle"
                fontSize={26}
                style={{ userSelect: 'none' }}
              >
                {spec.glyph}
              </text>
              {a.level > 1 && (
                <text
                  x={w * TILE - 10}
                  y={14}
                  textAnchor="end"
                  fontSize={10}
                  fill="#fde047"
                  fontWeight={700}
                >
                  ★{a.level}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
