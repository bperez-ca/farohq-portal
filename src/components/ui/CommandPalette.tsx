"use client";

import { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Settings,
  MessageSquare,
  Star,
  Eye,
  Building,
  TrendingUp,
  DollarSign,
  UserPlus,
  RefreshCw,
  Mail,
  LogOut,
} from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate?: (path: string) => void;
}

export function CommandPalette({ open, onOpenChange, onNavigate }: CommandPaletteProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  if (!mounted) return null;

  const handleSelect = (callback: () => void) => {
    onOpenChange(false);
    callback();
  };

  const navigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else if (typeof window !== "undefined") {
      window.location.href = path;
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => handleSelect(() => navigate("/agency/dashboard"))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Agency Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate("/agency/leads"))}>
            <Users className="mr-2 h-4 w-4" />
            <span>Lead Pipeline</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate("/agency/diagnostics"))}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Growth Diagnostics</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate("/agency/kpis"))}>
            <BarChart3 className="mr-2 h-4 w-4" />
            <span>Agency KPIs</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate("/agency/settings/branding"))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate("/business/dashboard"))}>
            <Building className="mr-2 h-4 w-4" />
            <span>Business Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate("/business/inbox"))}>
            <MessageSquare className="mr-2 h-4 w-4" />
            <span>Inbox</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate("/business/reviews"))}>
            <Star className="mr-2 h-4 w-4" />
            <span>Reviews</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate("/business/presence"))}>
            <Eye className="mr-2 h-4 w-4" />
            <span>Presence</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate("/business/insights"))}>
            <TrendingUp className="mr-2 h-4 w-4" />
            <span>Insights</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate("/business/revenue"))}>
            <DollarSign className="mr-2 h-4 w-4" />
            <span>Revenue</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Clients">
          <CommandItem onSelect={() => handleSelect(() => navigate("/business/dashboard"))}>
            <Building className="mr-2 h-4 w-4" />
            <span>View as Joe's HVAC</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate("/business/dashboard"))}>
            <Building className="mr-2 h-4 w-4" />
            <span>View as Bella Salon</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate("/agency/dashboard"))}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Exit impersonation</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => handleSelect(() => navigate("/agency/leads"))}>
            <UserPlus className="mr-2 h-4 w-4" />
            <span>New Prospect</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate("/agency/diagnostics"))}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Generate Diagnostic</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate("/business/reviews"))}>
            <Mail className="mr-2 h-4 w-4" />
            <span>Request a review</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate("/business/presence"))}>
            <RefreshCw className="mr-2 h-4 w-4" />
            <span>Sync All Now</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect(() => navigate("/agency/kpis"))}>
            <BarChart3 className="mr-2 h-4 w-4" />
            <span>Open KPIs</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
