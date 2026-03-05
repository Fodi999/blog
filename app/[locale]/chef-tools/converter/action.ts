'use server';

import { fetchConvert, fetchUnits, type ApiUnitsResult } from '@/lib/api';

export type ConvertResult = {
  result: number;
  fromLabel: string;
  toLabel: string;
};

export async function convertUnits(
  value: number,
  from: string,
  to: string,
  lang: string,
): Promise<ConvertResult | null> {
  const data = await fetchConvert(value, from, to, lang);
  if (!data || !data.supported) return null;
  return {
    result: data.result,
    fromLabel: data.from_label,
    toLabel: data.to_label,
  };
}

export async function getUnits(lang: string): Promise<ApiUnitsResult | null> {
  return fetchUnits(lang);
}

