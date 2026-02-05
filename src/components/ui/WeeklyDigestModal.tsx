"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { theme } from "@/lib/theme";
import { TrendingUp, Clock, DollarSign, Star, MessageSquare, Target } from "lucide-react";

interface WeeklyDigestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metrics: {
    leads?: number;
    bookedJobs?: number;
    revenue?: number;
    avgReplyTime?: string;
    reviews?: number;
    totalLeads?: number;
    totalBookedJobs?: number;
    totalRevenue?: number;
  };
  businessName?: string;
  isAgency?: boolean;
}

export function WeeklyDigestModal({
  open,
  onOpenChange,
  metrics,
  businessName = "Your Business",
  isAgency = false,
}: WeeklyDigestModalProps) {
  const dateRange = `${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric" }
  )} - ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto dark:bg-slate-900 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle>Weekly Email Digest Preview</DialogTitle>
          <DialogDescription>
            This is how your weekly summary email will look
          </DialogDescription>
        </DialogHeader>

        <div className="bg-white dark:bg-slate-950 rounded-lg border dark:border-slate-800 overflow-hidden">
          <div
            className="p-6 text-white"
            style={{ backgroundColor: theme.brandColor }}
          >
            <div className="text-sm font-medium opacity-90 mb-1">
              {theme.brandName}
            </div>
            <h1 className="text-2xl font-bold mb-2">
              {isAgency ? "Agency Performance" : "Weekly Growth Report"}
            </h1>
            <p className="text-sm opacity-90">{dateRange}</p>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">
                {isAgency
                  ? `Hi there! Here's how your clients performed this week:`
                  : `Hi ${businessName}! Here's how your business grew this week:`}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border dark:border-slate-800">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                  <div className="text-sm text-muted-foreground">
                    {isAgency ? "Total Leads" : "New Leads"}
                  </div>
                </div>
                <div className="text-2xl font-bold">
                  {metrics.leads || metrics.totalLeads || 0}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border dark:border-slate-800">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-green-500" />
                  <div className="text-sm text-muted-foreground">
                    {isAgency ? "Jobs Booked" : "Booked Jobs"}
                  </div>
                </div>
                <div className="text-2xl font-bold">
                  {metrics.bookedJobs || metrics.totalBookedJobs || 0}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border dark:border-slate-800">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                  <div className="text-sm text-muted-foreground">Revenue</div>
                </div>
                <div className="text-2xl font-bold">
                  ${(metrics.revenue || metrics.totalRevenue || 0).toLocaleString()}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border dark:border-slate-800">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  <div className="text-sm text-muted-foreground">Avg Reply</div>
                </div>
                <div className="text-2xl font-bold">
                  {metrics.avgReplyTime || "12m"}
                </div>
              </div>
            </div>

            {!isAgency && (
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <div className="font-semibold">Reviews</div>
                </div>
                <p className="text-sm">
                  You received <span className="font-bold">{metrics.reviews || 0}</span> new
                  reviews this week. Keep up the great work!
                </p>
              </div>
            )}

            <div className="border-t dark:border-slate-800 pt-6">
              <h3 className="font-semibold mb-3">Key Insights</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                  <span>
                    {isAgency
                      ? "Your clients converted 15% more leads this week compared to last week."
                      : "Your response time improved by 20% compared to last week."}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Target className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" />
                  <span>
                    {isAgency
                      ? "3 clients are ready to upgrade to premium features."
                      : "You're booking 1 out of every 3 leads - that's excellent!"}
                  </span>
                </li>
              </ul>
            </div>

            <div
              className="p-4 rounded-lg text-white text-center"
              style={{ backgroundColor: theme.brandColor }}
            >
              <p className="font-semibold mb-2">
                {isAgency
                  ? "View Full Dashboard"
                  : "Want to see the full breakdown?"}
              </p>
              <p className="text-sm opacity-90">
                {isAgency
                  ? "Log in to see detailed metrics for each client"
                  : "Log in to see charts, trends, and detailed insights"}
              </p>
            </div>

            <div className="text-center text-xs text-muted-foreground">
              <p>
                You&apos;re receiving this because you&apos;re subscribed to weekly reports.
              </p>
              <p className="mt-1">
                © {new Date().getFullYear()} {theme.brandName}. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
