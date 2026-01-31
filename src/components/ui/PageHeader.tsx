import { ReactNode } from "react";
import { Breadcrumbs, BreadcrumbItemType as BreadcrumbItem } from "../shared/Breadcrumbs";

interface PageHeaderProps {
  breadcrumbs: BreadcrumbItem[];
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ breadcrumbs, title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="sticky top-0 z-10 bg-background/80 dark:bg-background/80 backdrop-blur-lg border-b border-black/5 dark:border-white/10">
      <div className="px-6 py-4">
        <div className="mb-3">
          <Breadcrumbs items={breadcrumbs} />
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
