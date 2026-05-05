/**
 * Sink3D — промышленная раковина
 * Размер: ~0.9 × 0.9 × 0.7 (W × H × D)
 */
'use client';

import { RoomPiece } from '../RoomPiece';

interface Props {
  position?: [number, number, number];
  rotation?: [number, number, number];
}

const M = {
  cabinet: { color: '#374151', roughness: 0.5, metalness: 0.4  },
  sink:    { color: '#9ca3af', roughness: 0.2, metalness: 0.85 },
  tap:     { color: '#d1d5db', roughness: 0.15, metalness: 0.9 },
  bottle:  { color: '#22c55e', roughness: 0.3, metalness: 0.0, transparent: true, opacity: 0.7 },
  soap:    { color: '#fde68a', roughness: 0.7, metalness: 0.0  },
};

export function Sink3D({ position = [0, 0, 0], rotation = [0, 0, 0] }: Props) {
  return (
    <group position={position} rotation={rotation}>
      {/* Тумба */}
      <RoomPiece position={[0, 0.42, 0]}        scale={[0.88, 0.84, 0.68]}  {...M.cabinet} castShadow receiveShadow />
      {/* Столешница с отверстием-имитацией */}
      <RoomPiece position={[0, 0.86, 0]}         scale={[0.88, 0.04, 0.68]}  {...M.sink}   castShadow />
      {/* Чаша раковины */}
      <RoomPiece position={[0, 0.80, 0.01]}      scale={[0.62, 0.1, 0.50]}   {...M.sink}   />
      {/* Дно раковины */}
      <RoomPiece position={[0, 0.75, 0.01]}      scale={[0.60, 0.01, 0.48]}  color="#6b7280" roughness={0.25} metalness={0.8} />
      {/* Кран — основа */}
      <RoomPiece slug="shape_cylinder" position={[0, 0.92, -0.15]}    scale={[0.04, 0.12, 0.04]}  {...M.tap} castShadow />
      {/* Кран — шея */}
      <RoomPiece position={[0, 1.03, -0.02]}                          scale={[0.03, 0.04, 0.22]}   {...M.tap} />
      {/* Кран — носик */}
      <RoomPiece slug="shape_cylinder" position={[0, 1.01, 0.08]}     scale={[0.025, 0.06, 0.025]} {...M.tap} rotation={[Math.PI / 2.5, 0, 0]} />
      {/* Ручки крана */}
      <RoomPiece position={[-0.06, 1.02, -0.15]} scale={[0.09, 0.025, 0.025]} {...M.tap} />
      <RoomPiece position={[ 0.06, 1.02, -0.15]} scale={[0.09, 0.025, 0.025]} {...M.tap} />
      {/* Бутылка моющего */}
      <RoomPiece slug="shape_cylinder" position={[0.32, 0.94, -0.12]} scale={[0.05, 0.14, 0.05]}   {...M.bottle} />
      <RoomPiece slug="shape_sphere"   position={[0.32, 1.03, -0.12]} scale={[0.055, 0.04, 0.055]} color="#16a34a" roughness={0.4} />
      {/* Мыло */}
      <RoomPiece position={[-0.28, 0.885, 0.1]}  scale={[0.1, 0.04, 0.06]}   {...M.soap} />
    </group>
  );
}
