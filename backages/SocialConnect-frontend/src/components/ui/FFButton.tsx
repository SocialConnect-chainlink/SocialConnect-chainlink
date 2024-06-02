import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300 font-bold",
  {
    variants: {
      variant: {
        default: "bg-yellow-200 text-black",
        destructive:
          "bg-red-500 text-slate-50 hover:bg-red-500/90 dark:bg-red-900 dark:text-slate-50 dark:hover:bg-red-900/90",
        outline:
          "border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800 dark:hover:text-slate-50",
        secondary:
          "bg-slate-100 text-slate-900 hover:bg-slate-100/80 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-800/80",
        ghost:
          "hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-50",
        link: "text-slate-900 underline-offset-4 hover:underline dark:text-slate-50",
      },
      size: {
        default: "h-10 px-4 py-2 rounded-full",
        sm: "h-9 rounded-full px-3",
        lg: "h-11 rounded-full px-8",
        icon: "h-10 w-10",
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
  outside?: string;
  inside?: string;
  asChild?: boolean;
}

const FFButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, outside, inside, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <div className={cn("hover:opacity-80 h-full", className)}>
        {/* <Comp
          className={cn(
            buttonVariants({ variant, size, className }),
            "absolute border border-yellow-400"
          )}
          ref={ref}
          {...props}
        />
        <div
          className={cn(
            "bg-yellow-400 absolute p-[26px] rounded-full -z-10",
            className
          )}
        /> */}
        <Comp
          className={cn(
            buttonVariants({ variant, size, className }),
            "border rounded-3xl border-[#FFD400] pt-[1.4rem] pb-8 bg-[#FFD400] px-0.5",
            outside
          )}
          ref={ref}
          {...props}
        >
          <div className={cn("w-full rounded-full py-3 bg-[#FFF192]", inside)}>
            {props.children}
          </div>
        </Comp>
        {/* <div
          className={cn("bg-yellow-400 absolute rounded-full -z-10 h-full mt-3", className)}
        /> */}
      </div>
    );
  }
);
FFButton.displayName = "FFButton";

export { FFButton, buttonVariants };
