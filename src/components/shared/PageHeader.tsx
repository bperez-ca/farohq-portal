import { ReactNode } from "react";
import { Breadcrumbs, BreadcrumbItemType } from "@/components/shared/Breadcrumbs";

interface PageHeaderProps {
  breadcrumbs: BreadcrumbItemType[];
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  LinkComponent?: React.ComponentType<{ href: string; children: React.ReactNode }>;
  onNavigate?: (path: string) => void;
}

export function PageHeader({ 
  breadcrumbs, 
  title, 
  subtitle, 
  actions,
  LinkComponent,
  onNavigate,
}: PageHeaderProps) {
  return (
    <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-black/5 dark:border-white/10">
      <div className="px-6 py-4">
        <div className="mb-3">
          <Breadcrumbs items={breadcrumbs} LinkComponent={LinkComponent} onNavigate={onNavigate} />
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-semibold">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>

          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}








