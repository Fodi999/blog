import latticeJson from '@/data/lattices.json';
import profileJson from '@/data/print-profiles.json';
import sampleData from '@/data/lattice-samples.json';

/* The Monge lattice library on the site: the passport of a lattice cell (by kind and wall) and the print profiles its
   numbers are compared with. Both come from Monge's kernel (scripts/lattices/import_engine.py): the passports from
   geometry_engine::sdf::passport, the profiles from geometry_engine::print_profiles — every limit a named source's
   number with its material and conditions, each confirmed at its source on the day its basis names.

   The rules the page keeps (the user's):
   1. no verdict without a cell size in mm — without it, only the dimensionless passport;
   2. every limit shows its source, the material, the process and the source's conditions;
   3. every verdict carries the fixed notes: the skin over the lattice is not checked; a good cell is not a good part;
   4. missing data is UNKNOWN, never ok; no promise words — a verdict is "within the profile" or not;
   5. demonstration data says so: on the page and on every table and criterion made from it.
   No threshold lives in this file: every limit comes from a profile. */

// ── the data contract ──

export type Lang = 'en' | 'pl' | 'ru';
export type Family = 'sheet' | 'net' | 'struts';
/** what the wall of a kind is: a sheet's thickness, a network's neck diameter, a strut's diameter */
export type WallMeaning = 'sheet' | 'neck' | 'strut';
export const BUILD_NAMES = ['[001]', '[011]', '[111]'] as const;
/** the cell's axis the part grows along: [001] — the cell stands on a face, [011] — on an edge, [111] — on a corner */
export type BuildName = (typeof BUILD_NAMES)[number];

/** The cell printed along one direction. Angles are degrees from the build plate. */
export type Build = {
  name: BuildName;
  /** the flattest down-facing surface or strut, degrees from the plate (0 — something faces straight down) */
  min_slope: number;
  /** [deg, share]: the share of the cell's surface that faces down flatter than deg, for deg = 20, 25 … 60 */
  below: [number, number][];
  /** [layer, reach]: the layer as a share of the cell (λ = layer mm / cell mm) and the farthest the material a layer
   *  adds over nothing lies, across the layer, from the material of the layer under it, in cells — a bridge's half
   *  span, a ledge's width, a slope's λ·cot θ, a round crown's √(2Rλ); null — no material at all under it */
  reach: [number, number | null][];
  /** regions that start in the air (no material under them) */
  starts: number;
};

/** The passport of one wall. Lengths are in cells (× the cell size = mm). */
export type Row = {
  /** wall / cell */
  tau: number;
  /** material volume / cell volume, 0..1 */
  share: number;
  /** separate labyrinths of void running through the lattice */
  voids: number;
  /** separate pieces of material (1 — the lattice holds together) */
  pieces: number;
  /** each labyrinth's narrowest passage: the largest ball that passes through it, in cells */
  channels: number[];
  /** the narrowest of `channels`, in cells */
  channel: number;
  /** the thinnest material: the largest ball that passes along the material, in cells */
  ligament: number;
  /** material surface / cell volume × cell (dimensionless) */
  area: number;
  builds: Build[];
  /** set by rowAt when the row is interpolated: the two passport walls it lies between (not in the data) */
  between?: [number, number];
};

export type LatticeKind = {
  kind: string;
  family: Family;
  names: Record<Lang, string>;
  wall_meaning: WallMeaning;
  /** the wall range the rows cover, as wall / cell */
  tau_min: number;
  tau_max: number;
  /** sorted by tau; the first at tau_min, the last at tau_max */
  rows: Row[];
};

export type LatticeData = {
  /** true — placeholders: say so wherever the numbers are shown */
  demo: boolean;
  /** when the kernel made the file ("demo" for placeholders) */
  generated: string;
  /** the Monge version that computed it; null — not computed by Monge */
  monge: string | null;
  note?: string;
  /** the layers (as a share of the cell) every build's reach is given at */
  layers?: number[];
  kinds: LatticeKind[];
};

