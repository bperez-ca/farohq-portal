import * as React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export interface BreadcrumbItemType {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItemType[];
  LinkComponent?: React.ComponentType<{ href: string; children: React.ReactNode }>;
  onNavigate?: (path: string) => void;
}

export function Breadcrumbs({ items, LinkComponent, onNavigate }: BreadcrumbsProps) {
  const Link = LinkComponent || (({ href, children, ...props }: any) => {
    if (onNavigate) {
      return (
        <a href={href} onClick={(e) => { e.preventDefault(); onNavigate(href); }} {...props}>
          {children}
        </a>
      );
    }
    return <a href={href} {...props}>{children}</a>;
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <div key={index} className="flex items-center gap-2">
              <BreadcrumbItem>
                {isLast || !item.href ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </div>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
