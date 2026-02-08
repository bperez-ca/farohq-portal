'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/lib/ui';
import { EmptyState } from '@/components/shared/EmptyState';
import { Inbox } from 'lucide-react';
import { useAuthSession } from '@/contexts/AuthSessionContext';
import { ConversationList } from '@/components/inbox/ConversationList';
import { ConversationThread } from '@/components/inbox/ConversationThread';
import { ContactPanel } from '@/components/inbox/ContactPanel';
import { ContactPanelSkeleton } from '@/components/inbox/ContactPanelSkeleton';
import { useEffect, useState, Suspense } from 'react';
import { authenticatedFetch } from '@/lib/authenticated-fetch';
import type { Conversation } from '@/lib/conversations/types';

/**
 * Inbox: single-page layout with conversation list (left), thread (center), contact panel (right).
 * Selection and filters via searchParams: conversation, q, assigned_to.
 */
function BusinessInboxContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeOrgId, loading: sessionLoading } = useAuthSession();
  const selectedId = searchParams.get('conversation') ?? undefined;

  const goBackToList = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('conversation');
    router.push(`/business/inbox?${next.toString()}`);
  };

  const [contactConversation, setContactConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    if (!selectedId || !activeOrgId) {
      setContactConversation(null);
      return;
    }
    authenticatedFetch(
      `/api/v1/conversations/${selectedId}?tenant_id=${encodeURIComponent(activeOrgId)}`
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Conversation | null) => setContactConversation(data))
      .catch(() => setContactConversation(null));
  }, [selectedId, activeOrgId]);

  if (sessionLoading) {
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
        <div className="flex h-[calc(100vh-140px)] max-w-7xl mx-auto px-4 md:px-6" />
      </div>
    );
  }

  if (!activeOrgId) {
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
          <Card className="rounded-xl shadow-sm">
            <EmptyState variant="inbox" icon={Inbox} />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 md:pb-6 flex flex-col">
      <PageHeader
        breadcrumbs={[
          { label: 'Business', href: '/business/dashboard' },
          { label: 'Inbox' },
        ]}
        title="Inbox"
        subtitle="Unified lead conversations"
      />
      <div className="flex flex-1 min-h-0 max-w-full">
        {/* List - left, 320px on desktop; full width on mobile when no selection */}
        <div
          className={`w-full md:w-80 border-r flex-shrink-0 flex flex-col bg-background ${
            selectedId ? 'hidden md:flex' : 'flex'
          }`}
        >
          <ConversationList selectedId={selectedId} />
        </div>

        {/* Thread - center, flexible */}
        <div
          className={`flex-1 flex flex-col min-w-0 bg-muted/30 ${
            selectedId ? 'flex' : 'hidden md:flex'
          }`}
        >
          {selectedId ? (
            <Card className="rounded-none md:rounded-l-none border-0 shadow-none flex-1 flex flex-col min-h-0 m-0">
              <ConversationThread
                conversationId={selectedId}
                showBack={true}
                onBack={goBackToList}
              />
            </Card>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <EmptyState variant="inbox" icon={Inbox} />
            </div>
          )}
        </div>

        {/* Contact panel - right, 280px, hidden on small screens */}
        {selectedId && (
          <div className="w-72 border-l flex-shrink-0 hidden lg:flex flex-col bg-background">
            {contactConversation ? (
              <ContactPanel conversation={contactConversation} />
            ) : (
              <ContactPanelSkeleton />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BusinessInboxPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-muted-foreground">Loading…</div></div>}>
      <BusinessInboxContent />
    </Suspense>
  );
}
