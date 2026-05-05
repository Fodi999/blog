'use client';

import { DISTRICT_LIST } from '../../world/city-map';
import { useKitchen } from '../../engine/StoreProvider';
import type { DistrictId } from '../../world/city-map';

export function CityMiniMap() {
  const selectedDistrictId = useKitchen((s) => s.cityUi.selectedDistrictId);
  const selectCityDistrict = useKitchen((s) => s.selectCityDistrict);
  const playerLevel        = useKitchen((s) => s.game.stage);

  // 3×3 grid, each mini-tile = 20×14px
  const TW = 20, TH = 14, GAP = 2;

  return (
    <div className="rounded-lg border border-white/8 bg-black/60 p-2">
      <p className="mb-1.5 text-[8px] font-bold uppercase tracking-widest text-white/25">
        Minimap
      </p>
      <div className="relative" style={{ width: 3 * TW + 2 * GAP, height: 3 * TH + 2 * GAP }}>
        {DISTRICT_LIST.map((d) => {
          const [col, row] = d.gridPos;
          const isLocked   = playerLevel < d.unlockLevel;
          const isSelected = selectedDistrictId === d.id;

          return (
            <button
              key={d.id}
              onClick={() => !isLocked && selectCityDistrict(d.id)}
              title={d.name}
              style={{
                position: 'absolute',
                left: col * (TW + GAP),
                top:  row * (TH + GAP),
                width: TW,
                height: TH,
                background: isLocked ? '#1a1a1a' : isSelected ? d.color : d.color,
                opacity: isLocked ? 0.2 : isSelected ? 1 : 0.4,
                border: isSelected ? `1px solid ${d.color}` : '1px solid rgba(255,255,255,0.08)',
                borderRadius: 3,
                cursor: isLocked ? 'not-allowed' : 'pointer',
                fontSize: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {!isLocked && <span>{d.icon}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
