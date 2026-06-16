import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
        cta: "gap-1.5 rounded-md bg-[#09090b] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-neutral-800 dark:bg-[#fafafa] dark:text-black dark:hover:bg-neutral-200",
        "outline-app":
          "gap-1.5 rounded-md border border-[#e4e4e7] px-3 py-2 text-xs font-semibold hover:bg-neutral-50 dark:border-[#27272a] dark:hover:bg-neutral-900",
        cancel:
          "rounded-md border border-[#e4e4e7] px-4 py-2 text-xs font-semibold hover:bg-neutral-50 dark:border-[#27272a] dark:hover:bg-neutral-900",
        submit:
          "gap-1.5 rounded-md bg-[#09090b] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-neutral-800 dark:bg-[#fafafa] dark:text-black dark:hover:bg-neutral-200",
        "toggle-active":
          "rounded-md border border-black bg-[#09090b] py-2 text-xs font-semibold text-white dark:border-white dark:bg-[#fafafa] dark:text-black",
        "toggle-inactive":
          "rounded-md border border-black/[0.04] py-2 text-xs font-semibold hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900",
        "destructive-sm":
          "gap-1 rounded-md bg-red-500 p-1.5 text-[10px] font-bold text-white hover:bg-red-600",
        unstyled: "border-transparent bg-transparent p-0 shadow-none ring-0 hover:bg-transparent",
        "auth-submit":
          "mt-2 w-full gap-1.5 rounded-md bg-[#09090b] py-2 text-xs font-semibold text-white shadow-xs hover:bg-neutral-800 disabled:opacity-55 dark:bg-[#fafafa] dark:text-[#09090b] dark:hover:bg-neutral-200",
        "auth-tab-active":
          "flex-1 rounded-md bg-white py-1.5 text-xs font-semibold text-black shadow-xs transition-all dark:bg-[#18181b] dark:text-white",
        "auth-tab-inactive":
          "flex-1 rounded-md py-1.5 text-xs font-semibold text-neutral-500 transition-all hover:text-neutral-900 dark:hover:text-neutral-200",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
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
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