export const LIMIT_KEYS = ['angle', 'angle_strut', 'span', 'ledge', 'wall', 'strut', 'channel', 'drain', 'drains', 'gap', 'layer'] as const;
/** angle — the least self-supporting angle of a down-facing surface; angle_strut — of a thin strut; span — the longest
 *  unsupported bridge between two supports; ledge — the longest ledge off one support; wall, strut — the thinnest;
 *  channel — the narrowest passage powder or resin leaves by; drain — the smallest escape hole; drains — escape holes
 *  per cavity; gap — the smallest gap between features; layer — a typical layer */
export type LimitKey = (typeof LIMIT_KEYS)[number];

/** One named source's number for one meaning. */
export type Limit = {
  key: LimitKey;
  value: number;
  unit: 'deg' | 'mm' | 'count';
  source_title: string;
  source_url: string;
  /** the source's words, opening with what kind of source it is */
  basis: string;
  /** the material the source gives the number for, as the source names it */
  material: string;
  /** what the source states it holds for: machine, layer, resolution, feature */
  conditions: string;
  /** what other sources give for the same thing */
  range: string;
};

export type SourceRef = { title: string; url: string; basis: string };

/** the ISO/ASTM process category as the kernel's table names it, e.g. "PBF-LB/M", "VPP (SLA/DLP)" */
export type Process = string;

export type Profile = {
  id: string;
  title: Record<Lang, string>;
  process: Process;
  /** null — no single material: each limit's conditions name its own */
  material: string | null;
  /** the process needs supports under overhangs */
  supports: boolean;
  /** unprinted material (powder, resin) stays in closed voids */
  trapped: boolean;
  /** no source — no row: a key is left out when no source gives it */
  limits: Limit[];
  /** optional: where the "no supports" of a process comes from */
  supports_source?: SourceRef;
  note?: Record<Lang, string>;
};

export type ProfileData = { demo: boolean; verified: boolean; checked?: string[]; note?: string; profiles: Profile[] };

// ── the data ──

export const latticeSet = latticeJson as unknown as LatticeData;
export const profileSet = profileJson as unknown as ProfileData;
export const lattices: LatticeKind[] = latticeSet.kinds;
export const profiles: Profile[] = profileSet.profiles;
/** any of the two files is demonstration data */
export const isDemo = latticeSet.demo || profileSet.demo;
/** the section was looked at by the user and published: search engines may index it (robots and the sitemap read
 *  this one flag, so they never disagree) */
export const REVIEWED = true;
export const indexable = !isDemo && REVIEWED;
export const FAMILIES: Family[] = ['sheet', 'net', 'struts'];

export const latticeOf = (kind: string): LatticeKind | undefined => lattices.find((k) => k.kind === kind);
export const profileOf = (id: string): Profile | undefined => profiles.find((p) => p.id === id);
export const limitOf = (profile: Profile, key: LimitKey): Limit | undefined => profile.limits.find((l) => l.key === key);

// ── pure functions: they take everything they use as arguments (no data of their own), so they are easy to test ──

const EPS = 1e-9;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const near = (a: number, b: number) => Math.abs(a - b) <= EPS;

/** The wall the kind takes: τ held to [tau_min, tau_max]; `clamped` says which end held it. */
export function clampTau(kind: LatticeKind, tau: number): { tau: number; clamped: 'low' | 'high' | null } {
  if (tau < kind.tau_min - EPS) return { tau: kind.tau_min, clamped: 'low' };
  if (tau > kind.tau_max + EPS) return { tau: kind.tau_max, clamped: 'high' };
  return { tau, clamped: null };
}

function lerpBuild(a: Build, b: Build, t: number): Build {
  return {
    name: a.name,
    min_slope: lerp(a.min_slope, b.min_slope, t),
    below: a.below.flatMap(([deg, s]): [number, number][] => {
      const o = b.below.find(([d]) => near(d, deg));
      return o ? [[deg, lerp(s, o[1], t)]] : [];
    }),
    // the larger of the two rows', not a line between them: the reach of a lattice can jump between two walls (a dip
    // of the surface that starts in the air appears at some wall between them), and where is not known; no material
    // under it at either end — none between them
    reach: a.reach.flatMap(([lam, r]): [number, number | null][] => {
      const o = b.reach.find(([l]) => near(l, lam));
      if (!o) return [];
      return [[lam, r === null || o[1] === null ? null : Math.max(r, o[1])]];
    }),
    // counts do not interpolate: the larger of the two (the worse)
    starts: Math.max(a.starts, b.starts),
  };
}

