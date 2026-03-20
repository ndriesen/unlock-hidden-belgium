"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import AnimatedButton from "@/components/ui/hover-button"

interface Action {
  icon: React.ReactNode
  label: string
  onClick: () => void
  className?: string
}

interface FloatingActionMenuProps {
  actions: Action[]
}

export default function FloatingActionMenu({ actions }: FloatingActionMenuProps) {
  const [open, setOpen] = React.useState(false)

  const toggle = () => setOpen((prev) => !prev)

  return (
    <div className="relative flex items-center">
  {/* ACTIONS */}
  <AnimatePresence>
    {open && (
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        transition={{ duration: 0.2 }}
        className="
          flex items-center gap-0 mr-[-12px] px-1 py-0.5
          bg-white/50 backdrop-blur-xl
          border border-white/30
          rounded-l-full
          shadow-lg
        "
      >
        {actions.map((action, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.95 }}
            transition={{ delay: index * 0.05 }}
          >
            <AnimatedButton
              icon={action.icon}
              label={action.label}
              onClick={(e) => {
                e?.stopPropagation()
                action.onClick()
                setOpen(false)
              }}
              className={`
                bg-transparent shadow-none hover:bg-white/30
                h-8 px-2 text-sm
                ${action.className ?? ""}
              `}
            />
          </motion.div>
        ))}
      </motion.div>
    )}
  </AnimatePresence>

  {/* MAIN BUTTON */}
  <motion.button
    animate={{ rotate: open ? 45 : 0 }}
    transition={{ duration: 0.2 }}
    onClick={(e) => {
      e.stopPropagation()
      toggle()
    }}
    className="
      h-11 w-11
      rounded-full
      bg-white/90 hover:bg-white backdrop-blur-xl
      border border-white/40
      text-slate-900
      flex items-center justify-center
      shadow-lg
      hover:scale-105
      transition
    "
  >
    +
  </motion.button>
</div>
  )
}