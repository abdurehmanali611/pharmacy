import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default:
          "bg-[linear-gradient(120deg,#7c3aed,#d946ef)] text-white shadow-[0_4px_10px_-6px_rgba(217,70,239,0.6)] [a]:hover:brightness-110",
        secondary:
          "border-cyan-300/40 bg-[linear-gradient(120deg,rgba(34,211,238,0.26),rgba(168,85,247,0.26))] text-cyan-100 [a]:hover:brightness-110",
        destructive:
          "border-rose-400/45 bg-rose-500/18 text-rose-200 focus-visible:ring-rose-400/30 [a]:hover:bg-rose-500/30",
        outline:
          "border-emerald-400/45 bg-emerald-400/12 text-emerald-200  [a]:hover:bg-emerald-400/22",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