function lerpRow(a: Row, b: Row, t: number, tau: number): Row {
  const channel = lerp(a.channel, b.channel, t);
  return {
    tau,
    share: lerp(a.share, b.share, t),
    voids: Math.max(a.voids, b.voids),
    pieces: Math.max(a.pieces, b.pieces),
    // when the labyrinths change between the rows, only the narrowest channel is known
    channels: a.channels.length === b.channels.length ? a.channels.map((c, i) => lerp(c, b.channels[i], t)) : [channel],
    channel,
    ligament: lerp(a.ligament, b.ligament, t),
    area: lerp(a.area, b.area, t),
    builds: a.builds.flatMap((x) => {
      const y = b.builds.find((z) => z.name === x.name);
      return y ? [lerpBuild(x, y, t)] : [];
    }),
    between: [a.tau, b.tau],
  };
}

/** The passport at wall τ: the row itself when τ is a row's, else linear between the two rows around it — the counts
 *  and the reach take the worse of the two, a missing support stays missing. null — τ is outside the rows: no data,
 *  never a guess. */
export function rowAt(kind: LatticeKind, tau: number): Row | null {
  if (!Number.isFinite(tau)) return null;
  const rows = [...kind.rows].sort((x, y) => x.tau - y.tau);
  const exact = rows.find((r) => near(r.tau, tau));
  if (exact) return exact;
  for (let i = 0; i + 1 < rows.length; i++) {
    const a = rows[i];
    const b = rows[i + 1];
    if (tau > a.tau && tau < b.tau) return lerpRow(a, b, (tau - a.tau) / (b.tau - a.tau), tau);
  }
  return null;
}

/** The reach at a layer λ (a share of the cell), in cells. Between two layers of the passport — on the line through
 *  their logarithms (exact for a power law: a flat ceiling's reach is constant, a crown's grows as √λ, a slope's as λ);
 *  outside the passport's layers — not found: the reach mostly grows with the layer, but not always (under a dome
 *  whose walls lean in, a deeper layer holds material nearer), so neither end is a bound. `cells` null — no material
 *  under it. */
export function reachAt(build: Build, lambda: number): { found: boolean; cells: number | null } {
  const rows = [...build.reach].sort((a, b) => a[0] - b[0]);
  if (!rows.length || !(lambda > 0) || lambda > rows[rows.length - 1][0] * (1 + EPS) || lambda < rows[0][0] * (1 - EPS)) return { found: false, cells: null };
  for (let i = 0; i + 1 < rows.length; i++) {
    const [la, ra] = rows[i];
    const [lb, rb] = rows[i + 1];
    if (lambda < la || lambda > lb) continue;
    if (ra === null || rb === null) return { found: true, cells: null };
    if (ra <= 0 || rb <= 0) return { found: true, cells: lerp(ra, rb, (lambda - la) / (lb - la)) };
    const t = Math.log(lambda / la) / Math.log(lb / la);
    return { found: true, cells: Math.exp(lerp(Math.log(ra), Math.log(rb), t)) };
  }
  return { found: false, cells: null };
}

/** The thickest and the thinnest layer, as a share of the cell, the build has the reach for (0 — none). */
export const mostLayer = (build: Build) => build.reach.reduce((m, [l]) => Math.max(m, l), 0);
export const leastLayer = (build: Build) => (build.reach.length ? build.reach.reduce((m, [l]) => Math.min(m, l), Infinity) : 0);

export function buildOf(row: Row, name: BuildName): Build | null {
  return row.builds.find((b) => b.name === name) ?? null;
}

export type Status = 'ok' | 'fail' | 'unknown';
export type Overall = 'within' | 'outside' | 'unknown';
/** wall — a sheet's thickness; neck — a network's neck; strut — a strut's diameter */
export type CriterionKey = 'wall' | 'neck' | 'strut' | 'channel' | 'overhang' | 'strut_angle' | 'starts';
export type WhyCode =
  | 'thick_enough'
  | 'too_thin'
  | 'wide_enough'
  | 'too_narrow'
  | 'no_limit'
  | 'no_supports'
  | 'layer_beyond'
  | 'layer_thinner'
  | 'reach_partial'
  | 'nothing_hangs'
  | 'unsupported'
  | 'reach_ok'
  | 'reach_fail'
  | 'reach_between'
  | 'steep_enough'
  | 'too_flat'
  | 'no_starts'
  | 'starts';
