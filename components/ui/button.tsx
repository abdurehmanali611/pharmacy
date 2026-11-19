import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 motion-safe:transition-[transform,background-color,box-shadow,border-color] motion-safe:duration-200 active:not-aria-[haspopup]:translate-y-px active:not-aria-[haspopup]:scale-[0.99] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-white/30 bg-[linear-gradient(120deg,#7c3aed_0%,#c026d3_50%,#f43f5e_100%)] bg-[length:150%_100%] bg-left text-white shadow-[0_8px_20px_-10px_rgba(192,38,211,0.55)] hover:-translate-y-0.5 hover:bg-right hover:shadow-[0_12px_26px_-12px_rgba(244,63,94,0.5)]",
        outline:
          "border-violet-400/45 bg-violet-500/10 text-violet-50 backdrop-blur-sm hover:border-fuchsia-400/80 hover:bg-fuchsia-500/18 hover:text-white aria-expanded:bg-fuchsia-500/20 aria-expanded:text-white",
        secondary:
          "border-cyan-300/40 bg-[linear-gradient(135deg,rgba(34,211,238,0.28),rgba(168,85,247,0.28))] text-cyan-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] hover:-translate-y-0.5 hover:border-cyan-200/80 hover:shadow-[0_10px_24px_-12px_rgba(34,211,238,0.5)] aria-expanded:text-white",
        ghost:
          "text-violet-100 hover:bg-violet-500/20 hover:text-white aria-expanded:bg-violet-500/20 aria-expanded:text-white",
        destructive:
          "border-rose-400/40 bg-rose-500/15 text-rose-200 hover:-translate-y-0.5 hover:bg-rose-500/28 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-10 gap-1.5 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-2 px-5 text-[0.95rem] has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-10",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }), "!rounded-[0.7rem] cursor-pointer")}
      {...props}
    />
  )
}

export { Button, buttonVariants }
