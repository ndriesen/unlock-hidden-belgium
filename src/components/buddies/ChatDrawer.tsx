"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { getMessages, sendMessage, getOrCreateConversation, useMessagesSubscription, getPartnerProfile, type Message } from '@/lib/services/chat';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

interface ChatDrawerProps {
  conversationPartnerId: string | null;
  onClose: () => void;
}

export function ChatDrawer({ conversationPartnerId, onClose }: ChatDrawerProps) {
  const { user } = useAuth();
  const addToast = useToast();
  const [conversationId, setConversationId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [partner, setPartner] = useState<{ name: string; avatar_url: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!user || !conversationPartnerId) return;

    const initChat = async () => {
      try {
        const partnerProfile = await getPartnerProfile(conversationPartnerId);
        setPartner(partnerProfile);

        const { conversationId } = await getOrCreateConversation(user.id!, conversationPartnerId);
        setConversationId(conversationId);

        const msgs = await getMessages(conversationId);
        setMessages(msgs);
      } catch (error) {
        addToast('Failed to load chat');
      }
    };

    initChat();
  }, [conversationPartnerId, user]);

  useMessagesSubscription(conversationId, (msg) => {
    setMessages((prev) => [...prev, msg]);
  });

  const handleSend = useCallback(async () => {
    if (!newMessage.trim() || !conversationId || sending) return;

    setSending(true);
    try {
      const msg = await sendMessage(conversationId, newMessage.trim());
      setNewMessage('');
    } catch (error) {
      addToast('Failed to send message');
    } finally {
      setSending(false);
    }
  }, [newMessage, conversationId, sending]);

  if (!conversationPartnerId || !user) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end lg:items-center p-4 lg:p-0">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl w-full lg:w-[420px] h-full lg:h-auto max-h-full flex flex-col shadow-2xl border border-white/50"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200/50 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-slate-200/50">
              {partner?.avatar_url ? (
                <Image 
                  src={partner.avatar_url} 
                  alt={partner.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                  <span className="text-xl">👤</span>
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-xl truncate text-slate-900">{partner?.name || 'Loading...'}</h3>
              <p className="text-sm text-slate-500">Online</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100/50 rounded-2xl transition-all backdrop-blur-sm"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
          {messages.length === 0 ? (
            <div className="text-center text-slate-500 py-12 flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <p className="text-lg font-medium mb-1">No messages yet</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`group max-w-[75%] p-4 rounded-3xl shadow-lg relative ${msg.sender_id === user?.id ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white' : 'bg-white border border-slate-200 shadow-md'}`}>
                  <p className="text-sm leading-relaxed mb-1.5 break-words">{msg.content}</p>
                  <p className={`text-xs opacity-75 ${msg.sender_id === user?.id ? 'text-emerald-100' : 'text-slate-500'} absolute bottom-2 right-3 group-hover:opacity-100 transition-opacity`}>
                    {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}).toLowerCase()}
                  </p>
                  {msg.sender_id !== user?.id && (
                    <div className="absolute -left-3 top-4 w-4 h-4 bg-white border-b border-r border-slate-200 rotate-45 shadow-md"></div>
                  )}
                  {msg.sender_id === user?.id && (
                    <div className="absolute -right-3 top-4 w-4 h-4 bg-gradient-to-r from-emerald-500 to-emerald-600 border-b border-r rotate-45 shadow-lg"></div>
                  )}
                </div>
              </motion.div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-6 pt-0 border-t border-slate-200/50 sticky bottom-0 bg-gradient-to-t from-white/90 backdrop-blur-xl">
          <div className="flex items-end gap-3">
            <input
              ref={(input) => input?.focus()}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Type a message..."
              className="flex-1 px-5 py-4 bg-white/70 backdrop-blur-md rounded-3xl border-2 border-slate-200/50 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200/50 resize-none shadow-lg transition-all min-h-[56px]"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              className="w-14 h-14 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-3xl font-semibold shadow-lg border-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 rotate-[220deg]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.953 59.953 0 0121.75 12 59.953 0 0 1 3.27 20.873L6 12z" />
              </svg>
            </motion.button>
          </div>
          {newMessage && (
            <p className="text-xs text-slate-500 text-center mt-2">Press Enter to send • Shift + Enter for new line</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