export type Quantity = { value: number; unit: 'mm' | 'deg' | 'count' };

export type Criterion = {
  key: CriterionKey;
  /** what the cell has, in mm, degrees or a count; null — nothing to measure */
  measured: Quantity | null;
  /** the profile's limits it was compared with, each with its source */
  limits: Limit[];
  /** the limits it needs that the profile does not have (no source — no number) */
  missing: LimitKey[];
  status: Status;
  /** why: a code the page turns into words, with the numbers it names */
  why: WhyCode;
  values: Record<string, Quantity>;
  /** for no_supports: where the profile's "no supports" comes from */
  source?: SourceRef;
};

export type Verdict = { criteria: Criterion[]; overall: Overall };
/** The share of the cell's surface that faces down flatter than the profile's angle — shown, not judged: the angle is
 *  written for a part's surfaces, and no source gives a limit on such area in a lattice (the overhang is judged by the
 *  reach in layers). share null — the passport has no share at that angle. */
export type Downskin = { angle: Limit; share: number | null };
export type Evaluation = { tau: number; row: Row | null; build: Build | null; best: BuildName | null; verdict: Verdict | null; downskin: Downskin | null };

const mm = (value: number): Quantity => ({ value, unit: 'mm' });
const deg = (value: number): Quantity => ({ value, unit: 'deg' });
const asQuantity = (l: Limit): Quantity => ({ value: l.value, unit: l.unit });

function noLimit(key: CriterionKey, measured: Quantity | null, missing: LimitKey[], limits: Limit[] = []): Criterion {
  return { key, measured, limits, missing, status: 'unknown', why: 'no_limit', values: {} };
}

function noSupports(key: CriterionKey, measured: Quantity | null, profile: Profile): Criterion {
  return { key, measured, limits: [], missing: [], status: 'ok', why: 'no_supports', values: {}, source: profile.supports_source };
}

/** The wall against the profile: a sheet against "wall", a network's neck and a strut against "strut". */
export function wallCriterion(kind: LatticeKind, tau: number, cellMm: number, profile: Profile): Criterion {
  const key: CriterionKey = kind.family === 'sheet' ? 'wall' : kind.family === 'net' ? 'neck' : 'strut';
  const measured = mm(tau * cellMm);
  const limit = limitOf(profile, kind.family === 'sheet' ? 'wall' : 'strut');
  if (!limit) return noLimit(key, measured, [kind.family === 'sheet' ? 'wall' : 'strut']);
  const ok = measured.value >= limit.value - EPS;
  return { key, measured, limits: [limit], missing: [], status: ok ? 'ok' : 'fail', why: ok ? 'thick_enough' : 'too_thin', values: { measured, limit: asQuantity(limit) } };
}

/** The narrowest channel against "channel" — for a process that leaves powder or resin in the voids. */
export function channelCriterion(row: Row, cellMm: number, profile: Profile): Criterion {
  const measured = mm(row.channel * cellMm);
  const limit = limitOf(profile, 'channel');
  if (!limit) return noLimit('channel', measured, ['channel']);
  const ok = measured.value >= limit.value - EPS;
  return { key: 'channel', measured, limits: [limit], missing: [], status: ok ? 'ok' : 'fail', why: ok ? 'wide_enough' : 'too_narrow', values: { measured, limit: asQuantity(limit) } };
}

/** The reach in layers against the profile's ledge L and bridge span S: the passport's reach at the profile's layer
 *  over the cell (λ = layer / cell), in mm. Whether the farthest material is a bridge (reach = half the span) or a
 *  ledge (reach = its width) the passport does not tell, so: ok when the reach fits both (≤ min(L, S/2)), fail when it
 *  fits neither (> max(L, S/2)), unknown between. The reach is Monge's own measure of the geometry; the limits are the
 *  sources'. */
