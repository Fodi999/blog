import { cva, type VariantProps } from 'class-variance-authority';

/** Site buttons. `primary` = the one action of a section (signal lime); the rest stay quiet. */
export const siteButtonVariants = cva(
  'inline-flex min-h-[46px] items-center justify-center gap-2 rounded-md px-5 font-sans text-[15px] font-semibold whitespace-nowrap transition-[background-color,border-color,color,opacity] duration-hover ease-premium active:opacity-80 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-signal text-ink hover:bg-[#d4ff7a]',
        ghost: 'border border-hairline-ink-strong text-on-ink hover:border-on-ink/60 hover:bg-white/[.05]',
        light: 'bg-on-ink text-ink hover:bg-signal',
        'outline-light': 'border border-hairline-ink-strong bg-transparent text-on-ink hover:border-signal hover:text-signal',
        'quiet-light': 'gap-1.5 px-0 text-on-ink underline-offset-4 hover:text-steel hover:underline',
      },
      size: {
        md: '',
        sm: 'min-h-[38px] px-3.5 text-[14px]',
        lg: 'min-h-[52px] px-6 text-[16px]',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export type SiteButtonVariant = VariantProps<typeof siteButtonVariants>['variant'];
