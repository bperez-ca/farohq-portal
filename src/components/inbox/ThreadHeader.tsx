'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/lib/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/lib/ui';
import { ArrowLeft, UserPlus, Loader2 } from 'lucide-react';
import { authenticatedFetch } from '@/lib/authenticated-fetch';
import type { Conversation } from '@/lib/conversations/types';
import type { TenantMembersResponse } from '@/lib/conversations/types';

interface ThreadHeaderProps {
  conversation: Conversation;
  tenantId: string;
  onBack?: () => void;
  onAssignmentChange?: () => void;
  showBack?: boolean;
}

function channelDisplayName(channel: string): string {
  if (channel === 'whatsapp') return 'WhatsApp';
  if (channel === 'gbp') return 'Google Business';
  return channel;
}

export function ThreadHeader({
  conversation,
  tenantId,
  onBack,
  onAssignmentChange,
  showBack = false,
}: ThreadHeaderProps) {
  const [members, setMembers] = useState<TenantMembersResponse['members']>([]);
  const [assignLoading, setAssignLoading] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    authenticatedFetch(`/api/v1/tenants/${tenantId}/members`)
      .then((res) => (res.ok ? res.json() : { members: [] }))
      .then((data: TenantMembersResponse) => setMembers(data.members || []))
      .catch(() => setMembers([]));
  }, [tenantId]);

  const handleAssign = async (userId: string | null) => {
    if (!tenantId || !conversation.id || assignLoading) return;
    setAssignLoading(true);
    try {
      const res = await authenticatedFetch(
        `/api/v1/conversations/${conversation.id}/assign?tenant_id=${encodeURIComponent(tenantId)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId }),
        }
      );
      if (res.ok) {
        onAssignmentChange?.();
      }
    } finally {
      setAssignLoading(false);
    }
  };

  const contactName = conversation.contact_name || conversation.contact_phone || 'Unknown';
  const channelLabel = channelDisplayName(conversation.channel);
  const assignedTo = conversation.assigned_to;
  const assignedToName = conversation.assigned_to_user?.name;

  return (
    <div className="flex items-center gap-2 p-4 border-b shrink-0">
      {showBack && (
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Button>
      )}
      <div className="flex-1 min-w-0">
        <h2 className="font-semibold truncate">{contactName}</h2>
        <p className="text-sm text-muted-foreground">{channelLabel}</p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={assignLoading} className="shrink-0">
            {assignLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4 mr-1" />
            )}
            {assignedToName || assignedTo ? assignedToName || 'Assigned' : 'Assign'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleAssign(null)}>Unassign</DropdownMenuItem>
          <DropdownMenuSeparator />
          {members.map((m) => (
            <DropdownMenuItem
              key={m.user_id}
              onClick={() => handleAssign(m.user_id)}
            >
              {m.user_id === assignedTo ? '✓ ' : ''}
              User {m.user_id.slice(0, 8)}…
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
