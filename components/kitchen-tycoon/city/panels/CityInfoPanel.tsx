'use client';

import { useKitchen } from '../../engine/StoreProvider';
import { DISTRICTS, getDistrictById } from '../../world/city-map';
import type { DistrictId } from '../../world/city-map';

export function CityInfoPanel() {
  const selectedDistrictId = useKitchen((s) => s.cityUi.selectedDistrictId);
  const setSelectedDistrict = useKitchen((s) => s.setSelectedDistrict);
  const setMapOpen = useKitchen((s) => s.setCityTool); // reuse store action

  if (!selectedDistrictId) {
    return (
      <aside className="flex w-72 shrink-0 flex-col border-l border-white/8 bg-[#07090d]/95 p-4">
        <p className="text-[10px] font-bold tracking-[0.25em] text-white/20 uppercase">
          City Intel
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 text-center">
          <span className="text-4xl opacity-20">🗺️</span>
          <p className="text-xs text-white/25">
            Click a district on the map to view market data
          </p>
        </div>
      </aside>
    );
  }

  const d = getDistrictById(selectedDistrictId);
  const peaks = [
    d.flags.hasMorningRush && '☀️ 7–9',
    d.flags.hasLunchRush   && '🍽️ 12–14',
    d.flags.hasEveningRush && '🌆 18–21',
    d.flags.hasNightLife   && '🌙 Night',
  ].filter(Boolean);

  const patienceColor = { low: '#f87171', medium: '#facc15', high: '#4ade80' }[d.demand.patience];
  const priceColor = d.demand.priceMultiplier >= 1.4 ? '#4ade80' : d.demand.priceMultiplier >= 1.0 ? '#facc15' : '#f87171';

  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-white/8 bg-[#07090d]/95">
      {/* Header */}
      <div className="border-b border-white/8 px-4 py-3">
        <p className="text-[10px] font-bold tracking-[0.25em] text-yellow-400/80 uppercase">
          District Intel
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Name */}
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg text-xl"
              style={{ background: d.color + '20', border: `1px solid ${d.color}40` }}
            >
              {d.icon}
            </span>
            <div>
              <p className="font-bold text-white/90">{d.name}</p>
              <p className="text-[9px] text-white/35">{d.subtitle}</p>
            </div>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-white/40">{d.description}</p>
        </div>

        {/* Stats */}
        <div className="mb-4 grid grid-cols-2 gap-2">
          <StatCard label="Clients/h" value={`${d.demand.peakCustomers}`} color={d.color} />
          <StatCard label="Price ×" value={`×${d.demand.priceMultiplier.toFixed(2)}`} color={priceColor} />
          <StatCard label="Rent/tile" value={`${d.rent.perTilePerDay}zł`} color="#94a3b8" />
          <StatCard label="Patience" value={d.demand.patience} color={patienceColor} />
        </div>

        {/* Peak hours */}
        {peaks.length > 0 && (
          <div className="mb-4">
            <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-widest text-white/25">
              Peak Hours
            </p>
            <div className="flex flex-wrap gap-1.5">
              {peaks.map((p) => (
                <span key={String(p)} className="rounded-md bg-white/5 px-2 py-1 text-[10px] text-white/50">
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Competition */}
        {d.flags.competitionHigh && (
          <div className="mb-4 rounded-lg border border-yellow-400/20 bg-yellow-400/5 p-2.5 text-[10px] text-yellow-400/70">
            ⚠️ High competition — quality bonus needed to stand out
          </div>
        )}

        {/* Kitchen bonuses */}
        {Object.keys(d.kitchenBonus).length > 0 && (
          <div className="mb-4">
            <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-widest text-white/25">
              Kitchen Bonuses
            </p>
            <div className="space-y-1">
              {Object.entries(d.kitchenBonus).map(([type, mult]) => (
                <div key={type} className="flex items-center justify-between text-[10px]">
                  <span className="capitalize text-white/40">{type.replace(/_/g, ' ')}</span>
                  <span className="font-semibold text-emerald-400">×{(mult ?? 1).toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="border-t border-white/8 p-3">
        <button
          onClick={() => setSelectedDistrict(selectedDistrictId as DistrictId)}
          className="w-full rounded-lg bg-yellow-400 px-4 py-2.5 text-[11px] font-bold text-black transition hover:bg-yellow-300"
        >
          Open Business Here
        </button>
      </div>
    </aside>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2">
      <p className="text-[8px] uppercase tracking-wider text-white/25">{label}</p>
      <p className="mt-0.5 text-[12px] font-bold" style={{ color }}>{value}</p>
    </div>
  );
}
