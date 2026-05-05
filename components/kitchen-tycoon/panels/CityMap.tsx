'use client';

import { DISTRICTS, DISTRICT_LIST, type DistrictId, type District } from '../world/city-map';
import { cn } from '@/lib/utils';

interface Props {
  selectedId?: DistrictId;
  onSelect?: (id: DistrictId) => void;
  /** Текущий уровень игрока (для отображения замков) */
  playerLevel?: number;
}

export function CityMap({ selectedId, onSelect, playerLevel = 1 }: Props) {
  // 3×2 сетка
  const grid: (District | null)[][] = [
    [null, null, null],
    [null, null, null],
  ];
  for (const d of DISTRICT_LIST) {
    const [col, row] = d.gridPos;
    grid[row][col] = d;
  }

  return (
    <div className="flex flex-col gap-0.5 p-3">
      {/* Название города */}
      <div className="mb-2 text-center">
        <span className="text-xs font-bold tracking-widest text-white/40 uppercase">
          Veridian City
        </span>
      </div>

      {/* Сетка */}
      {grid.map((row, ri) => (
        <div key={ri} className="flex gap-0.5">
          {row.map((district, ci) => {
            if (!district) return <div key={ci} className="h-24 w-32 flex-1" />;

            const isLocked = playerLevel < district.unlockLevel;
            const isSelected = selectedId === district.id;

            return (
              <button
                key={district.id}
                onClick={() => !isLocked && onSelect?.(district.id)}
                className={cn(
                  'relative flex h-24 flex-1 flex-col items-start justify-between rounded-lg border p-2 text-left transition-all',
                  isLocked
                    ? 'cursor-not-allowed border-white/5 bg-black/40 opacity-50'
                    : 'cursor-pointer border-white/10 bg-black/30 hover:bg-black/50',
                  isSelected && !isLocked
                    ? 'border-yellow-400/60 ring-1 ring-yellow-400/40'
                    : '',
                )}
                style={
                  !isLocked
                    ? { borderTopColor: district.color + '60', boxShadow: isSelected ? `0 0 12px ${district.color}40` : undefined }
                    : undefined
                }
              >
                {/* Цветная полоса сверху */}
                {!isLocked && (
                  <div
                    className="absolute left-0 top-0 h-0.5 w-full rounded-t-lg"
                    style={{ background: district.color }}
                  />
                )}

                {/* Замок */}
                {isLocked && (
                  <div className="absolute inset-0 flex items-center justify-center text-xl">
                    🔒
                  </div>
                )}

                {/* Контент */}
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-base">{district.icon}</span>
                    <span className="text-[11px] font-semibold leading-tight text-white/90">
                      {district.name}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[9px] leading-tight text-white/40">
                    {district.subtitle}
                  </p>
                </div>

                {/* Метрики */}
                {!isLocked && (
                  <div className="flex w-full items-end justify-between">
                    <span className="text-[9px] text-white/30">
                      👥 {district.demand.peakCustomers}/h
                    </span>
                    <span
                      className="text-[9px] font-medium"
                      style={{ color: district.color }}
                    >
                      ×{district.demand.priceMultiplier.toFixed(1)}
                    </span>
                  </div>
                )}

                {/* Уровень разблокировки */}
                {isLocked && (
                  <div className="absolute bottom-2 right-2 text-[9px] text-white/25">
                    Lvl {district.unlockLevel}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      ))}

      {/* Легенда */}
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {[
          { label: 'Старт', color: '#22c55e', dot: true },
          { label: 'Locked', color: '#6b7280', dot: true },
        ].map(({ label, color, dot }) => (
          <span key={label} className="flex items-center gap-1 text-[9px] text-white/30">
            {dot && (
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: color }}
              />
            )}
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
