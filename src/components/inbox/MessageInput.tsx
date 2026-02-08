'use client';

import { useState } from 'react';
import { Button } from '@/lib/ui';
import { Send, Loader2 } from 'lucide-react';
import { authenticatedFetch } from '@/lib/authenticated-fetch';
import type { SendMessageResponse } from '@/lib/conversations/types';

interface MessageInputProps {
  conversationId: string;
  tenantId: string;
  onSent?: (content: string, response: SendMessageResponse) => void;
  disabled?: boolean;
}

export function MessageInput({
  conversationId,
  tenantId,
  onSent,
  disabled = false,
}: MessageInputProps) {
  const [replyText, setReplyText] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    const content = replyText.trim();
    if (!content || !tenantId || !conversationId || sendLoading || disabled) return;
    setSendLoading(true);
    setError(null);
    try {
      const res = await authenticatedFetch(
        `/api/v1/conversations/${conversationId}/messages?tenant_id=${encodeURIComponent(tenantId)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { details?: string }).details || res.statusText);
      }
      const data: SendMessageResponse = await res.json();
      setReplyText('');
      onSent?.(content, data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send');
      setTimeout(() => setError(null), 5000);
    } finally {
      setSendLoading(false);
    }
  };

  return (
    <div className="border-t p-4 flex flex-col gap-2">
      <div className="flex gap-2">
        <textarea
          className="flex-1 min-h-[44px] max-h-32 rounded-lg border bg-background px-3 py-2 text-sm resize-y"
          placeholder="Type a message..."
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          rows={2}
          disabled={sendLoading || disabled}
        />
        <Button
          size="icon"
          className="shrink-0"
          onClick={handleSend}
          disabled={!replyText.trim() || sendLoading || disabled}
        >
          {sendLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
