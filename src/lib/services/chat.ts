import { supabase } from '@/lib/Supabase/browser-client';
import { useEffect } from 'react';
import type { User } from '@supabase/supabase-js';

// Types
export type ConversationId = string;

export interface Message {
  id: string;
  conversation_id: ConversationId;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name?: string;
  sender_avatar?: string;
}

// Core functions (moved from buddies.ts)
export async function getOrCreateConversation(
  userId1: string,
  userId2: string
): Promise<{ conversationId: ConversationId }> {
  const { data, error } = await supabase.rpc('get_or_create_conversation', {
    user_id_1: userId1,
    user_id_2: userId2,
  });
  if (error) throw error;
  return { conversationId: data as ConversationId };
}

export async function getMessages(conversationId: ConversationId): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:users(username, avatar_url)
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) throw error;

  return data.map((msg: any) => ({
    ...msg,
    sender_name: msg.sender?.username || 'Unknown',
    sender_avatar: msg.sender?.avatar_url || '',
  })) as Message[];
}

export async function sendMessage(
  conversationId: ConversationId,
  content: string
): Promise<Message> {
  const { data: sessionData } = await supabase.auth.getUser();
  if (!sessionData.user?.id) {
    throw new Error('User not authenticated');
  }
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: sessionData.user.id,
      content,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Message;
}

// Fetch partner profile for chat header
export async function getPartnerProfile(partnerId: string): Promise<{ name: string; avatar_url: string }> {
  const { data, error } = await supabase
    .from('users')
    .select('username, avatar_url')
    .eq('id', partnerId)
    .single();

  if (error || !data) {
    return { name: 'Unknown User', avatar_url: '' };
  }

  return {
    name: data.username || 'Unknown',
    avatar_url: data.avatar_url || '',
  };
}

// Realtime hooks
export function useMessagesSubscription(
  conversationId: ConversationId | null,
  onNewMessage: (msg: Message) => void
) {
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          onNewMessage(payload.new as Message);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, onNewMessage]);
}

export function useConversationParticipants(
  conversationId: ConversationId | null,
  onUpdate: (userIds: string[]) => void
) {
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`participants:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_participants',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          // Fetch latest participants
          supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', conversationId)
            .single()
            .then(({ data }) => {
              if (data && Array.isArray(data)) {
                onUpdate(data.map((p: { user_id: string }) => p.user_id));
              }
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, onUpdate]);
}

// Recent conversations for dropdown

export interface RecentConversation {
  conversationId: string;
  partner: {
    id: string;
    name: string;
    avatar_url: string;
  };
  preview: string;
  timestamp: string;
  unreadCount: number;
}

export async function fetchRecentConversations(
  userId: string, 
  limit: number = 5
): Promise<RecentConversation[]> {
  const { data, error } = await supabase
    .rpc('get_recent_conversations', {
      p_user_id: userId,
      p_limit: limit
    });

  if (error) throw error;

  // Transform RPC data to match type
  return (data as any[]).map(conv => ({
    conversationId: conv.conversation_id,
    partner: {
      id: conv.partner_id,
      name: conv.partner_name,
      avatar_url: conv.partner_avatar_url
    },
    preview: conv.preview,
    timestamp: conv.last_message_at,
    unreadCount: conv.unread_count
  })).filter(conv => conv.partner);
}

export async function fetchUnreadMessagesCount(userId: string): Promise<number> {
  const { data, error } = await supabase
    .rpc('get_unread_messages_count', {
      p_user_id: userId
    });

  if (error) throw error;

  return data as number || 0;
}

// Bonus: Combined hook for messages (query + realtime)
export function useConversationMessages(conversationId: ConversationId | null) {
  // Implement if needed: useSWR + subscription
  // Placeholder for now
}
