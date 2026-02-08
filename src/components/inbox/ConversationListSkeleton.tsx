import { Skeleton } from '@/lib/ui';

export function ConversationListSkeleton() {
  return (
    <div className="flex flex-col p-4 gap-3">
      <Skeleton className="h-9 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-12" />
        <Skeleton className="h-6 w-20" />
      </div>
      <div className="flex-1 space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-3 p-3">
            <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
