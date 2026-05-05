'use client';

import { DISTRICTS, type DistrictId } from '../world/city-map';

interface Props {
  districtId: DistrictId;
  onChangeClick?: () => void;
}

export function DistrictInfoPanel({ districtId, onChangeClick }: Props) {
  const d = DISTRICTS[districtId];

  const patienceColor = {
    low: 'text-red-400',
    medium: 'text-yellow-400',
    high: 'text-green-400',
  }[d.demand.patience];

  const priceColor =
    d.demand.priceMultiplier >= 1.4
      ? 'text-green-400'
      : d.demand.priceMultiplier >= 1.0
        ? 'text-yellow-300'
        : 'text-red-400';

  const peaks = [
    d.flags.hasMorningRush && '☀️ 7–9',
    d.flags.hasLunchRush   && '🍽️ 12–14',
    d.flags.hasEveningRush && '🌆 18–21',
    d.flags.hasNightLife   && '🌙 night',
  ].filter(Boolean);

  return (
    <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-xs">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-base">{d.icon}</span>
          <div>
            <p className="font-semibold text-white/90 leading-tight">{d.name}</p>
            <p className="text-[9px] text-white/35">{d.subtitle}</p>
          </div>
        </div>
        {onChangeClick && (
          <button
            onClick={onChangeClick}
            className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] text-white/50 hover:bg-white/10 hover:text-white/80 transition-colors"
          >
            Change
          </button>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        <Stat label="Clients/h" value={`${d.demand.peakCustomers}`} />
        <Stat label="Price ×" value={`×${d.demand.priceMultiplier.toFixed(2)}`} valueClass={priceColor} />
        <Stat label="Rent/tile/day" value={`${d.rent.perTilePerDay} zł`} />
        <Stat
          label="Patience"
          value={d.demand.patience}
          valueClass={patienceColor}
        />
      </div>

      {/* Peak hours */}
      {peaks.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {peaks.map((p) => (
            <span
              key={String(p)}
              className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] text-white/50"
            >
              {p}
            </span>
          ))}
        </div>
      )}

      {/* Competition warning */}
      {d.flags.competitionHigh && (
        <p className="mt-1.5 text-[9px] text-yellow-500/70">
          ⚠️ High competition — quality bonus needed
        </p>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  valueClass = 'text-white/80',
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[9px] text-white/30">{label}</span>
      <span className={`text-[11px] font-medium ${valueClass}`}>{value}</span>
    </div>
  );
}
