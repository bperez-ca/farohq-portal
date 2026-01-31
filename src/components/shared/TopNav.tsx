"use client";

import * as React from "react";
import { Building2, LayoutDashboard, Settings, Moon, Sun, FileText, Users, BarChart3, Search, LogOut, User } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { CommandPalette } from "@/components/ui/CommandPalette";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TopNavProps {
  LinkComponent?: React.ComponentType<{ href: string; className?: string; style?: React.CSSProperties; children: React.ReactNode }>;
  pathname?: string;
  getPathname?: () => string;
  onNavigate?: (path: string) => void;
  user?: {
    name?: string;
    email?: string;
    avatar?: string;
  } | null;
  onLogout?: () => void | Promise<void>;
  logoutUrl?: string;
}

export function TopNav({ 
  LinkComponent, 
  pathname: pathnameProp, 
  getPathname, 
  onNavigate,
  user,
  onLogout,
  logoutUrl = '/api/auth/logout',
}: TopNavProps) {
  const { theme: currentTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [pathname, setPathname] = React.useState(pathnameProp || "");

  React.useEffect(() => {
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

  const handleLogout = async () => {
    if (onLogout) {
      await onLogout();
    } else if (logoutUrl) {
      // Default logout behavior: POST to logout URL
      try {
        const response = await fetch(logoutUrl, { method: 'POST' });
        if (response.ok || response.redirected) {
          // If redirect, follow it
          if (response.redirected) {
            window.location.href = response.url;
          } else if (onNavigate) {
            onNavigate('/signin');
          } else {
            window.location.href = '/signin';
          }
        }
      } catch (error) {
        console.error('Logout failed:', error);
        // Still try to navigate to signin
        if (onNavigate) {
          onNavigate('/signin');
        } else {
          window.location.href = '/signin';
        }
      }
    }
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

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (user?.name) {
      return user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <nav className="hidden md:flex items-center justify-between px-6 py-4 border-b bg-white dark:bg-slate-900 dark:border-slate-800 sticky top-0 z-50">
      <Link href="/" className="flex items-center gap-2 font-bold text-xl">
        <BrandLogo size="md" showText={true} />
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
            pathname === "/agency/dashboard" && currentTheme === "light"
              ? {
                  backgroundColor: `var(--brand-color, #2563eb)15`,
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
            isActive("/agency/leads") && currentTheme === "light"
              ? {
                  backgroundColor: `var(--brand-color, #2563eb)15`,
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
            isActive("/agency/diagnostics") && currentTheme === "light"
              ? {
                  backgroundColor: `var(--brand-color, #2563eb)15`,
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
            isActive("/agency/kpis") && currentTheme === "light"
              ? {
                  backgroundColor: `var(--brand-color, #2563eb)15`,
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
            isActive("/business") && currentTheme === "light"
              ? {
                  backgroundColor: `var(--brand-color, #2563eb)15`,
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
            isActive("/agency/settings") && currentTheme === "light"
              ? {
                  backgroundColor: `var(--brand-color, #2563eb)15`,
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
            className="ml-2 text-foreground"
            aria-label={currentTheme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          >
            {currentTheme === "light" ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4 text-foreground" />
            )}
          </Button>
        )}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar} alt={user.name || user.email || 'User'} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  {user.name && (
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                  )}
                  {user.email && (
                    <p className="text-xs leading-none text-muted-foreground mt-1">
                      {user.email}
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/agency/settings/profile" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/agency/settings/branding" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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

