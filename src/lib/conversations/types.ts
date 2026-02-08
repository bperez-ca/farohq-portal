/**
 * Types for conversations/messages API (matches Core App OpenAPI).
 */

export interface AssignedToUser {
  id: string;
  name: string;
}

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
  assigned_to?: string | null;
  assigned_to_user?: AssignedToUser | null;
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
  assigned_to?: string | null;
  assigned_to_user?: AssignedToUser | null;
}

export interface MessageListItem {
  id: string;
  direction: 'inbound' | 'outbound';
  content: string;
  media_url?: string | null;
  media_type?: string | null;
  transcript?: string | null;
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

export interface AssignConversationRequest {
  user_id: string | null;
}

export interface TenantMember {
  id: string;
  tenant_id: string;
  user_id: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface TenantMembersResponse {
  members: TenantMember[];
}
