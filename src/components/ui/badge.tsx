import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
  {
    variants: {
      variant: {
        default: "border-primary/30 bg-primary/20 text-primary glow-neon hover:bg-primary/30 hover:border-primary/50",
        secondary: "border-secondary/30 bg-secondary/20 text-secondary-foreground hover:bg-secondary/30 hover:border-secondary/50",
        destructive: "border-destructive/30 bg-destructive/20 text-destructive glow-neon hover:bg-destructive/30 hover:border-destructive/50",
        outline: "border-border text-foreground bg-background/50 hover:bg-background/70",
        success: "border-success/30 bg-success/20 text-success glow-success hover:bg-success/30 hover:border-success/50",
        cyan: "border-accent/30 bg-accent/20 text-accent glow-cyan hover:bg-accent/30 hover:border-accent/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
