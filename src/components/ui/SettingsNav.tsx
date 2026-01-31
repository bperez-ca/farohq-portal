"use client";

import * as React from "react";
import {
  User,
  Clock,
  Briefcase,
  Image,
  FileText,
  Link as LinkIcon,
  MessageSquare
} from "lucide-react";

const settingsSections = [
  { id: "profile", label: "Profile", href: "/business/settings/profile", icon: User },
  { id: "hours", label: "Hours", href: "/business/settings/hours", icon: Clock },
  { id: "services-products", label: "Services & Products", href: "/business/settings/services-products", icon: Briefcase },
  { id: "media", label: "Media", href: "/business/settings/media", icon: Image },
  { id: "posts-qa", label: "Posts & Q&A", href: "/business/settings/posts-qa", icon: FileText },
  { id: "links-attributes", label: "Links & Attributes", href: "/business/settings/links-attributes", icon: LinkIcon },
  { id: "messaging", label: "Messaging", href: "/business/settings/messaging", icon: MessageSquare },
];

interface SettingsNavProps {
  LinkComponent?: React.ComponentType<{ href: string; className?: string; children: React.ReactNode }>;
  pathname?: string;
  getPathname?: () => string;
  onNavigate?: (path: string) => void;
}

export function SettingsNav({ LinkComponent, pathname: pathnameProp, getPathname, onNavigate }: SettingsNavProps) {
  const [pathname, setPathname] = React.useState(pathnameProp || "");

  React.useEffect(() => {
    if (getPathname) {
      setPathname(getPathname());
    } else if (pathnameProp) {
      setPathname(pathnameProp);
    }
  }, [pathnameProp, getPathname]);

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
    <>
      <nav className="hidden md:block w-56 flex-shrink-0">
        <div className="sticky top-24 space-y-1">
          {settingsSections.map((section) => {
            const Icon = section.icon;
            const isActive = pathname === section.href;
            return (
              <Link
                key={section.id}
                href={section.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-black/5 dark:bg-white/10 text-black dark:text-white"
                    : "text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                {section.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="md:hidden mb-6 overflow-x-auto -mx-6 px-6">
        <div className="flex gap-2 min-w-max">
          {settingsSections.map((section) => {
            const Icon = section.icon;
            const isActive = pathname === section.href;
            return (
              <Link
                key={section.id}
                href={section.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-black/10 dark:bg-white/10 text-black dark:text-white"
                    : "bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60"
                }`}
              >
                <Icon className="w-4 h-4" />
                {section.label}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
