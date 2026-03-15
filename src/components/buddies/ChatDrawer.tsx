"use client";

import { useState, useEffect, useCallback } from 'react';
import { getMessages, sendMessage, getOrCreateConversation, useMessagesSubscription, type Message } from '@/lib/services/chat';
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

  useEffect(() => {
    if (!user || !conversationPartnerId) return;

    const initChat = async () => {
      try {
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

  if (!conversationPartnerId) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end lg:items-center p-4 lg:p-0">
      <div className="bg-white rounded-2xl w-full lg:w-96 h-full lg:h-auto max-h-full flex flex-col shadow-2xl">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
              {/* Partner avatar stub */}
              <span className="text-lg">👤</span>
            </div>
            <div>
              <h3 className="font-bold text-lg">Chat</h3>
              <p className="text-sm text-slate-600">#{conversationId.slice(0,8)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            ✕
          </button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-slate-500 text-sm py-8">
              Start the conversation!
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs px-3 py-2 rounded-2xl text-sm ${msg.sender_id === user?.id ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-900'}`}>
                  {msg.content}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-200">
          <div className="flex gap-2">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a message..."
              className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              className="px-6 py-3 bg-gradient-to-r from-[#244b55] to-[#428a9d] text-white rounded-2xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? '...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
