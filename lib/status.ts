import type { Locale } from '@/lib/i18n';

/* The state of Monge as the site tells it. One place: after a check of the program
   (./tools/check_kernel.sh in the Monge repository) update the numbers here and every page follows.
   Texts around the numbers live in lib/dict/*. */
export const status = {
  /** The newest build of the program and its date (the app's «Что нового»). */
  version: '0.15.197',
  versionDate: '2026-11-21',
  /** When the numbers below were taken. */
  checked: '2026-11-21',
  /** The full kernel check: every test of the kernel, the document, materials and saved failures. */
  tests: { passed: 1392, failed: 0, seconds: 205 },
  /** Kernel failures saved from real work: fixed ones are replayed on every check; open ones wait (the inbox of
      `python3 tools/cases.py`): fillets and chamfers, Booleans (boolean, subtract, perforate), everything else. */
  cases: { fixed: 251, open: 75, openRounding: 41, openBoolean: 19, openOther: 15 },
  /** Lines of Rust in the kernel (geometry_engine/src), rounded. */
  kernelLines: 115_000,
  /** The machine every number was measured on. */
  machine: { name: 'MacBook Air M4', ramGb: 24 },
  /** The kernel exams the first rows of the benchmark table come from (geometry_engine/tests/kernel_exam.rs). */
  exam: '2026-11-20',
  /** Kernel exam of 20.11.2026 on Monge 0.15.196: random pairs of bodies, fillets, shells, STEP. */
  booleans: { ops: 900, valid: 815, apart: 85, refused: 0, invalid: 0, wrong: 0 },
  fillets: { cases: 100, right: 98, refused: 2, wrong: 0, noBody: 25, correctRefusals: 25 },
} as const;

export type BenchGroup = 'exam' | 'models' | 'scenes';
export const benchGroups: BenchGroup[] = ['exam', 'models', 'scenes'];

export type BenchId =
  | 'booleans' | 'fillets' | 'refusals' | 'shells' | 'stepExam'
  | 'hull' | 'rebar' | 'shafts' | 'chamfer' | 'faces' | 'stitch' | 'skin' | 'history' | 'wheel' | 'mixer' | 'ai'
  | 'array' | 'photo' | 'project' | 'brush';

export type Bench = {
  id: BenchId;
  group: BenchGroup;
  ok: boolean;
  /** Seconds. Several values are shown joined: "range" 1.8–2.1, "plus" 0.47 + 0.50, "slash" 0.67 / 0.68. */
  time?: number[];
  join?: 'range' | 'plus' | 'slash';
  /** Peak memory, MB. */
  memory?: number;
  /** The Monge version it was measured on. */
  rev: string;
  /** New since the last update of the site. */
  fresh?: boolean;
};

/** 20.11.2026, Monge 0.15.196: the kernel exam (900 Boolean operations, 100 fillets and chamfers, 50 shells, 50 STEP
    round trips), the fillet exam (100 cases with an answer + 25 without one), the rocket hull (stage 2 of the pro
    tools plan), the ribbed bar, the shafts' random test (0.15.161), the plate chamfer (T1 of 25.10.2026, tried again).
    Older rows keep the version they were measured on (exam of 25.10.2026, the faucet 0.15.143, 100 000 bodies
    0.15.144, the brush of Monge Physics 0.15.145). */
export const benchmarks: Bench[] = [
  { id: 'booleans', group: 'exam', ok: true, time: [0.088, 0.227], join: 'range', rev: '0.15.196', fresh: true },
  { id: 'fillets', group: 'exam', ok: true, time: [5.3], rev: '0.15.196', fresh: true },
  { id: 'refusals', group: 'exam', ok: true, rev: '0.15.196', fresh: true },
  { id: 'shells', group: 'exam', ok: true, rev: '0.15.196', fresh: true },
  { id: 'stepExam', group: 'exam', ok: true, rev: '0.15.196', fresh: true },
  { id: 'chamfer', group: 'exam', ok: false, time: [0.62], rev: '0.15.196' },
  { id: 'hull', group: 'models', ok: true, time: [2.0], rev: '0.15.193', fresh: true },
  { id: 'rebar', group: 'models', ok: true, time: [1.2], rev: '0.15.195', fresh: true },
  { id: 'shafts', group: 'models', ok: true, time: [0.0038], rev: '0.15.161', fresh: true },
  { id: 'mixer', group: 'models', ok: true, rev: '0.15.143' },
  { id: 'faces', group: 'models', ok: true, time: [0.674, 0.681], join: 'slash', memory: 674, rev: '0.15.4' },
  { id: 'stitch', group: 'models', ok: true, time: [0.47, 0.5], join: 'plus', memory: 142, rev: '0.15.4' },
  { id: 'skin', group: 'models', ok: true, time: [1.8, 2.1], join: 'range', rev: '0.15.4' },
  { id: 'history', group: 'models', ok: true, time: [0.067], rev: '0.15.4' },
  { id: 'wheel', group: 'models', ok: true, time: [0.2, 0.7], join: 'range', rev: '0.15.20' },
  { id: 'ai', group: 'models', ok: true, rev: '0.15.4' },
  { id: 'array', group: 'scenes', ok: true, time: [0.36], memory: 900, rev: '0.15.144' },
  { id: 'photo', group: 'scenes', ok: true, time: [10], memory: 1700, rev: '0.15.144' },
  { id: 'project', group: 'scenes', ok: true, time: [3], rev: '0.15.144' },
  { id: 'brush', group: 'scenes', ok: true, time: [2.5], rev: '0.15.145' },
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
  const one = (t: number) => (ms ? fmtNum(locale, t * 1000, t < 0.01 ? 1 : 0) : fmtNum(locale, t, Number.isInteger(t) ? 0 : 1));
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
