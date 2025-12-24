import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
        success:
          "border-transparent bg-success/20 text-success border-success/30",
        warning:
          "border-transparent bg-warning/20 text-warning border-warning/30",
        info: "border-transparent bg-info/20 text-info border-info/30",
        bid: "border-transparent bg-bid/20 text-bid border-bid/30 font-bold",
        "no-bid":
          "border-transparent bg-no-bid/20 text-no-bid border-no-bid/30 font-bold",
        research:
          "border-transparent bg-research/20 text-research border-research/30 font-bold",
        watching:
          "border-transparent bg-watching/20 text-watching border-watching/30",
        bidding:
          "border-transparent bg-bidding/20 text-bidding border-bidding/30",
        won: "border-transparent bg-won/20 text-won border-won/30",
        lost: "border-transparent bg-lost/20 text-lost border-lost/30",
        passed:
          "border-transparent bg-passed/20 text-passed border-passed/30",
        score:
          "border-transparent bg-primary/20 text-primary border-primary/30 font-bold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
