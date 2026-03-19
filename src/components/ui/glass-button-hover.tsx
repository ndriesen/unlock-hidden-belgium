"use client"

import * as React from "react"
import { motion, HTMLMotionProps } from "framer-motion"
import { cva, type VariantProps } from "class-variance-authority"

function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(" ")
}

/* ================= Variants ================= */

const glassButtonVariants = cva(
  "relative isolate cursor-pointer rounded-full transition-all",
  {
    variants: {
      size: {
        default: "text-base font-medium",
        sm: "text-sm font-medium",
        lg: "text-lg font-medium",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

const glassButtonTextVariants = cva(
  "relative flex items-center justify-center select-none tracking-tighter",
  {
    variants: {
      size: {
        default: "px-6 py-3.5",
        sm: "px-4 py-2",
        lg: "px-8 py-4",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

/* ================= Component ================= */



export interface AnimatedGlassButtonProps
  extends HTMLMotionProps<"button">,
    VariantProps<typeof glassButtonVariants> {
  icon?: React.ReactNode
  label?: string
  contentClassName?: string
}

const AnimatedGlassButton = React.forwardRef<
  HTMLButtonElement,
  AnimatedGlassButtonProps
>(
  (
    {
      className,
      size,
      icon = "★",
      label = "Action",
      contentClassName,
      ...props
    },
    ref
  ) => {
    const [isHovered, setIsHovered] = React.useState(false)

    return (
      <div className={cn("relative inline-block rounded-full", className)}>
        <motion.button
          ref={ref}
          {...props}
          initial={{ width: 40 }}
          animate={{ width: isHovered ? 120 : 40 }}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          transition={{ duration: 0.3 }}
          className={cn(
            "relative overflow-hidden rounded-full bg-white/20 backdrop-blur-xl border border-white/30 shadow-lg hover:shadow-2xl hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/40",
            glassButtonVariants({ size })
          )}
        >
          {/* shimmer */}
          <span className="absolute inset-0 rounded-full bg-gradient-to-r from-white/30 via-white/10 to-white/0 opacity-40 pointer-events-none animate-glass-shimmer" />

          {/* content */}
          <span
            className={cn(
              glassButtonTextVariants({ size }),
              contentClassName,
              "relative"
            )}
          >
            {/* icon */}
            <motion.span
              animate={{
                opacity: isHovered ? 0 : 1,
                scale: isHovered ? 0.8 : 1,
              }}
              transition={{ duration: 0.2 }}
              className="absolute flex items-center justify-center"
            >
              {icon}
            </motion.span>

            {/* label */}
            <motion.span
              animate={{
                opacity: isHovered ? 1 : 0,
              }}
              transition={{ duration: 0.2, delay: isHovered ? 0.1 : 0 }}
              className="whitespace-nowrap text-sm"
            >
              {label}
            </motion.span>
          </span>
        </motion.button>

        {/* glow */}
        <div className="absolute inset-0 rounded-full shadow-md pointer-events-none" />
      </div>
    )
  }
)

AnimatedGlassButton.displayName = "AnimatedGlassButton"

export { AnimatedGlassButton, glassButtonVariants };