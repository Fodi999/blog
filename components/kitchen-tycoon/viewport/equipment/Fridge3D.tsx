/**
 * Fridge3D — промышленный холодильник
 * Размер: ~0.75 × 1.8 × 0.7 (W × H × D)
 */
'use client';

import { RoomPiece } from '../RoomPiece';

interface Props {
  position?: [number, number, number];
  rotation?: [number, number, number];
}

const M = {
  body:    { color: '#1f2937', roughness: 0.35, metalness: 0.7  },
  door:    { color: '#111827', roughness: 0.3,  metalness: 0.75 },
  handle:  { color: '#9ca3af', roughness: 0.2,  metalness: 0.9  },
  seam:    { color: '#374151', roughness: 0.5,  metalness: 0.4  },
  display: { color: '#22d3ee', roughness: 0.1,  metalness: 0.0, transparent: true, opacity: 0.9 },
  glow:    { color: '#0ea5e9', roughness: 0.1,  metalness: 0.0, transparent: true, opacity: 0.6 },
  label:   { color: '#facc15', roughness: 0.5,  metalness: 0.0  },
};

export function Fridge3D({ position = [0, 0, 0], rotation = [0, 0, 0] }: Props) {
  return (
    <group position={position} rotation={rotation}>
      {/* Корпус */}
      <RoomPiece position={[0, 0.9, 0]}        scale={[0.75, 1.8, 0.70]}  {...M.body} castShadow receiveShadow />
      {/* Дверная панель */}
      <RoomPiece position={[0, 0.9, 0.361]}    scale={[0.71, 1.75, 0.02]} {...M.door} />
      {/* Горизонтальный шов дверей (разделитель) */}
      <RoomPiece position={[0, 1.06, 0.37]}    scale={[0.72, 0.012, 0.02]} {...M.seam} />
      {/* Ручка верхней двери */}
      <RoomPiece position={[0.28, 1.4,  0.38]} scale={[0.025, 0.5,  0.025]} {...M.handle} />
      {/* Ручка нижней двери */}
      <RoomPiece position={[0.28, 0.55, 0.38]} scale={[0.025, 0.45, 0.025]} {...M.handle} />
      {/* Декоративная полоска сбоку */}
      <RoomPiece position={[-0.355, 0.9, 0]}   scale={[0.02, 1.78, 0.68]}  {...M.seam} />
      {/* Дисплей (голубой экранчик) */}
      <RoomPiece position={[-0.15, 1.55, 0.37]} scale={[0.22, 0.1, 0.015]} {...M.display} />
      {/* Glow под дисплеем */}
      <RoomPiece position={[-0.15, 1.55, 0.39]} scale={[0.24, 0.12, 0.01]}  {...M.glow} />
      {/* Маленький лейбл / логотип */}
      <RoomPiece position={[0.12, 1.55, 0.37]}  scale={[0.08, 0.04, 0.012]} {...M.label} />
      {/* Ножки */}
      {([-0.3, 0.3] as number[]).map((x, i) => (
        <RoomPiece key={i} position={[x, 0.02, 0]} scale={[0.07, 0.04, 0.65]} color="#0f172a" roughness={0.9} />
      ))}
      {/* pointLight — холодное свечение от экрана */}
      <pointLight position={[-0.15, 1.55, 0.5]} intensity={0.4} distance={1.2} color="#22d3ee" />
    </group>
  );
}
