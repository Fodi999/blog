import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Premium hover = lift + border/text/surface transition only. No shimmer sweep,
 * no gradient. `dark`/`outline-dark` are for use on light (bone) grounds,
 * `light`/`outline-light` for use on dark (ink) grounds.
 */
export const siteButtonVariants = cva(
  'inline-flex min-h-[52px] items-center justify-center gap-2 rounded-sm px-7 font-sans text-[13px] font-bold tracking-[.02em] uppercase transition-[transform,background-color,border-color,color,opacity] duration-hover ease-premium hover:-translate-y-0.5 active:translate-y-0 active:opacity-70',
  {
    variants: {
      variant: {
        dark: 'border border-ink bg-ink text-on-ink hover:border-gold hover:bg-gold hover:text-on-bone',
        light: 'border border-bone bg-bone text-on-bone hover:border-gold hover:bg-gold hover:text-on-bone',
        'outline-dark': 'border border-hairline-bone bg-transparent text-on-bone hover:border-gold hover:text-gold',
        'outline-light': 'border border-hairline-ink bg-transparent text-on-ink hover:border-gold hover:text-gold',
        'quiet-dark': 'gap-1.5 px-0 text-on-bone underline-offset-4 hover:text-gold hover:underline',
        'quiet-light': 'gap-1.5 px-0 text-on-ink underline-offset-4 hover:text-gold hover:underline',
      },
    },
    defaultVariants: { variant: 'dark' },
  },
);

export type SiteButtonVariant = VariantProps<typeof siteButtonVariants>['variant'];
