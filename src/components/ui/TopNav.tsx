"use client";

import * as React from "react";
import { theme } from "@/lib/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { Building2, LayoutDashboard, Settings, Moon, Sun, FileText, Users, BarChart3, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { useState, useEffect } from "react";

interface TopNavProps {
  LinkComponent?: React.ComponentType<{ href: string; className?: string; style?: React.CSSProperties; children: React.ReactNode }>;
  pathname?: string;
  getPathname?: () => string;
  onNavigate?: (path: string) => void;
}

export function TopNav({ LinkComponent, pathname: pathnameProp, getPathname, onNavigate }: TopNavProps) {
  const { theme: currentTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [pathname, setPathname] = useState(pathnameProp || "");

  useEffect(() => {
    setMounted(true);
    if (getPathname) {
      setPathname(getPathname());
    } else if (pathnameProp) {
      setPathname(pathnameProp);
    }
  }, [pathnameProp, getPathname]);

  const isActive = (path: string) => {
    return pathname?.startsWith(path) || false;
  };

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
    <nav className="hidden md:flex items-center justify-between px-6 py-4 border-b bg-white dark:bg-slate-900 dark:border-slate-800">
      <Link href="/" className="flex items-center gap-2 font-bold text-xl">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
          style={{ backgroundColor: theme.brandColor }}
        >
          F
        </div>
        {theme.brandName}
      </Link>
      <div className="flex items-center gap-4">
        <button
          onClick={() => setCommandOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <Search className="w-4 h-4" />
          <span className="hidden lg:inline">Search</span>
          <kbd className="hidden lg:inline ml-2 pointer-events-none h-5 select-none items-center gap-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            ⌘K
          </kbd>
        </button>
        <Link
          href="/agency/dashboard"
          className={`flex items-center gap-2 text-sm font-medium transition-all px-3 py-1.5 rounded-full ${
            pathname === "/agency/dashboard"
              ? "font-bold text-foreground dark:bg-white/10"
              : "text-muted-foreground hover:text-foreground"
          }`}
          style={
            pathname === "/agency/dashboard"
              ? {
                  backgroundColor:
                    currentTheme === "light"
                      ? `${theme.brandColor}15`
                      : undefined,
                }
              : {}
          }
        >
          <Building2 className="w-4 h-4" />
          Agency
        </Link>
        <Link
          href="/agency/leads"
          className={`flex items-center gap-2 text-sm font-medium transition-all px-3 py-1.5 rounded-full ${
            isActive("/agency/leads")
              ? "font-bold text-foreground dark:bg-white/10"
              : "text-muted-foreground hover:text-foreground"
          }`}
          style={
            isActive("/agency/leads")
              ? {
                  backgroundColor:
                    currentTheme === "light"
                      ? `${theme.brandColor}15`
                      : undefined,
                }
              : {}
          }
        >
          <Users className="w-4 h-4" />
          Leads
        </Link>
        <Link
          href="/agency/diagnostics"
          className={`flex items-center gap-2 text-sm font-medium transition-all px-3 py-1.5 rounded-full ${
            isActive("/agency/diagnostics")
              ? "font-bold text-foreground dark:bg-white/10"
              : "text-muted-foreground hover:text-foreground"
          }`}
          style={
            isActive("/agency/diagnostics")
              ? {
                  backgroundColor:
                    currentTheme === "light"
                      ? `${theme.brandColor}15`
                      : undefined,
                }
              : {}
          }
        >
          <FileText className="w-4 h-4" />
          Diagnostics
        </Link>
        <Link
          href="/agency/kpis"
          className={`flex items-center gap-2 text-sm font-medium transition-all px-3 py-1.5 rounded-full ${
            isActive("/agency/kpis")
              ? "font-bold text-foreground dark:bg-white/10"
              : "text-muted-foreground hover:text-foreground"
          }`}
          style={
            isActive("/agency/kpis")
              ? {
                  backgroundColor:
                    currentTheme === "light"
                      ? `${theme.brandColor}15`
                      : undefined,
                }
              : {}
          }
        >
          <BarChart3 className="w-4 h-4" />
          KPIs
        </Link>
        <Link
          href="/business/dashboard"
          className={`flex items-center gap-2 text-sm font-medium transition-all px-3 py-1.5 rounded-full ${
            isActive("/business")
              ? "font-bold text-foreground dark:bg-white/10"
              : "text-muted-foreground hover:text-foreground"
          }`}
          style={
            isActive("/business")
              ? {
                  backgroundColor:
                    currentTheme === "light"
                      ? `${theme.brandColor}15`
                      : undefined,
                }
              : {}
          }
        >
          <LayoutDashboard className="w-4 h-4" />
          Business
        </Link>
        <Link
          href="/agency/settings/branding"
          className={`flex items-center gap-2 text-sm font-medium transition-all px-3 py-1.5 rounded-full ${
            isActive("/agency/settings")
              ? "font-bold text-foreground dark:bg-white/10"
              : "text-muted-foreground hover:text-foreground"
          }`}
          style={
            isActive("/agency/settings")
              ? {
                  backgroundColor:
                    currentTheme === "light"
                      ? `${theme.brandColor}15`
                      : undefined,
                }
              : {}
          }
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="ml-2"
          >
            {currentTheme === "light" ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>
      <CommandPalette 
        open={commandOpen} 
        onOpenChange={setCommandOpen}
        onNavigate={onNavigate}
      />
    </nav>
  );
}
