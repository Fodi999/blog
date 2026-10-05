import { cva, type VariantProps } from 'class-variance-authority';

/** Site buttons. `primary` = the one action of a section (signal lime); the rest stay quiet. */
export const siteButtonVariants = cva(
  'inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full px-6 font-sans text-[14px] font-semibold tracking-[-.005em] whitespace-nowrap transition-[transform,background-color,border-color,color,box-shadow,opacity] duration-hover ease-premium hover:-translate-y-0.5 active:translate-y-0 active:opacity-80 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-signal text-ink shadow-[0_0_0_1px_rgba(196,255,77,.4),0_10px_40px_-10px_rgba(196,255,77,.55)] hover:shadow-[0_0_0_1px_rgba(196,255,77,.7),0_14px_50px_-8px_rgba(196,255,77,.75)]',
        ghost: 'border border-hairline-ink-strong bg-white/[.03] text-on-ink hover:border-on-ink/50 hover:bg-white/[.07]',
        light: 'bg-on-ink text-ink hover:bg-signal',
        'outline-light': 'border border-hairline-ink-strong bg-transparent text-on-ink hover:border-signal hover:text-signal',
        'quiet-light': 'gap-1.5 px-0 text-on-ink underline-offset-4 hover:text-signal hover:underline',
      },
      size: {
        md: '',
        sm: 'min-h-[38px] px-4 text-[13px]',
        lg: 'min-h-[56px] px-8 text-[15px]',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export type SiteButtonVariant = VariantProps<typeof siteButtonVariants>['variant'];
