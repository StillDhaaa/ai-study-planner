import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center rounded-xl border border-white/25  bg-clip-padding text-sm font-medium whitespace-nowrap shadow-[0_2px_12px_rgb(0_0_0_/_0.08),inset_0_1px_rgb(255_255_255_/_0.28)] backdrop-blur-xl transition-all  duration-300 ease-in-out outline-none select-none hover:scale-[1.05] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.95] active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:border-white/15 dark:shadow-[0_2px_12px_rgb(0_0_0_/_0.24),inset_0_1px_rgb(255_255_255_/_0.12)] dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 ",
  {
    variants: {
      variant: {
        default:
          "bg-primary/75 text-primary-foreground hover:bg-primary/90 dark:bg-primary/65 dark:hover:bg-primary/80",
        outline:
          "border-border/70 bg-background/45 text-foreground hover:bg-muted/70 aria-expanded:bg-muted/70 aria-expanded:text-foreground dark:border-input/70 dark:bg-input/25 dark:hover:bg-input/40",
        secondary:
          "bg-secondary/65 text-secondary-foreground hover:bg-secondary/85 aria-expanded:bg-secondary/85 aria-expanded:text-secondary-foreground",
        ghost:
          "border-transparent bg-transparent shadow-none hover:bg-muted/55 hover:text-foreground aria-expanded:bg-muted/55 aria-expanded:text-foreground dark:hover:bg-muted/40",
        destructive:
          "border-destructive/25 bg-destructive/15 text-destructive hover:bg-destructive/25 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-3.5 py-2 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-5 py-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
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
  },
);

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
  );
}

export { Button, buttonVariants };
