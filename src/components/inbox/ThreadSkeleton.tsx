import { Skeleton } from '@/lib/ui';

export function ThreadSkeleton() {
  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex items-center gap-3 pb-4 border-b">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="flex-1 space-y-4 py-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
            <Skeleton className="h-14 w-64 rounded-lg" />
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-4">
        <Skeleton className="h-12 flex-1 rounded-lg" />
        <Skeleton className="h-12 w-12 rounded-lg" />
      </div>
    </div>
  );
}
