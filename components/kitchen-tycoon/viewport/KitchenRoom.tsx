/**
 * kitchen-tycoon/viewport/KitchenRoom.tsx
 * Isometric kitchen scene. Pure CSS — no Three.js needed.
 * - Floor is a tilted SVG grid; assets are positioned absolutely on it.
 * - Build mode: hover highlights the target tile; click places.
 * - Select mode: click an asset to select; click empty tile to deselect.
 * - Delete mode: click an asset to remove.
 */
'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { useKitchen } from '../engine/StoreProvider';
import { ASSET_CATALOG } from '../core/catalog';
import type { KitchenAsset, KitchenAssetType } from '../core/types';

const TILE = 56;       // logical tile size in px (pre-iso)
const ROOM_PAD = 1;    // tiles of empty floor padding around the kitchen

function tilesOf(a: KitchenAsset) {
  const spec = ASSET_CATALOG[a.type];
  const rotated = a.rotation === 90 || a.rotation === 270;
  return { w: rotated ? spec.size.h : spec.size.w, h: rotated ? spec.size.w : spec.size.h };
}

function fpOf(type: KitchenAssetType) {
  return ASSET_CATALOG[type].size;
}

export function KitchenRoom() {
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

  const occ = useMemo(() => {
    const s = new Set<string>();
    for (const a of assets) {
      const { w, h } = tilesOf(a);
      for (let dy = 0; dy < h; dy++)
        for (let dx = 0; dx < w; dx++) s.add(`${a.pos.x + dx},${a.pos.y + dy}`);
    }
    return s;
  }, [assets]);

  const W = gridW * TILE;
  const H = gridH * TILE;

  function onTileClick(x: number, y: number) {
    if (tool === 'build' && buildType) {
      placeAsset(buildType, x, y);
    } else if (tool === 'select') {
      selectAsset(null);
    }
  }

  function onAssetClick(e: React.MouseEvent, a: KitchenAsset) {
    e.stopPropagation();
    if (tool === 'delete') return removeAsset(a.id);
    selectAsset(a.id === selectedAssetId ? null : a.id);
  }

  // Ghost preview during build
  const ghost = tool === 'build' && buildType && hover ? hover : null;
  const fp = buildType ? fpOf(buildType) : null;
  const ghostInvalid =
    ghost && fp
      ? ghost.x + fp.w > gridW ||
        ghost.y + fp.h > gridH ||
        Array.from({ length: fp.h }).some((_, dy) =>
          Array.from({ length: fp.w }).some((_, dx) =>
            occ.has(`${ghost.x + dx},${ghost.y + dy}`),
          ),
        )
      : false;

  // Isometric transform applied to the room. Children stay axis-aligned (easier hit-testing).
  const isoStyle: CSSProperties = {
    transform: 'rotateX(58deg) rotateZ(-45deg)',
    transformStyle: 'preserve-3d',
  };

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      {/* ── SKY (top half) ── */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
        style={{
          background:
            'linear-gradient(180deg, #0b1024 0%, #1a2b56 35%, #3b5a8c 70%, #7ea5c8 95%, #c4b48a 100%)',
        }}
      />
      {/* sun glow */}
      <div
        className="pointer-events-none absolute"
        style={{
          left: '70%',
          top: '12%',
          width: 220,
          height: 220,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(255,225,170,0.85) 0%, rgba(255,200,130,0.35) 30%, transparent 65%)',
          filter: 'blur(2px)',
        }}
      />
      {/* twinkle stars */}
      <svg
        className="pointer-events-none absolute inset-x-0 top-0 h-1/3 w-full opacity-50"
        preserveAspectRatio="none"
      >
        {Array.from({ length: 40 }).map((_, i) => {
          const x = (i * 137) % 100;
          const y = (i * 71) % 100;
          const r = 0.4 + ((i * 13) % 10) / 20;
          return <circle key={i} cx={`${x}%`} cy={`${y}%`} r={r} fill="white" opacity={0.6} />;
        })}
      </svg>
      {/* clouds */}
      <div
        className="pointer-events-none absolute"
        style={{
          left: '5%',
          top: '18%',
          width: 180,
          height: 28,
          borderRadius: 999,
          background: 'rgba(255,255,255,0.35)',
          filter: 'blur(10px)',
        }}
      />
      <div
        className="pointer-events-none absolute"
        style={{
          left: '40%',
          top: '8%',
          width: 240,
          height: 22,
          borderRadius: 999,
          background: 'rgba(255,255,255,0.25)',
          filter: 'blur(12px)',
        }}
      />

      {/* ── GROUND (bottom half) ── */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
        style={{
          background:
            'linear-gradient(180deg, #4a3826 0%, #2e2418 50%, #1a140d 100%)',
        }}
      />
      {/* ground tile grid (perspective) */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,210,140,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,210,140,0.06) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          transform: 'perspective(900px) rotateX(58deg)',
          transformOrigin: 'top',
          maskImage:
            'linear-gradient(180deg, transparent 0%, black 30%, black 100%)',
          WebkitMaskImage:
            'linear-gradient(180deg, transparent 0%, black 30%, black 100%)',
        }}
      />
      {/* warm horizon glow */}
      <div
        className="pointer-events-none absolute inset-x-0"
        style={{
          top: '46%',
          height: 80,
          background:
            'radial-gradient(ellipse at center, rgba(255,170,90,0.25), transparent 70%)',
          filter: 'blur(8px)',
        }}
      />

      {/* Iso wrapper — perspective + tilt */}
      <div
        className="relative"
        style={{ perspective: '1400px', perspectiveOrigin: '50% 40%' }}
      >
        <div className="relative" style={isoStyle}>
          {/* Walls (back-left + back-right) — sit behind the floor */}
          <div
            className="absolute"
            style={{
              left: -8,
              top: -8 - 80,
              width: W + 16,
              height: 80,
              background:
                'linear-gradient(180deg,#3a322b 0%, #2a2521 60%, #1f1b18 100%)',
              borderTopLeftRadius: 6,
              borderTopRightRadius: 6,
              boxShadow: 'inset 0 -10px 20px rgba(0,0,0,.4)',
              transform: 'rotateX(-90deg)',
              transformOrigin: 'bottom',
            }}
          />
          <div
            className="absolute"
            style={{
              left: -8 - 80,
              top: -8,
              width: 80,
              height: H + 16,
              background:
                'linear-gradient(90deg,#3a322b 0%, #2a2521 60%, #1f1b18 100%)',
              borderTopLeftRadius: 6,
              borderBottomLeftRadius: 6,
              boxShadow: 'inset -10px 0 20px rgba(0,0,0,.4)',
              transform: 'rotateY(90deg)',
              transformOrigin: 'right',
            }}
          />

          {/* Floor */}
          <div
            className="relative rounded-md shadow-2xl"
            style={{
              width: W,
              height: H,
              background:
                'repeating-linear-gradient(0deg, #2a2620 0 ' +
                TILE +
                'px, #25211c 0 ' +
                TILE * 2 +
                'px), repeating-linear-gradient(90deg, rgba(0,0,0,.25) 0 1px, transparent 1px ' +
                TILE +
                'px)',
              backgroundBlendMode: 'multiply',
              outline: '1px solid #1a1714',
            }}
          >
            {/* Tile click hitboxes */}
            <svg width={W} height={H} className="absolute inset-0 block">
              {Array.from({ length: gridH }).map((_, y) =>
                Array.from({ length: gridW }).map((_, x) => {
                  const occupied = occ.has(`${x},${y}`);
                  const isHover = hover?.x === x && hover?.y === y;
                  return (
                    <rect
                      key={`${x},${y}`}
                      x={x * TILE}
                      y={y * TILE}
                      width={TILE}
                      height={TILE}
                      fill={isHover && !occupied ? 'rgba(250,204,21,0.10)' : 'transparent'}
                      stroke="rgba(255,255,255,0.04)"
                      strokeWidth={1}
                      onMouseEnter={() => setHover({ x, y })}
                      onClick={() => !occupied && onTileClick(x, y)}
                      style={{
                        cursor:
                          tool === 'build' && !occupied ? 'crosshair' :
                          tool === 'select' ? 'default' : 'pointer',
                      }}
                    />
                  );
                }),
              )}

              {/* Ghost preview */}
              {ghost && fp && (
                <rect
                  x={ghost.x * TILE}
                  y={ghost.y * TILE}
                  width={fp.w * TILE}
                  height={fp.h * TILE}
                  fill={ghostInvalid ? 'rgba(239,68,68,0.25)' : 'rgba(250,204,21,0.20)'}
                  stroke={ghostInvalid ? '#ef4444' : '#facc15'}
                  strokeDasharray="5 4"
                  pointerEvents="none"
                />
              )}
            </svg>

            {/* Placed assets — rendered as 3D-ish boxes via translateZ */}
            {assets.map((a) => {
              const spec = ASSET_CATALOG[a.type];
              const { w, h } = tilesOf(a);
              const isSelected = a.id === selectedAssetId;
              // Box height in px, varies by type (just visual flavor)
              const tall =
                a.type === 'fridge' || a.type === 'freezer' || a.type === 'shelf' ? 70 : 38;

              return (
                <div
                  key={a.id}
                  className="absolute"
                  style={{
                    left: a.pos.x * TILE,
                    top: a.pos.y * TILE,
                    width: w * TILE,
                    height: h * TILE,
                    transformStyle: 'preserve-3d',
                  }}
                  onMouseEnter={() => setHover({ x: a.pos.x, y: a.pos.y })}
                  onClick={(e) => onAssetClick(e, a)}
                >
                  {/* Top face */}
                  <div
                    className="absolute inset-1 rounded-md"
                    style={{
                      transform: `translateZ(${tall}px)`,
                      background: `linear-gradient(135deg, ${spec.color} 0%, ${spec.color}aa 100%)`,
                      boxShadow: isSelected
                        ? '0 0 0 2px #facc15, 0 8px 18px rgba(0,0,0,.5)'
                        : '0 6px 14px rgba(0,0,0,.45)',
                      border: '1px solid rgba(255,255,255,.18)',
                    }}
                  >
                    <div
                      className="flex h-full w-full items-center justify-center"
                      style={{ transform: 'rotateZ(45deg) rotateX(-58deg)' }}
                    >
                      <span className="text-2xl drop-shadow-md" style={{ filter: 'drop-shadow(0 2px 0 rgba(0,0,0,.6))' }}>
                        {spec.glyph}
                      </span>
                    </div>
                    {a.level > 1 && (
                      <span
                        className="absolute right-1 top-1 rounded-sm bg-yellow-400 px-1 text-[9px] font-bold text-black"
                        style={{ transform: 'rotateZ(45deg) rotateX(-58deg)' }}
                      >
                        ★{a.level}
                      </span>
                    )}
                  </div>
                  {/* Side faces — cheap "extrusion" using box-shadow */}
                  <div
                    className="absolute inset-1 rounded-md"
                    style={{
                      background: spec.color,
                      opacity: 0.55,
                      boxShadow: `0 0 0 1px rgba(0,0,0,.4) inset`,
                      transform: `translateZ(${tall / 2}px)`,
                      filter: 'brightness(0.7)',
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
