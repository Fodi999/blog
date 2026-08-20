"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const switchVariants = cva(
  "peer group/switch inline-flex shrink-0 items-center rounded-full border shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-transparent focus-visible:border-ring focus-visible:ring-ring/50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-input/80",
        brand:
          "border-hairline-ink-strong bg-ink-3 p-[3px] focus-visible:ring-gold/50 data-[state=checked]:border-gold data-[state=checked]:bg-gold/18",
      },
      size: {
        default: "h-[1.15rem] w-8",
        sm: "h-3.5 w-6",
        brand: "h-8 w-[58px]",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

const switchThumbVariants = cva(
  "pointer-events-none block rounded-full ring-0 transition-transform",
  {
    variants: {
      variant: {
        default: "bg-background dark:data-[state=checked]:bg-primary-foreground dark:data-[state=unchecked]:bg-foreground",
        brand: "bg-on-ink-muted transition-colors duration-hover ease-premium data-[state=checked]:bg-gold",
      },
      size: {
        default: "size-4 data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0",
        sm: "size-3 data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0",
        brand: "size-6 data-[state=checked]:translate-x-[25px] data-[state=unchecked]:translate-x-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

function Switch({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & VariantProps<typeof switchVariants>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(switchVariants({ variant, size }), className)}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(switchThumbVariants({ variant, size }))}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
