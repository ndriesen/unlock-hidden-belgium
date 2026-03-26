
"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { ArrowLeft, MessageCircle } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { MessageBubble } from '@/components/ui/message-bubble';
import type { Message } from '@/lib/services/chat';
import { 
  getOrCreateConversation, 
  getMessages, 
  sendMessage, 
  getPartnerProfile,
  useMessagesSubscription 
} from '@/lib/services/chat';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const partnerId = params.id as string;

  const { user } = useAuth();
  const addToast = useToast();

  const [conversationId, setConversationId] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [partner, setPartner] = useState({ name: '', avatar_url: '' });
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    async function initChat() {
      if (!user?.id || !partnerId) {
        addToast('Please log in to chat');
        router.back();
        return;
      }

      setLoading(true);
      try {
        const partnerProfile = await getPartnerProfile(partnerId);
        setPartner(partnerProfile);

        const { conversationId } = await getOrCreateConversation(user.id, partnerId);
        setConversationId(conversationId);

        const msgs = await getMessages(conversationId);
        setMessages(msgs);
      } catch (error) {
        addToast('Failed to load chat');
        router.back();
      } finally {
        setLoading(false);
      }
    }

    initChat();
  }, [partnerId, user]);

  useMessagesSubscription(conversationId, (msg) => {
    setMessages((prev) => [...prev, { ...msg, sender_name: msg.sender_name || 'Unknown' }]);
  });

  const handleSend = async () => {
    if (!newMessage.trim() || !conversationId || sending || !user) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: user.id,
      content: newMessage.trim(),
      created_at: new Date().toISOString(),
      sender_name: 'You',
      sender_avatar: ''
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage('');
    scrollToBottom();

    setSending(true);
    try {
      const sentMsg = await sendMessage(conversationId, newMessage.trim());
      setMessages((prev) => prev.map((m) => (m.id === tempId ? sentMsg : m)));
    } catch (error) {
      addToast('Failed to send message');
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full"
        />
      </div>
    );
  }

  if (!user || !partnerId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <main className="max-w-md mx-auto h-screen flex flex-col">
        {/* Header */}
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 p-4 flex items-center gap-3"
        >
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors -ml-1"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-slate-200/50">
              {partner.avatar_url ? (
                <Image src={partner.avatar_url} alt={partner.name} width={48} height={48} className="object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-lg">
                  👤
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-lg truncate text-slate-900">{partner.name}</h1>
              <p className="text-sm text-emerald-600 font-medium">Online</p>
            </div>
          </div>
        </motion.div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent pb-20">
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center text-center py-12 text-slate-500"
            >
              <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <MessageCircle className="w-10 h-10 text-slate-400" />
              </div>
              <h2 className="text-xl font-bold mb-2 text-slate-900">No messages yet</h2>
              <p className="text-sm">Start the conversation!</p>
            </motion.div>
          ) : (
            messages.map((msg, index) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <MessageBubble 
                  message={msg} 
                  isOwnMessage={msg.sender_id === user.id} 
                  userId={user.id} 
                />
              </motion.div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky bottom-0 p-4 pt-0 bg-gradient-to-t from-white/90 via-white/80 backdrop-blur-xl border-t border-slate-200/50"
        >
          <div className="flex items-end gap-3 max-w-md mx-auto">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type a message..."
              className="flex-1 px-4 py-3.5 bg-white/70 backdrop-blur border border-slate-200/50 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 rounded-2xl shadow-lg transition-all resize-none"
              disabled={sending}
              autoFocus
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              className="w-14 h-14 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
            >
              <svg 
                className="w-5 h-5 rotate-[40deg]" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </motion.button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

