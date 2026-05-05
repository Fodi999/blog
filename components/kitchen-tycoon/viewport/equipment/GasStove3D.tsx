/**
 * GasStove3D — промышленная газовая плита
 * Размер: ~0.9 × 0.9 × 0.8 (W × H × D)
 */
'use client';

import { RoomPiece } from '../RoomPiece';

interface Props {
  position?: [number, number, number];
  rotation?: [number, number, number];
}

const M = {
  body:     { color: '#374151', roughness: 0.4, metalness: 0.65 },
  top:      { color: '#1f2937', roughness: 0.3, metalness: 0.7  },
  burner:   { color: '#111827', roughness: 0.6, metalness: 0.5  },
  burnerRg: { color: '#6b7280', roughness: 0.4, metalness: 0.7  },
  knob:     { color: '#9ca3af', roughness: 0.3, metalness: 0.6  },
  pot:      { color: '#4b5563', roughness: 0.35, metalness: 0.7 },
  steam:    { color: '#e5e7eb', roughness: 0.9, metalness: 0.0, transparent: true, opacity: 0.45 },
};

export function GasStove3D({ position = [0, 0, 0], rotation = [0, 0, 0] }: Props) {
  return (
    <group position={position} rotation={rotation}>
      {/* Корпус */}
      <RoomPiece position={[0, 0.44, 0]}       scale={[0.9, 0.88, 0.78]}  {...M.body} castShadow receiveShadow />
      {/* Рабочая поверхность */}
      <RoomPiece position={[0, 0.89, 0]}        scale={[0.9, 0.04, 0.78]}  {...M.top}  castShadow />
      {/* 4 конфорки */}
      {([[-0.22, -0.18], [0.22, -0.18], [-0.22, 0.18], [0.22, 0.18]] as [number,number][]).map(([x, z], i) => (
        <group key={i} position={[x, 0.915, z]}>
          <RoomPiece slug="shape_cylinder" position={[0, 0, 0]}     scale={[0.18, 0.02, 0.18]} {...M.burner}   />
          <RoomPiece slug="shape_cylinder" position={[0, 0.012, 0]} scale={[0.10, 0.015, 0.10]} {...M.burnerRg} />
        </group>
      ))}
      {/* Ручки (4) */}
      {([-0.33, -0.11, 0.11, 0.33] as number[]).map((x, i) => (
        <RoomPiece key={i} slug="shape_cylinder" position={[x, 0.64, -0.41]} scale={[0.055, 0.055, 0.055]} rotation={[Math.PI / 2, 0, 0]} {...M.knob} />
      ))}
      {/* Кастрюля на левой задней конфорке */}
      <group position={[-0.22, 0.93, -0.18]}>
        <RoomPiece slug="shape_cylinder" position={[0, 0.09, 0]}  scale={[0.19, 0.18, 0.19]} {...M.pot} castShadow />
        {/* крышка */}
        <RoomPiece slug="shape_cylinder" position={[0, 0.19, 0]}  scale={[0.20, 0.02, 0.20]} {...M.pot} />
        <RoomPiece slug="shape_sphere"   position={[0, 0.21, 0]}  scale={[0.04, 0.04, 0.04]} {...M.knob} />
        {/* пар */}
        <RoomPiece slug="shape_cylinder" position={[0, 0.32, 0]}  scale={[0.04, 0.12, 0.04]} {...M.steam} />
        <RoomPiece slug="shape_sphere"   position={[0, 0.41, 0]}  scale={[0.07, 0.05, 0.07]} {...M.steam} />
      </group>
    </group>
  );
}
