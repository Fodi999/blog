/**
 * kitchen-tycoon/viewport/equipment/DefaultScene3D.tsx
 *
 * Стартовая расстановка оборудования кухни.
 * Рендерится поверх KitchenLocation как декоративный слой.
 * Игровые assets (placeAsset) добавляются отдельно поверх.
 */
'use client';

import { PrepTable3D } from './PrepTable3D';
import { GasStove3D }  from './GasStove3D';
import { Sink3D }      from './Sink3D';
import { Fridge3D }    from './Fridge3D';
import { RoomPiece }   from '../RoomPiece';

// Ящики с овощами / продуктами
function Crates({ position = [0, 0, 0] as [number,number,number] }) {
  return (
    <group position={position}>
      {/* нижний ящик */}
      <RoomPiece position={[0, 0.16, 0]}    scale={[0.45, 0.32, 0.35]} color="#78350f" roughness={0.9} castShadow receiveShadow />
      {/* верхний */}
      <RoomPiece position={[0, 0.48, 0]}    scale={[0.42, 0.30, 0.32]} color="#92400e" roughness={0.9} castShadow />
      {/* зелень в ящике */}
      <RoomPiece position={[-0.06, 0.64, 0]} scale={[0.1, 0.08, 0.08]} color="#16a34a" roughness={0.8} />
      <RoomPiece position={[ 0.06, 0.67, 0]} scale={[0.09, 0.09, 0.07]} color="#15803d" roughness={0.8} />
      <RoomPiece slug="shape_sphere" position={[0.0, 0.63, -0.04]} scale={[0.07,0.07,0.07]} color="#dc2626" roughness={0.6} />
    </group>
  );
}

// Упаковочный стол
function PackingTable({ position = [0, 0, 0] as [number,number,number] }) {
  return (
    <group position={position}>
      {/* столешница */}
      <RoomPiece position={[0, 0.87, 0]}   scale={[1.2, 0.05, 0.7]} color="#374151" roughness={0.3} metalness={0.5} castShadow receiveShadow />
      {/* ноги */}
      {([[-0.55, -0.3],[0.55, -0.3],[-0.55, 0.3],[0.55, 0.3]] as [number,number][]).map(([x,z],i) => (
        <RoomPiece key={i} position={[x, 0.44, z]} scale={[0.05, 0.9, 0.05]} color="#4b5563" roughness={0.4} metalness={0.6} />
      ))}
      {/* коробка на столе */}
      <RoomPiece position={[0.2, 0.94, 0]}   scale={[0.28, 0.2, 0.22]} color="#ca8a04" roughness={0.85} castShadow />
      {/* плёнка/рулон */}
      <RoomPiece slug="shape_cylinder" position={[-0.3, 0.94, 0]} scale={[0.06, 0.14, 0.06]} color="#e5e7eb" roughness={0.5} metalness={0.1} />
    </group>
  );
}

export function DefaultScene3D() {
  return (
    <group name="default-scene">
      {/* Холодильник — левый дальний угол */}
      <Fridge3D    position={[-3.8, 0, -2.6]} />
      {/* Газовая плита — центр у северной стены */}
      <GasStove3D  position={[ 0.0, 0, -3.1]} />
      {/* Мойка — справа у стены */}
      <Sink3D      position={[ 2.2, 0, -3.1]} />
      {/* Разделочный стол — центр кухни */}
      <PrepTable3D position={[ 0.0, 0,  0.3]} />
      {/* Ящики с продуктами */}
      <Crates      position={[ 3.2, 0,  1.8]} />
      {/* Упаковочный стол */}
      <PackingTable position={[2.8, 0,  0.7]} />
    </group>
  );
}
