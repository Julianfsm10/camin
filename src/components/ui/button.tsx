import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-3 whitespace-nowrap font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 active:scale-[0.97] [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:brightness-110 active:brightness-125 rounded-xl",
        destructive:
          "bg-destructive text-destructive-foreground hover:brightness-110 rounded-xl",
        outline:
          "border-2 border-border bg-transparent text-foreground hover:bg-muted hover:border-primary rounded-xl",
        secondary:
          "bg-secondary text-secondary-foreground hover:brightness-110 rounded-xl",
        ghost: 
          "text-foreground hover:bg-muted active:bg-muted/80 rounded-xl",
        link: 
          "text-primary underline-offset-4 hover:underline",
        hero:
          "bg-primary text-primary-foreground text-xl font-semibold rounded-[20px] hover:brightness-110 focus-visible:ring-4 focus-visible:ring-primary/50 shadow-lg shadow-primary/25",
        "hero-secondary":
          "bg-secondary text-secondary-foreground text-lg font-semibold rounded-[20px] hover:brightness-110 focus-visible:ring-4 focus-visible:ring-secondary/50",
        "hero-outline":
          "border-2 border-primary bg-transparent text-primary text-lg font-semibold rounded-[20px] hover:bg-primary/10",
      },
      size: {
        default: "h-12 px-6 py-3 text-base",
        sm: "h-10 px-4 text-sm rounded-lg",
        lg: "h-14 px-8 text-lg",
        xl: "h-16 px-8 text-xl rounded-2xl",
        hero: "h-20 px-8 w-full",
        "hero-secondary": "h-16 px-8 w-full",
        icon: "h-12 w-12 rounded-xl",
        "icon-lg": "h-14 w-14 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
