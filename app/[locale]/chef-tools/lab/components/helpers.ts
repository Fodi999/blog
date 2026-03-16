import { UNIT_LABELS } from "./types";

export function localizedName(
  item: { name_en?: string; name_ru?: string; name_pl?: string; name_uk?: string; slug?: string },
  locale: string,
): string {
  const map: Record<string, string | undefined> = { en: item.name_en, ru: item.name_ru, pl: item.name_pl, uk: item.name_uk };
  return map[locale] || item.name_en || item.slug || "";
}

export function scoreColor(s?: number) {
  if (!s) return "text-muted-foreground";
  if (s >= 8) return "text-green-500";
  if (s >= 6) return "text-amber-500";
  return "text-muted-foreground";
}

export function scoreStars(s?: number) {
  const v = s || 0;
  if (v >= 9) return "★★★★★";
  if (v >= 7) return "★★★★";
  if (v >= 5) return "★★★";
  if (v >= 3) return "★★";
  return "★";
}

export function unitLabel(code: string, locale: string) {
  return UNIT_LABELS[code]?.[locale] ?? UNIT_LABELS[code]?.en ?? code;
}
