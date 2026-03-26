"use client"

import { cn } from "@/lib/utils"
import { Message } from "@/lib/services/chat"

interface MessageBubbleProps {
  message: Message
  isOwnMessage: boolean
  userId: string
}

export function MessageBubble({ message, isOwnMessage, userId }: MessageBubbleProps) {
  const time = new Date(message.created_at).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  }).toLowerCase()

  const initials = message.sender_name ? message.sender_name.slice(0,2).toUpperCase() : '??'

  return (
    <div className={cn(
      "group flex",
      isOwnMessage ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "flex flex-col max-w-[75%] p-4 rounded-3xl shadow-lg relative mb-4",
        isOwnMessage 
          ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-br-sm" 
          : "bg-white border border-slate-200 shadow-md rounded-bl-sm"
      )}>
        <p className="text-sm leading-relaxed mb-1.5 break-words">
          {message.content}
        </p>
        <div className="flex items-center justify-between opacity-75 group-hover:opacity-100 transition-opacity">
          <span className="text-xs font-medium">
            {isOwnMessage ? "You" : message.sender_name || "Someone"}
          </span>
          <span className="text-xs ml-auto">
            {time}
          </span>
        </div>
        
        {/* Message tail */}
        <div className={cn(
          "absolute w-4 h-4 rotate-45 shadow-md -bottom-2",
          isOwnMessage 
            ? "right-4 bg-gradient-to-r from-emerald-500 to-emerald-600 border-b border-r border-emerald-600/50" 
            : "left-4 bg-white border-b border-r border-slate-200"
        )} />
      </div>
    </div>
  )
}

