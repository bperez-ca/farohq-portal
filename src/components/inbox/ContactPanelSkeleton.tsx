import { Skeleton } from '@/lib/ui';

export function ContactPanelSkeleton() {
  return (
    <div className="flex flex-col p-4 gap-4">
      <div className="flex flex-col items-center gap-2">
        <Skeleton className="h-16 w-16 rounded-full" />
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-4 w-36" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  );
}
