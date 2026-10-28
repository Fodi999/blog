import type { Locale } from '@/lib/i18n';

/* The state of Monge as the site tells it. One place: after a check of the program
   (./tools/check_kernel.sh in the Monge repository) update the numbers here and every page follows.
   Texts around the numbers live in lib/dict/*. */
export const status = {
  /** The newest build of the program and its date (the app's «Что нового»). */
  version: '0.15.20',
  versionDate: '2026-10-27',
  /** When the numbers below were taken. */
  checked: '2026-10-28',
  /** The full kernel check: every test of the kernel, the document, materials and saved failures. */
  tests: { passed: 1130, failed: 0, seconds: 112 },
  /** Kernel failures saved from real work: fixed ones are replayed on every check; open ones wait. */
  cases: { fixed: 173, open: 76, openRounding: 55, openBoolean: 19 },
  /** Lines of Rust in the kernel (geometry_engine/src), rounded. */
  kernelLines: 92_000,
  /** The machine every number was measured on. */
  machine: { name: 'MacBook Air M4', ramGb: 24 },
  /** The kernel exam the benchmark table comes from. */
  exam: '2026-10-25',
} as const;

export type BenchId = 'faces' | 'stitch' | 'skin' | 'history' | 'step' | 'wheel' | 'ai' | 'chamfer';

export type Bench = {
  id: BenchId;
  ok: boolean;
  /** Seconds. Several values are shown joined: "range" 1.8–2.1, "plus" 0.47 + 0.50, "slash" 0.67 / 0.68. */
  time?: number[];
  join?: 'range' | 'plus' | 'slash';
  /** Peak memory, MB. */
  memory?: number;
};

/** Kernel exam of 25.10.2026 (docs/EXAM_KERNEL_2026-10-25.md, with the repeats after the fixes) and the wheel work. */
export const benchmarks: Bench[] = [
  { id: 'faces', ok: true, time: [0.674, 0.681], join: 'slash', memory: 674 },
  { id: 'stitch', ok: true, time: [0.47, 0.5], join: 'plus', memory: 142 },
  { id: 'skin', ok: true, time: [1.8, 2.1], join: 'range' },
  { id: 'history', ok: true, time: [0.067] },
  { id: 'step', ok: true },
  { id: 'wheel', ok: true, time: [0.2, 0.7], join: 'range' },
  { id: 'ai', ok: true },
  { id: 'chamfer', ok: false },
];

const units: Record<Locale, { ms: string; s: string; mb: string }> = {
  ru: { ms: 'мс', s: 'с', mb: 'МБ' },
  pl: { ms: 'ms', s: 's', mb: 'MB' },
  en: { ms: 'ms', s: 's', mb: 'MB' },
};

export function fmtNum(locale: Locale, n: number, digits = 0): string {
  return new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
}

/** 0.674 → "674 мс"; [1.8, 2.1] range → "1,8–2,1 с". Milliseconds when every value is under a second. */
export function fmtTime(locale: Locale, b: Bench): string {
  if (!b.time?.length) return '—';
  const u = units[locale];
  const ms = b.time.every((t) => t < 1);
  const one = (t: number) => (ms ? fmtNum(locale, Math.round(t * 1000)) : fmtNum(locale, t, 1));
  const sep = b.join === 'plus' ? ' + ' : b.join === 'slash' ? ' / ' : '–';
  return `${b.time.map(one).join(sep)} ${ms ? u.ms : u.s}`;
}

export function fmtMemory(locale: Locale, mb?: number): string {
  return mb ? `${fmtNum(locale, mb)} ${units[locale].mb}` : '—';
}

/** Plural form for the counts the site shows (Russian and Polish have three). */
export function plural(locale: Locale, n: number, forms: { one: string; few: string; many: string }): string {
  const rule = new Intl.PluralRules(locale).select(n);
  return rule === 'one' ? forms.one : rule === 'few' ? forms.few : forms.many;
}

/** 27.10.2026 for pl / ru (as on a drawing), 27 Oct 2026 for en. */
export function dateShort(locale: Locale, iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  if (locale === 'en') return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(d);
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(d);
}
