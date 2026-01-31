"use client";

import * as React from "react";
import { Home, Inbox, Star, MapPin, TrendingUp } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface BottomNavMobileProps {
  LinkComponent?: React.ComponentType<{ href: string; className?: string; style?: React.CSSProperties; children: React.ReactNode }>;
  pathname?: string;
  getPathname?: () => string;
  onNavigate?: (path: string) => void;
}

export function BottomNavMobile({ LinkComponent, pathname: pathnameProp, getPathname, onNavigate }: BottomNavMobileProps) {
  const { brandTheme } = useTheme();
  const [pathname, setPathname] = React.useState(pathnameProp || "");

  React.useEffect(() => {
    if (getPathname) {
      setPathname(getPathname());
    } else if (pathnameProp) {
      setPathname(pathnameProp);
    }
  }, [pathnameProp, getPathname]);

  const isActive = (path: string) => {
    return pathname === path;
  };

  const businessTabs = [
    {
      href: "/business/dashboard",
      icon: Home,
      label: "Home",
    },
    {
      href: "/business/inbox",
      icon: Inbox,
      label: "Inbox",
    },
    {
      href: "/business/reviews",
      icon: Star,
      label: "Reviews",
    },
    {
      href: "/business/presence",
      icon: MapPin,
      label: "Presence",
    },
    {
      href: "/business/insights",
      icon: TrendingUp,
      label: "Insights",
    },
  ];

  const isBusinessPage = pathname.startsWith("/business");
  const isTestPage = pathname.startsWith("/test");

  // Show on business pages or test pages (for testing)
  if (!isBusinessPage && !isTestPage) {
    return null;
  }

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

  // Get brand color from theme or CSS variable
  const getBrandColor = () => {
    if (brandTheme?.primaryColor) {
      return brandTheme.primaryColor;
    }
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      const brandColor = getComputedStyle(root).getPropertyValue('--brand-color').trim();
      if (brandColor) return brandColor;
    }
    return '#2563eb'; // Default brand color
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t dark:border-slate-800 flex items-center justify-around py-2 px-2 z-50">
      {businessTabs.map((tab) => {
        const Icon = tab.icon;
        const active = isActive(tab.href);
        const brandColor = getBrandColor();

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex flex-col items-center gap-1 text-xs py-2 px-3 rounded-lg transition-colors min-w-0 flex-1"
            style={{
              color: active ? brandColor : undefined,
            }}
          >
            <Icon
              className="w-5 h-5 flex-shrink-0"
              style={{
                color: active ? brandColor : undefined,
              }}
            />
            <span
              className={`${active ? "font-semibold" : "text-muted-foreground"} truncate`}
              style={{
                color: active ? brandColor : undefined,
              }}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

