"use client"

import * as React from "react"
import { motion } from "framer-motion"

interface AnimatedButtonProps {
  icon: string
  label?: string
  onClick?: (e?: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void
  className?: string
}

export default function AnimatedButton({icon = "★", label = "Action", onClick, className = "" }: AnimatedButtonProps) {
  const [isHovered, setIsHovered] = React.useState(false)

  return (
    <button
      onClick={onClick}
      className={`relative ${className}`}
    >
      <motion.div
        initial={{ width: 26, height: 26 }}
        whileHover={{ width: 60 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        transition={{ duration: 0.3 }}
        className="bg-slate-300 flex items-center justify-center overflow-hidden relative"
        style={{ borderRadius: 32 }}
      >
        <motion.div
          className="absolute"
          animate={{
            opacity: isHovered ? 0 : 1,
            scale: isHovered ? 0.8 : 1
          }}
          transition={{ duration: 0.2 }}
        >
          <span className="text-black text-lg">{icon}</span>
        </motion.div>

        <motion.div
          className="w-full flex justify-center items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2, delay: isHovered ? 0.1 : 0 }}
        >
          <span className="text-teal-950 text-xs italic whitespace-nowrap">
            {label}
          </span>
        </motion.div>
      </motion.div>
    </button>
  )
}