export function overhangCriterion(build: Build, cellMm: number, profile: Profile): Criterion {
  if (!profile.supports) return noSupports('overhang', null, profile);
  const layer = limitOf(profile, 'layer');
  if (!layer) return noLimit('overhang', null, ['layer']);
  const lambda = layer.value / cellMm;
  const r = reachAt(build, lambda);
  if (!r.found) {
    // a layer finer than the passport's finest at this cell (a big cell), or coarser than its coarsest (a small one)
    return lambda < leastLayer(build)
      ? { key: 'overhang', measured: null, limits: [layer], missing: [], status: 'unknown', why: 'layer_thinner', values: { layer: mm(layer.value), least: mm(leastLayer(build) * cellMm) } }
      : { key: 'overhang', measured: null, limits: [layer], missing: [], status: 'unknown', why: 'layer_beyond', values: { layer: mm(layer.value), most: mm(mostLayer(build) * cellMm) } };
  }
  if (r.cells === null) return { key: 'overhang', measured: null, limits: [layer], missing: [], status: 'fail', why: 'unsupported', values: { layer: mm(layer.value) } };
  const measured = mm(r.cells * cellMm);
  if (measured.value <= EPS) return { key: 'overhang', measured, limits: [layer], missing: [], status: 'ok', why: 'nothing_hangs', values: { layer: mm(layer.value) } };
  const ledge = limitOf(profile, 'ledge');
  const span = limitOf(profile, 'span');
  const present = [layer, ledge, span].filter((l): l is Limit => !!l);
  if (!ledge || !span) {
    const missing = [...(ledge ? [] : (['ledge'] as LimitKey[])), ...(span ? [] : (['span'] as LimitKey[]))];
    // one of the pair is there: the reach is measured, but whether it fits cannot be decided without the other
    if (ledge || span) return { key: 'overhang', measured, limits: present, missing, status: 'unknown', why: 'reach_partial', values: { measured, layer: mm(layer.value), ...(ledge ? { ledge: mm(ledge.value) } : {}), ...(span ? { half: mm(span.value / 2) } : {}) } };
    return noLimit('overhang', measured, missing, present);
  }
  const half = span.value / 2;
  const values = { measured, layer: mm(layer.value), ledge: mm(ledge.value), half: mm(half) };
  if (measured.value <= Math.min(ledge.value, half) + EPS) return { key: 'overhang', measured, limits: present, missing: [], status: 'ok', why: 'reach_ok', values };
  if (measured.value > Math.max(ledge.value, half) + EPS) return { key: 'overhang', measured, limits: present, missing: [], status: 'fail', why: 'reach_fail', values };
  return { key: 'overhang', measured, limits: present, missing: [], status: 'unknown', why: 'reach_between', values };
}

/** The flattest strut against "angle_strut" (strut kinds only). */
export function strutAngleCriterion(build: Build, profile: Profile): Criterion {
  const measured = deg(build.min_slope);
  if (!profile.supports) return noSupports('strut_angle', measured, profile);
  const limit = limitOf(profile, 'angle_strut');
  if (!limit) return noLimit('strut_angle', measured, ['angle_strut']);
  const ok = measured.value >= limit.value - EPS;
  return { key: 'strut_angle', measured, limits: [limit], missing: [], status: ok ? 'ok' : 'fail', why: ok ? 'steep_enough' : 'too_flat', values: { measured, limit: asQuantity(limit) } };
}

/** Regions that start in the air need supports in a process that has them. */
export function startsCriterion(build: Build, profile: Profile): Criterion {
  const measured: Quantity = { value: build.starts, unit: 'count' };
  if (build.starts <= 0) return { key: 'starts', measured, limits: [], missing: [], status: 'ok', why: 'no_starts', values: {} };
  if (!profile.supports) return noSupports('starts', measured, profile);
  return { key: 'starts', measured, limits: [], missing: [], status: 'fail', why: 'starts', values: { n: measured } };
}

/** outside — any criterion fails; unknown — none fails but one lacks data; within — every one is within. */
export function overallOf(criteria: Criterion[]): Overall {
  if (criteria.some((c) => c.status === 'fail')) return 'outside';
  if (criteria.some((c) => c.status === 'unknown')) return 'unknown';
  return 'within';
}

