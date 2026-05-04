/**
 * kitchen-tycoon/viewport/KitchenRoom3D.tsx
 *
 * Real 3D isometric kitchen — R3F + drei.
 * - Sky gradient background + sun
 * - Wooden floor (grid plane) with tile grid
 * - Two back walls
 * - Equipment rendered as colored boxes with emoji decals on top
 * - Click empty floor tile to place (build mode)
 * - Click asset to select/delete
 * - OrbitControls clamped to a "kitchen view" angle
 */
'use client';

import { Suspense, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { Environment, Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

import { useKitchen } from '../engine/StoreProvider';
import { ASSET_CATALOG } from '../core/catalog';
import type { KitchenAsset, KitchenAssetType } from '../core/types';

// ── World units ──────────────────────────────────────────────────────────────
const TILE = 1;          // world units per grid tile
const WALL_H = 2.4;
const WALL_T = 0.12;

function tilesOf(a: KitchenAsset) {
  const spec = ASSET_CATALOG[a.type];
  const rotated = a.rotation === 90 || a.rotation === 270;
  return { w: rotated ? spec.size.h : spec.size.w, h: rotated ? spec.size.w : spec.size.h };
}

// Convert grid pos → world center (origin at room center).
function gridToWorld(x: number, y: number, w: number, h: number, gridW: number, gridH: number) {
  const cx = (x + w / 2 - gridW / 2) * TILE;
  const cz = (y + h / 2 - gridH / 2) * TILE;
  return { cx, cz };
}

// ── Sky background (vertex-colored sphere, inside-out) ──────────────────────
function Sky() {
  const ref = useRef<THREE.ShaderMaterial>(null!);
  const uniforms = useMemo(
    () => ({
      topColor: { value: new THREE.Color('#0e1838') },
      midColor: { value: new THREE.Color('#3b5a8c') },
      botColor: { value: new THREE.Color('#d8b27a') },
    }),
    [],
  );
  return (
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[80, 32, 16]} />
      <shaderMaterial
        ref={ref}
        side={THREE.BackSide}
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={`
          varying vec3 vWorld;
          void main() {
            vWorld = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 topColor;
          uniform vec3 midColor;
          uniform vec3 botColor;
          varying vec3 vWorld;
          void main() {
            float h = normalize(vWorld).y;          // -1..1
            float t = smoothstep(-0.05, 0.4, h);    // horizon → up
            float b = smoothstep(-0.4, 0.0, h);     // ground → horizon
            vec3 c = mix(botColor, midColor, b);
            c = mix(c, topColor, t);
            gl_FragColor = vec4(c, 1.0);
          }
        `}
      />
    </mesh>
  );
}

// ── Sun + glow (billboard) ───────────────────────────────────────────────────
function Sun() {
  return (
    <group position={[20, 14, -25]}>
      <mesh>
        <sphereGeometry args={[1.6, 24, 16]} />
        <meshBasicMaterial color="#fff2c2" toneMapped={false} />
      </mesh>
      <pointLight intensity={2} distance={80} color="#ffe0a8" />
    </group>
  );
}

// ── Floor (the kitchen surface + ground around it) ───────────────────────────
function Floor({
  gridW,
  gridH,
  onTileClick,
  onTileHover,
  occ,
}: {
  gridW: number;
  gridH: number;
  onTileClick: (x: number, y: number) => void;
  onTileHover: (p: { x: number; y: number } | null) => void;
  occ: Set<string>;
}) {
  const halfW = (gridW * TILE) / 2;
  const halfH = (gridH * TILE) / 2;

  function pick(e: ThreeEvent<PointerEvent | MouseEvent>) {
    const p = e.point;
    const x = Math.floor(p.x / TILE + gridW / 2);
    const y = Math.floor(p.z / TILE + gridH / 2);
    if (x < 0 || y < 0 || x >= gridW || y >= gridH) return null;
    return { x, y };
  }

  return (
    <group>
      {/* Outer ground (much larger, dark) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#1a140d" roughness={1} />
      </mesh>

      {/* Kitchen wooden floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
        onPointerMove={(e) => {
          e.stopPropagation();
          onTileHover(pick(e));
        }}
        onPointerOut={() => onTileHover(null)}
        onClick={(e) => {
          e.stopPropagation();
          const t = pick(e);
          if (!t) return;
          if (occ.has(`${t.x},${t.y}`)) return;
          onTileClick(t.x, t.y);
        }}
      >
        <planeGeometry args={[gridW * TILE, gridH * TILE]} />
        <meshStandardMaterial color="#4a3826" roughness={0.9} />
      </mesh>

      {/* Tile grid lines (decorative) */}
      <gridHelper
        args={[Math.max(gridW, gridH) * TILE, Math.max(gridW, gridH), '#806040', '#5a3f25']}
        position={[
          gridW % 2 === 0 ? 0 : 0,
          0.005,
          gridH % 2 === 0 ? 0 : 0,
        ]}
      />

      {/* Floor edge */}
      <mesh position={[0, 0.025, halfH + 0.01]}>
        <boxGeometry args={[gridW * TILE + 0.04, 0.05, 0.04]} />
        <meshStandardMaterial color="#2a1f12" />
      </mesh>
      <mesh position={[halfW + 0.01, 0.025, 0]}>
        <boxGeometry args={[0.04, 0.05, gridH * TILE + 0.04]} />
        <meshStandardMaterial color="#2a1f12" />
      </mesh>
    </group>
  );
}

// ── Walls (back-left along -X, back along -Z) ────────────────────────────────
function Walls({ gridW, gridH }: { gridW: number; gridH: number }) {
  const halfW = (gridW * TILE) / 2;
  const halfH = (gridH * TILE) / 2;
  return (
    <group>
      {/* Back wall (along -Z, north) */}
      <mesh position={[0, WALL_H / 2, -halfH - WALL_T / 2]} receiveShadow castShadow>
        <boxGeometry args={[gridW * TILE + WALL_T * 2, WALL_H, WALL_T]} />
        <meshStandardMaterial color="#3a322b" roughness={0.85} />
      </mesh>
      {/* Left wall (along -X, west) */}
      <mesh position={[-halfW - WALL_T / 2, WALL_H / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[WALL_T, WALL_H, gridH * TILE + WALL_T * 2]} />
        <meshStandardMaterial color="#3a322b" roughness={0.85} />
      </mesh>
    </group>
  );
}

// ── Ghost preview during build ───────────────────────────────────────────────
function Ghost({
  pos,
  type,
  invalid,
  gridW,
  gridH,
}: {
  pos: { x: number; y: number };
  type: KitchenAssetType;
  invalid: boolean;
  gridW: number;
  gridH: number;
}) {
  const spec = ASSET_CATALOG[type];
  const w = spec.size.w;
  const h = spec.size.h;
  const { cx, cz } = gridToWorld(pos.x, pos.y, w, h, gridW, gridH);
  return (
    <mesh position={[cx, 0.05, cz]}>
      <boxGeometry args={[w * TILE * 0.96, 0.1, h * TILE * 0.96]} />
      <meshBasicMaterial
        color={invalid ? '#ef4444' : '#facc15'}
        transparent
        opacity={0.35}
      />
    </mesh>
  );
}

// ── Asset (placed equipment) ─────────────────────────────────────────────────
function AssetMesh({
  asset,
  gridW,
  gridH,
  selected,
  onPick,
}: {
  asset: KitchenAsset;
  gridW: number;
  gridH: number;
  selected: boolean;
  onPick: (e: ThreeEvent<MouseEvent>) => void;
}) {
  const spec = ASSET_CATALOG[asset.type];
  const { w, h } = tilesOf(asset);
  const tall =
    asset.type === 'fridge' || asset.type === 'freezer' || asset.type === 'shelf'
      ? 1.7
      : asset.type === 'oven' || asset.type === 'stove' || asset.type === 'sauce_machine'
      ? 1.0
      : 0.9;

  const { cx, cz } = gridToWorld(asset.pos.x, asset.pos.y, w, h, gridW, gridH);

  const ref = useRef<THREE.Group>(null!);
  // Selection wobble
  useFrame((state) => {
    if (!ref.current) return;
    if (selected) {
      ref.current.position.y = 0.03 + Math.sin(state.clock.elapsedTime * 4) * 0.025;
    } else {
      ref.current.position.y = 0;
    }
  });

  return (
    <group
      ref={ref}
      position={[cx, 0, cz]}
      rotation={[0, (asset.rotation * Math.PI) / 180, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onPick(e);
      }}
    >
      {/* Base box */}
      <mesh position={[0, tall / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w * TILE * 0.92, tall, h * TILE * 0.92]} />
        <meshStandardMaterial
          color={spec.color}
          roughness={0.55}
          metalness={0.15}
          emissive={selected ? '#facc15' : '#000000'}
          emissiveIntensity={selected ? 0.25 : 0}
        />
      </mesh>
      {/* Darker bottom band */}
      <mesh position={[0, 0.06, 0]} castShadow>
        <boxGeometry args={[w * TILE * 0.94, 0.12, h * TILE * 0.94]} />
        <meshStandardMaterial color="#222" roughness={0.95} />
      </mesh>
      {/* Top emoji */}
      <Html
        position={[0, tall + 0.02, 0]}
        center
        transform
        rotation={[-Math.PI / 2, 0, 0]}
        distanceFactor={6}
        zIndexRange={[0, 0]}
      >
        <div
          style={{
            fontSize: 36,
            lineHeight: 1,
            textShadow: '0 2px 4px rgba(0,0,0,0.8)',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        >
          {spec.glyph}
        </div>
      </Html>
      {/* Level badge */}
      {asset.level > 1 && (
        <Html position={[w * TILE * 0.4, tall + 0.05, -h * TILE * 0.35]} center distanceFactor={8}>
          <div
            style={{
              background: '#facc15',
              color: '#000',
              fontWeight: 700,
              fontSize: 10,
              padding: '1px 4px',
              borderRadius: 3,
              pointerEvents: 'none',
            }}
          >
            ★{asset.level}
          </div>
        </Html>
      )}
    </group>
  );
}

// ── Scene root ───────────────────────────────────────────────────────────────
function Scene() {
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

  function handleTileClick(x: number, y: number) {
    if (tool === 'build' && buildType) placeAsset(buildType, x, y);
    else if (tool === 'select') selectAsset(null);
  }

  // Ghost validity
  const ghostInvalid =
    hover && tool === 'build' && buildType
      ? (() => {
          const fp = ASSET_CATALOG[buildType].size;
          if (hover.x + fp.w > gridW || hover.y + fp.h > gridH) return true;
          for (let dy = 0; dy < fp.h; dy++)
            for (let dx = 0; dx < fp.w; dx++)
              if (occ.has(`${hover.x + dx},${hover.y + dy}`)) return true;
          return false;
        })()
      : false;

  return (
    <>
      <Sky />
      <Sun />
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[8, 14, 6]}
        intensity={1.1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      <Floor
        gridW={gridW}
        gridH={gridH}
        onTileClick={handleTileClick}
        onTileHover={setHover}
        occ={occ}
      />
      <Walls gridW={gridW} gridH={gridH} />

      {hover && tool === 'build' && buildType && (
        <Ghost
          pos={hover}
          type={buildType}
          invalid={ghostInvalid}
          gridW={gridW}
          gridH={gridH}
        />
      )}

      {assets.map((a) => (
        <AssetMesh
          key={a.id}
          asset={a}
          gridW={gridW}
          gridH={gridH}
          selected={a.id === selectedAssetId}
          onPick={() => {
            if (tool === 'delete') removeAsset(a.id);
            else selectAsset(a.id === selectedAssetId ? null : a.id);
          }}
        />
      ))}
    </>
  );
}

// ── Public component ─────────────────────────────────────────────────────────
export function KitchenRoom3D() {
  return (
    <div className="relative h-full w-full">
      <Canvas
        shadows
        camera={{ position: [10, 9, 10], fov: 38 }}
        dpr={[1, 2]}
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          <Scene />
          <Environment preset="sunset" />
        </Suspense>
        <OrbitControls
          makeDefault
          enablePan
          enableZoom
          enableRotate
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.4}
          minDistance={6}
          maxDistance={22}
          target={[0, 0.5, 0]}
        />
      </Canvas>
    </div>
  );
}
