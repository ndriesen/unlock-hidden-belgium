"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import AnimatedButton from "@/components/ui/hover-button"

interface Action {
  icon:string
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
    <div
      className="relative flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* ACTIONS */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className="flex gap-2 mr-2"
          >
            {actions.map((action, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <AnimatedButton
                  icon={action.icon}
                  label={action.label}
                  onClick={(e) => {
                    e?.stopPropagation()
                    action.onClick()
                    setOpen(false) // close after click
                  }}
                  className={action.className}
                />
              </motion.div>
            ))}
            
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN BUTTON */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          toggle()
        }}
        className="h-10 w-10 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-lg hover:scale-105 transition"
      >
        +
      </button>
    </div>
  )
}