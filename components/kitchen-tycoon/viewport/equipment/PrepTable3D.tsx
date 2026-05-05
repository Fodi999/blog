/**
 * PrepTable3D — рабочий разделочный стол
 * Размер: ~1.8 × 0.9 × 0.8 (W × H × D)
 */
'use client';

import { RoomPiece } from '../RoomPiece';

interface Props {
  position?: [number, number, number];
  rotation?: [number, number, number];
}

const M = {
  steel:  { color: '#9ca3af', roughness: 0.25, metalness: 0.75 },
  leg:    { color: '#6b7280', roughness: 0.3,  metalness: 0.8  },
  shelf:  { color: '#374151', roughness: 0.35, metalness: 0.6  },
  board:  { color: '#c8a46e', roughness: 0.9,  metalness: 0.0  }, // дерево
  food:   { color: '#4ade80', roughness: 0.8,  metalness: 0.0  }, // зелень
  accent: { color: '#ef4444', roughness: 0.6,  metalness: 0.0  }, // красный продукт
};

export function PrepTable3D({ position = [0, 0, 0], rotation = [0, 0, 0] }: Props) {
  return (
    <group position={position} rotation={rotation}>
      {/* Столешница */}
      <RoomPiece position={[0, 0.87, 0]}      scale={[1.8, 0.06, 0.8]}   {...M.steel}  castShadow receiveShadow />
      {/* Бортик вдоль заднего края */}
      <RoomPiece position={[0, 0.94, -0.38]}  scale={[1.8, 0.08, 0.025]} {...M.steel}  castShadow />
      {/* Нижняя полка */}
      <RoomPiece position={[0, 0.28, 0]}      scale={[1.7, 0.04, 0.72]}  {...M.shelf}  receiveShadow />
      {/* Ноги (4 шт) */}
      {([[-0.83, -0.37], [0.83, -0.37], [-0.83, 0.37], [0.83, 0.37]] as [number,number][]).map(([x, z], i) => (
        <RoomPiece key={i} position={[x, 0.44, z]} scale={[0.05, 0.9, 0.05]} {...M.leg} castShadow />
      ))}
      {/* Разделочная доска */}
      <RoomPiece position={[-0.45, 0.91, 0.05]} scale={[0.55, 0.02, 0.35]} {...M.board} castShadow />
      {/* Зелень (несколько кубиков) */}
      <RoomPiece position={[-0.52, 0.95, 0.04]} scale={[0.08, 0.06, 0.08]} {...M.food} />
      <RoomPiece position={[-0.44, 0.97, 0.02]} scale={[0.06, 0.07, 0.06]} {...M.food} />
      <RoomPiece position={[-0.38, 0.94, 0.06]} scale={[0.07, 0.05, 0.07]} {...M.food} />
      {/* Красный продукт (помидор/перец) */}
      <RoomPiece slug="shape_sphere" position={[0.5, 0.94, 0.06]} scale={[0.08, 0.08, 0.08]} {...M.accent} />
      <RoomPiece slug="shape_sphere" position={[0.6, 0.94, -0.04]} scale={[0.07, 0.07, 0.07]} {...M.accent} />
    </group>
  );
}
