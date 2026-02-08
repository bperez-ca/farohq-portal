'use client';

import type { Conversation } from '@/lib/conversations/types';

function channelDisplayName(channel: string): string {
  if (channel === 'whatsapp') return 'WhatsApp';
  if (channel === 'gbp') return 'Google Business';
  return channel;
}

interface ContactPanelProps {
  conversation: Conversation;
}

export function ContactPanel({ conversation }: ContactPanelProps) {
  const contactName = conversation.contact_name || conversation.contact_phone || 'Unknown';
  const channelLabel = channelDisplayName(conversation.channel);

  return (
    <div className="flex flex-col p-4 h-full overflow-y-auto">
      <div className="flex flex-col items-center gap-2 pb-4 border-b">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-2xl font-medium text-muted-foreground">
          {contactName.charAt(0).toUpperCase()}
        </div>
        <p className="font-medium text-center">{contactName}</p>
        <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{channelLabel}</span>
      </div>
      <div className="py-4 space-y-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Phone</p>
          <p className="text-sm break-all">{conversation.contact_phone || '—'}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Channel</p>
          <p className="text-sm">{channelLabel}</p>
        </div>
        {conversation.assigned_to_user && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Assigned to</p>
            <p className="text-sm">{conversation.assigned_to_user.name || conversation.assigned_to}</p>
          </div>
        )}
      </div>
    </div>
  );
}
