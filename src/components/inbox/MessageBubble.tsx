'use client';

import type { MessageListItem } from '@/lib/conversations/types';

function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface MessageBubbleProps {
  message: MessageListItem;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isOutbound = message.direction === 'outbound';
  const displayContent = message.transcript || message.content || '(media)';

  return (
    <div className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-lg px-4 py-2 ${
          isOutbound ? 'bg-primary text-primary-foreground' : 'bg-muted'
        }`}
      >
        {message.media_type && message.media_type.startsWith('audio') && (
          <p className="text-xs opacity-80 mb-1">Voice message</p>
        )}
        <p className="text-sm whitespace-pre-wrap break-words">{displayContent}</p>
        <p
          className={`text-xs mt-1 ${
            isOutbound ? 'text-primary-foreground/80' : 'text-muted-foreground'
          }`}
        >
          {formatMessageTime(message.sent_at)}
          {isOutbound ? ' · You' : ''}
        </p>
      </div>
    </div>
  );
}
