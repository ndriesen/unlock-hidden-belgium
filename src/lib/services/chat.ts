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
      sender:user_metadata(*)
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) throw error;

  return data.map((msg: any) => ({
    ...msg,
    sender_name: msg.sender?.display_name || 'Unknown',
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

// Bonus: Combined hook for messages (query + realtime)
export function useConversationMessages(conversationId: ConversationId | null) {
  // Implement if needed: useSWR + subscription
  // Placeholder for now
}
