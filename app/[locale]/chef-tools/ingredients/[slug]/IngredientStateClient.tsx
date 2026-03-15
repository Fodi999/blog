'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from '@/i18n/routing';
import type {
  ApiIngredientStateSingle,
  ApiIngredientStateListItem,
} from '@/lib/api';
import { API_URL } from '@/lib/api';

/* ─── Constants ──────────────────────────────────────────────────────────── */

const STATE_EMOJI: Record<string, string> = {
  raw: '🥬', boiled: '💧', steamed: '♨️', baked: '🧑‍🍳',
  grilled: '🔥', fried: '🍳', smoked: '🌫️', frozen: '❄️',
  dried: '☀️', pickled: '🫙',
};

const STATE_ORDER = ['raw', 'boiled', 'steamed', 'baked', 'grilled', 'fried', 'smoked', 'frozen', 'dried', 'pickled'];

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function fmt(v: number | null | undefined): string {
  if (v == null) return '—';
  const r = Math.round(v * 10) / 10;
  return r % 1 === 0 ? String(r) : r.toFixed(1);
}

function pct(raw: number | null | undefined, cur: number | null | undefined): string | null {
  if (raw == null || cur == null || raw === 0) return null;
  const diff = ((cur - raw) / raw) * 100;
  if (Math.abs(diff) < 0.5) return null;
  const sign = diff > 0 ? '+' : '';
  return `${sign}${Math.round(diff)}%`;
}

