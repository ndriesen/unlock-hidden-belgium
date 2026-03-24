import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(" ");
}

const glassButtonVariants = cva(
  "relative isolate all-unset cursor-pointer rounded-full transition-all",
  {
    variants: {
      size: {
        default: "text-base font-medium",
        sm: "text-sm font-medium",
        lg: "text-lg font-medium",
        icon: "h-10 w-10",
      },
      color: {
        default: "text-slate-800 bg-white/40 border-white/30",
        primary: "text-white bg-emerald-500 border-emerald-400",
        secondary: "text-slate-900 bg-slate-400 border-slate-300",
        danger: "text-white bg-gray-200 border-grey-400",
      },
    },
    defaultVariants: {
      size: "default",
      color: "default",
    },
  }
);

const glassButtonTextVariants = cva(
  "glass-button-text relative block select-none tracking-tighter",
  {
    variants: {
      size: {
        default: "px-6 py-3.5",
        sm: "px-4 py-2",
        lg: "px-8 py-4",
        icon: "flex h-10 w-10 items-center justify-center",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof glassButtonVariants> {
  contentClassName?: string;
  color?: "default" | "primary" | "secondary" | "danger"; // optioneel
}

const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, children, size, color, contentClassName, ...props }, ref) => {
    return (
      
        <button
          ref={ref}
          {...props}
          className={cn(
            "relative inline-flex items-center justify-center rounded-full backdrop-blur-xl shadow-lg hover:shadow-2xl focus:outline-none focus:ring-2 transition-all",
            glassButtonVariants({ size, color })
          )}
        >
          {/* Shimmer / glow, pointer-events-none */}
          <span className="absolute inset-0 rounded-full bg-gradient-to-r from-white/30 via-white/10 to-white/0 opacity-40 pointer-events-none animate-glass-shimmer" />

          <span className={cn(glassButtonTextVariants({ size }), contentClassName)}>
            {children}
          </span>
        </button>

     

    );
  }
);

GlassButton.displayName = "GlassButton";

export { GlassButton, glassButtonVariants };