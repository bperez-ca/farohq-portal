'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthSession } from '@/contexts/AuthSessionContext';
import { authenticatedFetch } from '@/lib/authenticated-fetch';
import { ThreadHeader } from './ThreadHeader';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { ThreadSkeleton } from './ThreadSkeleton';
import type {
  Conversation,
  MessageListItem,
  MessageListResponse,
  SendMessageResponse,
} from '@/lib/conversations/types';

interface ConversationThreadProps {
  conversationId: string;
  onBack?: () => void;
  showBack?: boolean;
  onAssignmentChange?: () => void;
}

export function ConversationThread({
  conversationId,
  onBack,
  showBack = false,
  onAssignmentChange: _onAssignmentChange,
}: ConversationThreadProps) {
  const { activeOrgId } = useAuthSession();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<MessageListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchThread = useCallback(() => {
    if (!activeOrgId || !conversationId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all([
      authenticatedFetch(
        `/api/v1/conversations/${conversationId}?tenant_id=${encodeURIComponent(activeOrgId)}`
      ).then((res) => {
        if (!res.ok) throw new Error(res.statusText || 'Conversation not found');
        return res.json();
      }),
      authenticatedFetch(
        `/api/v1/conversations/${conversationId}/messages?tenant_id=${encodeURIComponent(activeOrgId)}&limit=100`
      ).then((res) => {
        if (!res.ok) return { messages: [] };
        return res.json();
      }),
    ])
      .then(([conv, msgRes]) => {
        setConversation(conv);
        setMessages((msgRes as MessageListResponse).messages || []);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load');
        setConversation(null);
        setMessages([]);
      })
      .finally(() => setLoading(false));
  }, [activeOrgId, conversationId]);

  useEffect(() => {
    fetchThread();
  }, [fetchThread]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSent = (content: string, response: SendMessageResponse) => {
    setMessages((prev) => [
      ...prev,
      {
        id: response.id,
        direction: 'outbound',
        content,
        sent_at: new Date().toISOString(),
      },
    ]);
  };

  if (!activeOrgId) return null;
  if (loading && !conversation) return <ThreadSkeleton />;
  if (error && !conversation) {
    return (
      <div className="p-4">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }
  if (!conversation) return null;

  return (
    <div className="flex flex-col h-full min-h-0">
      <ThreadHeader
        conversation={conversation}
        tenantId={activeOrgId}
        onBack={onBack}
        onAssignmentChange={fetchThread}
        showBack={showBack}
      />
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 && !loading ? (
          <p className="text-sm text-muted-foreground text-center py-8">No messages yet.</p>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}
        <div ref={messagesEndRef} />
      </div>
      <MessageInput
        conversationId={conversationId}
        tenantId={activeOrgId}
        onSent={handleSent}
      />
    </div>
  );
}
