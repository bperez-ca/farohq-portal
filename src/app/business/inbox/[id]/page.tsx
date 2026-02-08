'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Redirect /business/inbox/[id] to /business/inbox?conversation=[id]
 * so bookmarks and links keep working with the single-page inbox layout.
 */
export default function InboxConversationRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  useEffect(() => {
    if (id) {
      router.replace(`/business/inbox?conversation=${encodeURIComponent(id)}`);
    } else {
      router.replace('/business/inbox');
    }
  }, [id, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  );
}
