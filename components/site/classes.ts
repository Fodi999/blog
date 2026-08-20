export const eyebrowClass = 'm-0 font-sans text-xs font-bold tracking-[.18em] uppercase text-gold';

/**
 * Solid-color heading treatment (no gradient/shimmer — the 2026 redesign
 * deliberately drops that). Kept as a plain string so existing call sites that
 * compose it into a template literal keep working unchanged.
 */
export const gradientHeadingClass = 'animate-reveal text-on-bone';
export const gradientHeadingDarkClass = 'animate-reveal text-on-ink';

export const mediaFrameClass =
  'relative mb-[22px] aspect-[4/5] overflow-hidden bg-ink-2';

export const mediaOverlayClass = 'pointer-events-none absolute inset-0 opacity-0';

export const mediaImageClass =
  'size-full object-cover object-center transition-transform duration-reveal ease-premium group-hover:scale-[1.04]';

export const sectionClass = 'content-frame relative py-24 md:py-32 lg:py-36';

/** Radial per-section glow is retired — kept as a harmless no-op so old call sites don't break. */
export const sectionGlowClass = 'hidden';

export const sectionHeadingWrapClass = 'mb-12 grid animate-reveal grid-cols-[1fr_auto] items-end gap-x-10 gap-y-3 md:mb-16 max-[900px]:grid-cols-1';

export function sectionHeadingH2Class(_isCyrillic: boolean, dark = false) {
  const color = dark ? 'text-on-ink' : 'text-on-bone';
  return `animate-reveal m-0 font-display text-[clamp(30px,4.2vw,58px)] font-medium leading-[1.05] tracking-[-0.01em] ${color}`;
}
