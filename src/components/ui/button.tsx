import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 click-scale",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-md hover:shadow-lg hover:shadow-primary/50 glow-neon hover:scale-105 active:scale-95",
        destructive: "bg-destructive text-destructive-foreground shadow-md hover:shadow-lg hover:shadow-destructive/50 hover:scale-105 active:scale-95",
        outline: "border border-border bg-background/50 backdrop-blur shadow-sm hover:bg-primary/10 hover:border-primary hover:text-primary transition-colors hover:scale-105 active:scale-95",
        secondary: "bg-secondary/80 text-secondary-foreground shadow-md backdrop-blur hover:shadow-lg hover:bg-secondary hover:scale-105 active:scale-95",
        ghost: "hover:bg-accent/20 hover:text-accent text-foreground hover:scale-105 active:scale-95 transition-all",
        link: "text-primary underline-offset-4 hover:underline hover:text-accent transition-colors hover:scale-105 active:scale-95",
        gradient: "bg-gradient-neon text-primary-foreground shadow-lg glow-neon hover:shadow-xl hover:scale-105 active:scale-95",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
