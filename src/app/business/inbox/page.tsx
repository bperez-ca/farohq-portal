'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card } from '@/lib/ui'
import { EmptyState } from '@/components/shared/EmptyState'
import { Inbox, Loader2 } from 'lucide-react'
import { useAuthSession } from '@/contexts/AuthSessionContext'
import { authenticatedFetch } from '@/lib/authenticated-fetch'
import { ConversationRow } from '@/components/ui/ConversationRow'
import type { ConversationListResponse } from '@/lib/conversations/types'

function formatTimestamp(iso: string | null, fallback: string): string {
  if (!iso) return fallback
  const d = new Date(iso)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function channelDisplayName(channel: string): string {
  if (channel === 'whatsapp') return 'WhatsApp'
  if (channel === 'gbp') return 'Google Business'
  return channel
}

/** Inbox: list conversations from Core App API. */
export default function BusinessInboxPage() {
  const router = useRouter()
  const { activeOrgId, loading: sessionLoading } = useAuthSession()
  const [data, setData] = useState<ConversationListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!activeOrgId) {
      setLoading(false)
      setData(null)
      return
    }
    setLoading(true)
    setError(null)
    authenticatedFetch(`/api/v1/conversations?tenant_id=${encodeURIComponent(activeOrgId)}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText || 'Failed to load conversations')
        return res.json()
      })
      .then((json: ConversationListResponse) => {
        setData(json)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load conversations')
        setData(null)
      })
      .finally(() => setLoading(false))
  }, [activeOrgId])

  const hasConversations = Boolean(data?.conversations?.length)
  const isLoading = sessionLoading || loading

  return (
    <div className="min-h-screen pb-24 md:pb-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Business', href: '/business/dashboard' },
          { label: 'Inbox' },
        ]}
        title="Inbox"
        subtitle="Unified lead conversations"
      />
      <div className="max-w-7xl mx-auto px-6 py-10">
        {!activeOrgId && !sessionLoading ? (
          <Card className="rounded-xl shadow-sm">
            <EmptyState variant="inbox" icon={Inbox} />
          </Card>
        ) : isLoading ? (
          <Card className="rounded-xl shadow-sm p-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </Card>
        ) : error ? (
          <Card className="rounded-xl shadow-sm p-8">
            <p className="text-destructive">{error}</p>
          </Card>
        ) : hasConversations ? (
          <Card className="rounded-xl shadow-sm overflow-hidden p-0">
            <div className="divide-y divide-border">
              {data!.conversations.map((conv) => (
                <ConversationRow
                  key={conv.id}
                  channel={channelDisplayName(conv.channel)}
                  contactName={conv.contact_name || conv.contact_phone || 'Unknown'}
                  lastMessage={conv.last_message_preview || '(no messages)'}
                  timestamp={formatTimestamp(conv.last_message_at, '—')}
                  status={conv.status === 'open' ? 'waiting' : 'replied'}
                  onClick={() => router.push(`/business/inbox/${conv.id}`)}
                />
              ))}
            </div>
          </Card>
        ) : (
          <Card className="rounded-xl shadow-sm">
            <EmptyState variant="inbox" icon={Inbox} />
          </Card>
        )}
      </div>
    </div>
  )
}
