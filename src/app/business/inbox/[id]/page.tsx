'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card } from '@/lib/ui'
import { Button } from '@/lib/ui'
import { Loader2, Send, ArrowLeft } from 'lucide-react'
import { useAuthSession } from '@/contexts/AuthSessionContext'
import { authenticatedFetch } from '@/lib/authenticated-fetch'
import type {
  Conversation,
  MessageListItem,
  MessageListResponse,
  SendMessageResponse,
} from '@/lib/conversations/types'

function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ConversationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const { activeOrgId, loading: sessionLoading } = useAuthSession()
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<MessageListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [sendLoading, setSendLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  useEffect(() => {
    if (!activeOrgId || !id) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    Promise.all([
      authenticatedFetch(
        `/api/v1/conversations/${id}?tenant_id=${encodeURIComponent(activeOrgId)}`
      ).then((res) => {
        if (!res.ok) throw new Error(res.statusText || 'Conversation not found')
        return res.json()
      }),
      authenticatedFetch(
        `/api/v1/conversations/${id}/messages?tenant_id=${encodeURIComponent(activeOrgId)}&limit=100`
      ).then((res) => {
        if (!res.ok) return { messages: [] }
        return res.json()
      }),
    ])
      .then(([conv, msgRes]) => {
        setConversation(conv)
        setMessages((msgRes as MessageListResponse).messages || [])
        setError(null)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load')
        setConversation(null)
        setMessages([])
      })
      .finally(() => setLoading(false))
  }, [activeOrgId, id])

  const handleSend = async () => {
    const content = replyText.trim()
    if (!content || !activeOrgId || !id || sendLoading) return
    setSendLoading(true)
    try {
      const res = await authenticatedFetch(
        `/api/v1/conversations/${id}/messages?tenant_id=${encodeURIComponent(activeOrgId)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        }
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { details?: string }).details || res.statusText)
      }
      const data: SendMessageResponse = await res.json()
      setReplyText('')
      setMessages((prev) => [
        ...prev,
        {
          id: data.id,
          direction: 'outbound',
          content,
          sent_at: new Date().toISOString(),
        },
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send')
      setTimeout(() => setError(null), 5000)
    } finally {
      setSendLoading(false)
    }
  }

  if (sessionLoading || (loading && !conversation)) {
    return (
      <div className="min-h-screen pb-24 md:pb-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!activeOrgId) {
    return (
      <div className="min-h-screen pb-24 md:pb-6">
        <PageHeader breadcrumbs={[{ label: 'Business', href: '/business/dashboard' }, { label: 'Inbox', href: '/business/inbox' }, { label: 'Conversation' }]} title="Conversation" />
        <div className="max-w-7xl mx-auto px-6 py-10">
          <Card className="p-8">
            <p className="text-muted-foreground">Select an organization to view conversations.</p>
          </Card>
        </div>
      </div>
    )
  }

  if (error && !conversation) {
    return (
      <div className="min-h-screen pb-24 md:pb-6">
        <PageHeader
          breadcrumbs={[
            { label: 'Business', href: '/business/dashboard' },
            { label: 'Inbox', href: '/business/inbox' },
            { label: 'Conversation' },
          ]}
          title="Conversation"
        />
        <div className="max-w-7xl mx-auto px-6 py-10">
          <Card className="p-8">
            <p className="text-destructive mb-4">{error}</p>
            <Button variant="outline" onClick={() => router.push('/business/inbox')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Inbox
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  const contactName = conversation?.contact_name || conversation?.contact_phone || 'Unknown'
  const channelLabel = conversation?.channel === 'whatsapp' ? 'WhatsApp' : conversation?.channel === 'gbp' ? 'Google Business' : conversation?.channel ?? ''

  return (
    <div className="min-h-screen pb-24 md:pb-6 flex flex-col">
      <PageHeader
        breadcrumbs={[
          { label: 'Business', href: '/business/dashboard' },
          { label: 'Inbox', href: '/business/inbox' },
          { label: contactName },
        ]}
        title={contactName}
        subtitle={channelLabel}
        actions={
          <Button variant="ghost" size="sm" onClick={() => router.push('/business/inbox')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        }
      />
      <div className="max-w-3xl mx-auto w-full px-6 py-6 flex-1 flex flex-col">
        <Card className="rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden min-h-[400px]">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && !loading ? (
              <p className="text-sm text-muted-foreground text-center py-8">No messages yet.</p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-2 ${
                      msg.direction === 'outbound'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content || '(media)'}</p>
                    <p
                      className={`text-xs mt-1 ${
                        msg.direction === 'outbound'
                          ? 'text-primary-foreground/80'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {formatMessageTime(msg.sent_at)}
                      {msg.direction === 'outbound' ? ' · You' : ''}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="border-t p-4 flex gap-2">
            <textarea
              className="flex-1 min-h-[44px] max-h-32 rounded-lg border bg-background px-3 py-2 text-sm resize-y"
              placeholder="Type a message..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              rows={2}
              disabled={sendLoading}
            />
            <Button
              size="icon"
              className="shrink-0"
              onClick={handleSend}
              disabled={!replyText.trim() || sendLoading}
            >
              {sendLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </Card>
        {error && (
          <p className="text-sm text-destructive mt-2 text-center">{error}</p>
        )}
      </div>
    </div>
  )
}
