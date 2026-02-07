/**
 * Types for conversations/messages API (matches Core App OpenAPI).
 */

export interface ConversationListItem {
  id: string;
  location_id: string;
  channel: string;
  contact_phone: string;
  contact_name: string;
  status: string;
  last_message_at: string | null;
  created_at: string;
  last_message_preview: string;
}

export interface ConversationListResponse {
  conversations: ConversationListItem[];
  total: number;
}

export interface Conversation {
  id: string;
  location_id: string;
  channel: string;
  contact_phone: string;
  contact_name: string;
  status: string;
  last_message_at: string | null;
  created_at: string;
}

export interface MessageListItem {
  id: string;
  direction: 'inbound' | 'outbound';
  content: string;
  media_url?: string | null;
  media_type?: string | null;
  sent_at: string;
}

export interface MessageListResponse {
  messages: MessageListItem[];
}

export interface SendMessageRequest {
  content?: string;
  media_url?: string;
  media_type?: string;
}

export interface SendMessageResponse {
  id: string;
  twilio_sid: string;
}