function giColor(gi: number): string {
  if (gi <= 55) return 'text-green-600 dark:text-green-400';
  if (gi <= 69) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

function giBg(gi: number): string {
  if (gi <= 55) return 'bg-green-500/10 border-green-500/20';
  if (gi <= 69) return 'bg-yellow-500/10 border-yellow-500/20';
  return 'bg-red-500/10 border-red-500/20';
}

function t4(locale: string, en: string, ru: string, pl: string, uk: string): string {
  if (locale === 'ru') return ru;
  if (locale === 'pl') return pl;
  if (locale === 'uk') return uk;
  return en;
}

function localSuffix(s: { name_suffix_en: string; name_suffix_ru?: string; name_suffix_pl?: string; name_suffix_uk?: string }, locale: string): string {
  if (locale === 'ru' && s.name_suffix_ru) return s.name_suffix_ru;
  if (locale === 'pl' && s.name_suffix_pl) return s.name_suffix_pl;
  if (locale === 'uk' && s.name_suffix_uk) return s.name_suffix_uk;
  return s.name_suffix_en;
}

function localNotes(s: { notes_en?: string | null; notes_ru?: string | null; notes_pl?: string | null; notes_uk?: string | null }, locale: string): string | null {
  if (locale === 'ru' && s.notes_ru) return s.notes_ru;
  if (locale === 'pl' && s.notes_pl) return s.notes_pl;
  if (locale === 'uk' && s.notes_uk) return s.notes_uk;
  return s.notes_en ?? null;
}

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface Props {
  slug: string;
  locale: string;
  availableStates: ApiIngredientStateListItem[];
  initialState: string;
}

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function IngredientStateClient({ slug, locale, availableStates, initialState }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeState, setActiveState] = useState(initialState);
  const [stateData, setStateData] = useState<ApiIngredientStateSingle | null>(null);
  const [loading, setLoading] = useState(false);

  // Sort available states by the canonical order
  const sorted = useMemo(() => {
    return [...availableStates].sort(
      (a, b) => STATE_ORDER.indexOf(a.state) - STATE_ORDER.indexOf(b.state),
    );
  }, [availableStates]);

  // Find raw state data for comparison
  const rawState = useMemo(
    () => availableStates.find((s) => s.state === 'raw') ?? null,
    [availableStates],
  );

  // Fetch single state detail
  const fetchState = useCallback(async (state: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/public/ingredients/${encodeURIComponent(slug)}/states/${encodeURIComponent(state)}`,
      );
      if (res.ok) {
        const data = await res.json();
        setStateData(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [slug]);

  // Load state on change
  useEffect(() => {
    fetchState(activeState);
  }, [activeState, fetchState]);

  // Switch state handler — path-based for SEO
  const handleSwitch = (state: string) => {
    if (state === activeState) return;
    setActiveState(state);
    // Navigate to /chef-tools/ingredients/{slug}/{state} for SEO
    const basePath = `/chef-tools/ingredients/${slug}`;
    const target = state === 'raw' ? basePath : `${basePath}/${state}`;
    router.replace(target as never, { scroll: false });
  };

  if (availableStates.length === 0) return null;

  const n = stateData?.nutrition;
  const c = stateData?.cooking;
  const st = stateData?.storage;

  return (
    <div className="mb-6 sm:mb-10">
      {/* ── Section Title ── */}
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <span className="text-lg">⚗️</span>
        <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-foreground">
          {t4(locale, 'Processing States', 'Состояния обработки', 'Stany przetwarzania', 'Стани обробки')}
        </h2>
      </div>

      {/* ── State Switcher Bar ── */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-5 sm:mb-6">
        {sorted.map((s) => {
          const active = s.state === activeState;
          return (
            <button
              key={s.state}
              onClick={() => handleSwitch(s.state)}
              className={`
                inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2
                rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wider
                border transition-all duration-200
                ${active
                  ? 'bg-primary text-primary-foreground border-primary shadow-md scale-105'
                  : 'bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted/60 hover:border-primary/30 hover:text-foreground'
                }
              `}
            >
              <span className="text-sm sm:text-base">{STATE_EMOJI[s.state] || '⚗️'}</span>
              <span className="hidden sm:inline">{localSuffix(s, locale)}</span>
              <span className="sm:hidden">{s.state}</span>
            </button>
          );
        })}
      </div>

      {/* ── Loading skeleton ── */}
      {loading && !stateData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted/40" />
          ))}
        </div>
      )}

      {/* ── State Data Cards ── */}
      {stateData && (
        <div className={`space-y-4 sm:space-y-6 transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>

          {/* ── Nutrition ── */}
          <div className="rounded-xl sm:rounded-2xl border border-border/50 overflow-hidden">
            <div className="bg-muted/30 px-3 sm:px-5 py-2.5 sm:py-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <span>🔥</span>
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-foreground">
                  {t4(locale, 'Nutrition per 100g', 'Пищевая ценность на 100г', 'Wartości odżywcze na 100g', 'Харчова цінність на 100г')}
                </h3>
                <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {localSuffix(stateData, locale)}
                </span>
              </div>
              {activeState !== 'raw' && (
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground italic">
                    {t4(locale,
                      'Values adjusted for cooking state',
                      'Значения пересчитаны для состояния обработки',
                      'Wartości dostosowane do stanu gotowania',
                      'Значення перераховані для стану обробки',
                    )}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md border border-border/30">
                    {t4(locale, 'Base ref:', 'База:', 'Baza:', 'База:')} 🥬 RAW
                  </span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 divide-x divide-y sm:divide-y-0 divide-border/50">
              {[
                { label: t4(locale, 'Calories', 'Калории', 'Kalorie', 'Калорії'), val: n?.calories_per_100g, raw: rawState?.calories_per_100g, unit: 'kcal' },
                { label: t4(locale, 'Protein', 'Белки', 'Białko', 'Білки'), val: n?.protein_per_100g, raw: rawState?.protein_per_100g, unit: 'g' },
                { label: t4(locale, 'Fat', 'Жиры', 'Tłuszcz', 'Жири'), val: n?.fat_per_100g, raw: rawState?.fat_per_100g, unit: 'g' },
                { label: t4(locale, 'Carbs', 'Углеводы', 'Węglowodany', 'Вуглеводи'), val: n?.carbs_per_100g, raw: rawState?.carbs_per_100g, unit: 'g' },
                { label: t4(locale, 'Fiber', 'Клетчатка', 'Błonnik', 'Клітковина'), val: n?.fiber_per_100g, raw: rawState?.fiber_per_100g, unit: 'g' },
                { label: t4(locale, 'Water', 'Вода', 'Woda', 'Вода'), val: n?.water_percent, raw: rawState?.water_percent, unit: '%' },
              ].map(({ label, val, raw, unit }) => {
                const diff = activeState !== 'raw' ? pct(raw, val) : null;
                return (
                  <div key={label} className="p-2.5 sm:p-4 text-center">
                    <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5 sm:mb-1">{label}</p>
                    <p className="text-lg sm:text-2xl font-black text-foreground">{fmt(val)}</p>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground font-bold">{unit}</p>
                    {diff && (
                      <p className={`text-[10px] sm:text-[11px] font-bold mt-0.5 ${
                        diff.startsWith('+') ? 'text-red-500' : 'text-green-600'
                      }`}>
                        {diff} {t4(locale, 'vs raw', 'vs сырой', 'vs surowy', 'vs сирий')}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Glycemic Index ── */}
          {stateData.glycemic_index != null && (
            <div className="rounded-xl sm:rounded-2xl border border-border/50 overflow-hidden">
              <div className="bg-muted/30 px-3 sm:px-5 py-2.5 sm:py-3 border-b border-border/50 flex items-center gap-2">
                <span>📊</span>
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-foreground">
                  {t4(locale, 'Glycemic Index', 'Гликемический индекс', 'Indeks glikemiczny', 'Глікемічний індекс')}
                </h3>
              </div>
              <div className="p-4 sm:p-6 flex items-center gap-4 sm:gap-6">
                <div className={`flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border ${giBg(stateData.glycemic_index)}`}>
                  <span className={`text-2xl sm:text-3xl font-black ${giColor(stateData.glycemic_index)}`}>
                    {stateData.glycemic_index}
                  </span>
                </div>
                <div>
                  <p className={`text-sm sm:text-base font-black ${giColor(stateData.glycemic_index)}`}>
                    {stateData.glycemic_index <= 55
                      ? t4(locale, 'Low GI', 'Низкий ГИ', 'Niski IG', 'Низький ГІ')
                      : stateData.glycemic_index <= 69
                        ? t4(locale, 'Medium GI', 'Средний ГИ', 'Średni IG', 'Середній ГІ')
                        : t4(locale, 'High GI', 'Высокий ГИ', 'Wysoki IG', 'Високий ГІ')}
                  </p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                    {t4(locale,
                      'Impact on blood sugar after eating',
                      'Влияние на уровень сахара в крови',
                      'Wpływ na poziom cukru we krwi',
                      'Вплив на рівень цукру в крові',
                    )}
                  </p>
                  {/* Show GI comparison across states */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {sorted
                      .filter((s) => s.glycemic_index != null)
                      .map((s) => (
                        <span
                          key={s.state}
                          className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${
                            s.state === activeState ? giBg(s.glycemic_index!) + ' ' + giColor(s.glycemic_index!) : 'bg-muted/30 text-muted-foreground border-border/30'
                          }`}
                        >
                          {STATE_EMOJI[s.state]} {s.glycemic_index}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Cooking Transformation ── */}
          {c && (c.weight_change_percent != null || c.water_loss_percent != null || c.oil_absorption_g != null) && activeState !== 'raw' && (
            <div className="rounded-xl sm:rounded-2xl border border-border/50 overflow-hidden">
              <div className="bg-muted/30 px-3 sm:px-5 py-2.5 sm:py-3 border-b border-border/50 flex items-center gap-2">
                <span>🔄</span>
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-foreground">
                  {t4(locale, 'Cooking Transformation', 'Кулинарная трансформация', 'Transformacja gotowania', 'Кулінарна трансформація')}
                </h3>
              </div>
              <div className="grid grid-cols-3 divide-x divide-border/50">
                {c.weight_change_percent != null && (
                  <div className="p-3 sm:p-5 text-center">
                    <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      {t4(locale, 'Weight', 'Масса', 'Masa', 'Маса')}
                    </p>
                    <p className={`text-xl sm:text-2xl font-black ${c.weight_change_percent < 0 ? 'text-red-500' : c.weight_change_percent > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {c.weight_change_percent > 0 ? '+' : ''}{c.weight_change_percent}%
                    </p>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground">⚖️</p>
                  </div>
                )}
                {c.water_loss_percent != null && c.water_loss_percent > 0 && (
                  <div className="p-3 sm:p-5 text-center">
                    <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      {t4(locale, 'Water Loss', 'Потеря воды', 'Utrata wody', 'Втрата води')}
                    </p>
                    <p className="text-xl sm:text-2xl font-black text-blue-500">
                      -{c.water_loss_percent}%
                    </p>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground">💧</p>
                  </div>
                )}
                {c.oil_absorption_g != null && c.oil_absorption_g > 0 && (
                  <div className="p-3 sm:p-5 text-center">
                    <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      {t4(locale, 'Oil Absorbed', 'Впитано масла', 'Wchłonięty olej', 'Вбрано олії')}
                    </p>
                    <p className="text-xl sm:text-2xl font-black text-yellow-600">
                      +{c.oil_absorption_g}g
                    </p>
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground">🫙</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Texture + Storage ── */}
          {st && (st.texture || st.shelf_life_hours != null || st.storage_temp_c != null) && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {st.texture && (
                <div className="rounded-xl sm:rounded-2xl border border-border/50 p-3 sm:p-5 text-center">
                  <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    {t4(locale, 'Texture', 'Текстура', 'Tekstura', 'Текстура')}
                  </p>
                  <p className="text-base sm:text-lg font-black text-foreground capitalize">{st.texture}</p>
                  {activeState !== 'raw' && rawState?.texture && rawState.texture !== st.texture && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {rawState.texture} → {st.texture}
                    </p>
                  )}
                </div>
              )}
              {st.shelf_life_hours != null && (
                <div className="rounded-xl sm:rounded-2xl border border-border/50 p-3 sm:p-5 text-center">
                  <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    {t4(locale, 'Shelf Life', 'Срок хранения', 'Trwałość', 'Термін зберігання')}
                  </p>
                  <p className="text-base sm:text-lg font-black text-foreground">
                    🕐 {st.shelf_life_hours >= 24
                      ? `${Math.round(st.shelf_life_hours / 24)} ${t4(locale, 'days', 'дней', 'dni', 'днів')}`
                      : `${st.shelf_life_hours} ${t4(locale, 'hours', 'часов', 'godzin', 'годин')}`}
                  </p>
                  {activeState !== 'raw' && rawState?.shelf_life_hours != null && rawState.shelf_life_hours !== st.shelf_life_hours && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      raw: {rawState.shelf_life_hours >= 24
                        ? `${Math.round(rawState.shelf_life_hours / 24)}d`
                        : `${rawState.shelf_life_hours}h`}
                    </p>
                  )}
                </div>
              )}
              {st.storage_temp_c != null && (
                <div className="rounded-xl sm:rounded-2xl border border-border/50 p-3 sm:p-5 text-center">
                  <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    {t4(locale, 'Storage Temp', 'Температура', 'Temperatura', 'Температура')}
                  </p>
                  <p className="text-base sm:text-lg font-black text-foreground">
                    🌡️ {st.storage_temp_c}°C
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Notes ── */}
          {localNotes(stateData, locale) && (
            <div className="rounded-xl sm:rounded-2xl border border-border/50 p-3 sm:p-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                📝 {t4(locale, 'Notes', 'Заметки', 'Notatki', 'Нотатки')}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {localNotes(stateData, locale)}
              </p>
            </div>
          )}

          {/* ── Data Quality ── */}
          {stateData.data_score != null && (
            <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-muted-foreground/60">
              <span>{t4(locale, 'Data quality', 'Качество данных', 'Jakość danych', 'Якість даних')}:</span>
              <div className="flex-1 max-w-32 bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${stateData.data_score >= 80 ? 'bg-green-500' : stateData.data_score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${stateData.data_score}%` }}
                />
              </div>
              <span className="font-bold">{stateData.data_score.toFixed(0)}%</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