export function downskinOf(build: Build, profile: Profile): Downskin | null {
  const angle = profile.supports ? limitOf(profile, 'angle') : undefined;
  if (!angle) return null;
  const b = build.below.find(([d]) => near(d, angle.value));
  return { angle, share: b ? b[1] : null };
}

/** The criteria of one build direction. */
export function criteriaOf(kind: LatticeKind, row: Row, build: Build, cellMm: number, profile: Profile): Criterion[] {
  const criteria: Criterion[] = [wallCriterion(kind, row.tau, cellMm, profile)];
  if (profile.trapped) criteria.push(channelCriterion(row, cellMm, profile));
  criteria.push(overhangCriterion(build, cellMm, profile));
  if (kind.family === 'struts') criteria.push(strutAngleCriterion(build, profile));
  criteria.push(startsCriterion(build, profile));
  return criteria;
}

const RANK: Record<Overall, number> = { within: 0, unknown: 1, outside: 2 };

/** The direction to print along, with a cell and a profile: the best verdict (within, then unknown, then outside), then
 *  the shorter reach at the profile's layer, then the steeper flattest surface, then the first. Without a cell no
 *  direction is better than another by the profile: null. */
export function bestBuild(kind: LatticeKind, row: Row, cellMm: number | null, profile: Profile): Build | null {
  if (cellMm === null || !Number.isFinite(cellMm) || cellMm <= 0) return null;
  const layer = profile.supports ? limitOf(profile, 'layer') : undefined;
  // (in a process without supports the reach decides nothing: every direction ties on it, [001] stays first)
  const reach = (b: Build) => {
    if (!profile.supports) return 0;
    const r = layer ? reachAt(b, layer.value / cellMm) : { found: false, cells: null };
    return r.found && r.cells !== null ? r.cells : Infinity;
  };
  let best: { b: Build; rank: number; reach: number } | null = null;
  for (const b of row.builds) {
    const x = { b, rank: RANK[overallOf(criteriaOf(kind, row, b, cellMm, profile))], reach: reach(b) };
    const better =
      !best ||
      x.rank < best.rank ||
      (x.rank === best.rank && (x.reach < best.reach - EPS || (near(x.reach, best.reach) && profile.supports && b.min_slope > best.b.min_slope + EPS)));
    if (better) best = x;
  }
  return best?.b ?? null;
}

/** The cell of `kind` at wall τ, printed by `profile` along `buildName` (default: the best direction for the cell and
 *  the profile; without a cell — [001], the cell standing on a face). No cell size — no verdict: only the
 *  dimensionless passport (`row`, `build`). */
export function evaluate(kind: LatticeKind, tau: number, cellMm: number | null, profile: Profile, buildName?: BuildName): Evaluation {
  const row = rowAt(kind, tau);
  const best = row ? bestBuild(kind, row, cellMm, profile) : null;
  const build = row ? (buildName ? buildOf(row, buildName) : (best ?? buildOf(row, '[001]'))) : null;
  const downskin = build ? downskinOf(build, profile) : null;
  if (!row || !build || cellMm === null || !Number.isFinite(cellMm) || cellMm <= 0) return { tau, row, build, best: best?.name ?? null, verdict: null, downskin };
  const criteria = criteriaOf(kind, row, build, cellMm, profile);
  return { tau, row, build, best: best?.name ?? null, verdict: { criteria, overall: overallOf(criteria) }, downskin };
}

// ── real sample cubes made by Monge (data/lattice-samples.json — NOT demo: real geometry, measured by Monge) ──

export type SampleFile = { format: 'stl' | '3mf' | 'glb'; key: string; bytes: number; sha256: string };
export type Sample = {
  kind: string; cube_mm: number; cell_mm: number; fit: boolean; wall_mm: number; shell_mm: number; share: number;
  volume_cm3: number; box_cm3: number; triangles: number; pieces: number; render: string; files: SampleFile[];
};
export const sampleSet = sampleData as { demo: boolean; made_by: string; made: string; note: string; version: string; samples: Sample[] };
export const sampleOf = (kind: string): Sample | undefined => sampleSet.samples.find((x) => x.kind === kind);
