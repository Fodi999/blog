/**
 * city/CityDistrictsLayer.tsx
 * Renders clickable district zones on the city grid.
 * Each district = coloured flat box on the ground.
 */
'use client';

import { useState } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { DISTRICT_LIST, type DistrictId } from '../world/city-map';

// District positions on world grid (col/row → world x/z)
// 3×3 layout, each cell = 18×14 world units
const CELL_W = 18;
const CELL_H = 14;

function districtWorldPos(col: number, row: number) {
  return {
    x: (col - 1) * CELL_W,   // center col=1 at x=0
    z: (row - 1) * CELL_H,   // center row=1 at z=0  (3 rows: -14, 0, +14)
  };
}

interface Props {
  selectedId: DistrictId | null;
  playerLevel: number;
  showOverlay: boolean;
  onSelect: (id: DistrictId) => void;
}

export function CityDistrictsLayer({ selectedId, playerLevel, showOverlay, onSelect }: Props) {
  const [hoverId, setHoverId] = useState<DistrictId | null>(null);

  return (
    <group>
      {DISTRICT_LIST.map((d) => {
        const [col, row] = d.gridPos;
        const { x, z } = districtWorldPos(col, row);
        const isLocked   = playerLevel < d.unlockLevel;
        const isSelected = selectedId === d.id;
        const isHovered  = hoverId === d.id;

        // Use only 6-digit hex for color, control transparency via opacity
        const color   = isLocked ? '#1a1a1a' : d.color;
        const opacity = isLocked ? 0.15 : isSelected ? 0.6 : isHovered ? 0.45 : 0.25;

        return (
          <group key={d.id} position={[x, 0, z]}>
            {/* District floor slab */}
            <mesh
              position={[0, 0.02, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              onPointerEnter={() => !isLocked && setHoverId(d.id)}
              onPointerLeave={() => setHoverId(null)}
              onClick={() => !isLocked && onSelect(d.id)}
            >
              <planeGeometry args={[CELL_W - 0.6, CELL_H - 0.6]} />
              <meshStandardMaterial
                color={color}
                roughness={0.9}
                transparent
                opacity={opacity}
              />
            </mesh>

            {/* Border outline */}
            <lineSegments position={[0, 0.03, 0]}>
              <edgesGeometry args={[new THREE.PlaneGeometry(CELL_W - 0.6, CELL_H - 0.6)]} />
              <lineBasicMaterial
                color={isLocked ? '#2a2a2a' : d.color}
                transparent
                opacity={isSelected ? 0.9 : isHovered ? 0.6 : 0.25}
              />
            </lineSegments>

            {/* HTML label — only shown with overlay */}
            {showOverlay && (
              <Html
                position={[0, 0.5, 0]}
                center
                distanceFactor={20}
                occlude={false}
                style={{ pointerEvents: 'none' }}
              >
                <div
                  style={{
                    color: isLocked ? '#444' : isSelected ? '#fff' : d.color,
                    fontSize: '11px',
                    fontWeight: 700,
                    textAlign: 'center',
                    textShadow: '0 1px 4px #000',
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.05em',
                    userSelect: 'none',
                  }}
                >
                  {isLocked ? '🔒' : d.icon} {d.name}
                  {!isLocked && (
                    <div style={{ fontSize: '9px', opacity: 0.6, fontWeight: 400 }}>
                      {d.demand.peakCustomers}/h · ×{d.demand.priceMultiplier.toFixed(1)}
                    </div>
                  )}
                  {isLocked && (
                    <div style={{ fontSize: '9px', opacity: 0.4, fontWeight: 400 }}>
                      Lvl {d.unlockLevel}
                    </div>
                  )}
                </div>
              </Html>
            )}

            {/* Corner markers for selected */}
            {isSelected && (
              <>
                {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz], i) => (
                  <mesh key={i} position={[sx * (CELL_W / 2 - 0.5), 0.05, sz * (CELL_H / 2 - 0.5)]}>
                    <boxGeometry args={[0.4, 0.08, 0.4]} />
                    <meshBasicMaterial color={d.color} />
                  </mesh>
                ))}
              </>
            )}
          </group>
        );
      })}
    </group>
  );
}
