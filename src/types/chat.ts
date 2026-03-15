export interface RecentConversation {
  conversationId: string;
  partner?: {
    id?: string;
    name?: string;
    avatar_url?: string | null;
  } | null;
  preview: string;
  timestamp: string;
  unreadCount: number;
}

