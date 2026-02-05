"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { LeadSource } from "@/lib/types";
// @ts-expect-error - sonner is an optional peer dependency
import { toast } from "sonner";

const leadSources: LeadSource[] = [
  "Instagram DM",
  "Facebook",
  "Google Chat",
  "Web Chat",
  "SMS",
  "Email",
];

interface CaptureBadgeProps {
  intervalMinutes?: number;
}

export function CaptureBadge({ intervalMinutes = 3 }: CaptureBadgeProps) {
  const [captureCount, setCaptureCount] = useState(0);
  const [lastSource, setLastSource] = useState<LeadSource | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const randomSource = leadSources[Math.floor(Math.random() * leadSources.length)];
      setLastSource(randomSource);
      setCaptureCount((prev) => prev + 1);

      toast.success(`New lead captured from ${randomSource}!`, {
        duration: 3000,
      });
    }, intervalMinutes * 60 * 1000);

    return () => clearInterval(interval);
  }, [intervalMinutes]);

  if (captureCount === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 hidden md:block">
      <Badge
        variant="default"
        className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 text-sm font-semibold shadow-lg"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        {captureCount} lead{captureCount !== 1 ? "s" : ""} captured
        {lastSource && ` · Latest: ${lastSource}`}
      </Badge>
    </div>
  );
}
