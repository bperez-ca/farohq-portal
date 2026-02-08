'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/lib/ui';
import { ConversationRow } from '@/components/ui/ConversationRow';
import { ConversationListSkeleton } from './ConversationListSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { Inbox } from 'lucide-react';
import { useAuthSession } from '@/contexts/AuthSessionContext';
import { authenticatedFetch } from '@/lib/authenticated-fetch';
import type { ConversationListResponse } from '@/lib/conversations/types';

function formatTimestamp(iso: string | null, fallback: string): string {
  if (!iso) return fallback;
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function channelDisplayName(channel: string): string {
  if (channel === 'whatsapp') return 'WhatsApp';
  if (channel === 'gbp') return 'Google Business';
  return channel;
}

interface ConversationListProps {
  selectedId?: string;
}

export function ConversationList({ selectedId }: ConversationListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeOrgId } = useAuthSession();
  const [data, setData] = useState<ConversationListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const q = searchParams.get('q') ?? '';
  const assignedToMe = searchParams.get('assigned_to') === 'me';

  const fetchConversations = useCallback(() => {
    if (!activeOrgId) {
      setLoading(false);
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.set('tenant_id', activeOrgId);
    if (q.trim()) params.set('q', q.trim());
    if (assignedToMe) params.set('assigned_to', 'me');
    authenticatedFetch(`/api/v1/conversations?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText || 'Failed to load conversations');
        return res.json();
      })
      .then((json: ConversationListResponse) => setData(json))
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load conversations');
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [activeOrgId, q, assignedToMe]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const setSearch = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value.trim()) next.set('q', value.trim());
    else next.delete('q');
    router.push(`/business/inbox?${next.toString()}`);
  };

  const setAssignedToMe = (value: boolean) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('assigned_to', 'me');
    else next.delete('assigned_to');
    router.push(`/business/inbox?${next.toString()}`);
  };

  const selectConversation = (id: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('conversation', id);
    router.push(`/business/inbox?${next.toString()}`);
  };

  if (!activeOrgId) {
    return (
      <div className="p-4">
        <EmptyState variant="inbox" icon={Inbox} />
      </div>
    );
  }

  if (loading) return <ConversationListSkeleton />;
  if (error) {
    return (
      <div className="p-4">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  const hasConversations = Boolean(data?.conversations?.length);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b space-y-2 shrink-0">
        <Input
          placeholder="Search conversations..."
          value={q}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setAssignedToMe(false)}
            className={`text-xs px-2 py-1 rounded-md ${
              !assignedToMe ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setAssignedToMe(true)}
            className={`text-xs px-2 py-1 rounded-md ${
              assignedToMe ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}
          >
            Assigned to me
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {!hasConversations ? (
          <div className="p-4">
            <EmptyState variant="inbox" icon={Inbox} />
          </div>
        ) : (
          <div className="divide-y divide-border">
            {data!.conversations.map((conv) => (
              <div
                key={conv.id}
                className={selectedId === conv.id ? 'bg-muted/50' : ''}
              >
                <ConversationRow
                  channel={channelDisplayName(conv.channel)}
                  contactName={conv.contact_name || conv.contact_phone || 'Unknown'}
                  lastMessage={conv.last_message_preview || '(no messages)'}
                  timestamp={formatTimestamp(conv.last_message_at, '—')}
                  status={conv.status === 'open' ? 'waiting' : 'replied'}
                  onClick={() => selectConversation(conv.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
