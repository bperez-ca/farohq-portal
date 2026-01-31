import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, XCircle, Clock, Check } from "lucide-react";
import { LucideIcon } from "lucide-react";

type StatusVariant =
  | "synced"
  | "needsUpdate"
  | "needsAttention"  // Alias for needsUpdate; use "Needs attention" (UX-007)
  | "notConnected"
  | "waiting"
  | "replied"
  | "success"
  | "warning"
  | "danger";

interface StatusChipProps {
  label?: string;  // Optional; defaults below for global status language (UX-007)
  variant: StatusVariant;
  icon?: LucideIcon;
}

const DEFAULT_LABELS: Record<StatusVariant, string> = {
  synced: "Synced",
  needsUpdate: "Needs attention",
  needsAttention: "Needs attention",
  notConnected: "Not connected",
  waiting: "Waiting",
  replied: "Replied",
  success: "Synced",
  warning: "Needs attention",
  danger: "Not connected",
};


// Pre-calculated styles with ensured contrast
// All combinations have been verified to meet WCAG AA (4.5:1) contrast ratio
const variantConfig: Record<StatusVariant, {
  styles: string;
  icon: LucideIcon;
}> = {
  synced: {
    // green-100 bg with green-800 text (high contrast)
    styles: "bg-green-100/80 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-200 border-green-200/50 dark:border-green-900/50",
    icon: CheckCircle,
  },
  needsUpdate: {
    // amber-100 bg with amber-900 text (high contrast)
    styles: "bg-amber-100/80 text-amber-900 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-200 border-amber-200/50 dark:border-amber-900/50",
    icon: AlertTriangle,
  },
  needsAttention: {
    // Same as needsUpdate
    styles: "bg-amber-100/80 text-amber-900 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-200 border-amber-200/50 dark:border-amber-900/50",
    icon: AlertTriangle,
  },
  notConnected: {
    // rose-100 bg with rose-900 text (high contrast)
    styles: "bg-rose-100/80 text-rose-900 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-200 border-rose-200/50 dark:border-rose-900/50",
    icon: XCircle,
  },
  waiting: {
    // Same as needsUpdate
    styles: "bg-amber-100/80 text-amber-900 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-200 border-amber-200/50 dark:border-amber-900/50",
    icon: Clock,
  },
  replied: {
    // emerald-100 bg with emerald-900 text (high contrast)
    styles: "bg-emerald-100/80 text-emerald-900 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-200 border-emerald-200/50 dark:border-emerald-900/50",
    icon: Check,
  },
  success: {
    // Same as synced
    styles: "bg-green-100/80 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-200 border-green-200/50 dark:border-green-900/50",
    icon: CheckCircle,
  },
  warning: {
    // orange-100 bg with orange-900 text (high contrast)
    styles: "bg-orange-100/80 text-orange-900 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-200 border-orange-200/50 dark:border-orange-900/50",
    icon: AlertTriangle,
  },
  danger: {
    // red-100 bg with red-900 text (high contrast)
    styles: "bg-red-100/80 text-red-900 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-200 border-red-200/50 dark:border-red-900/50",
    icon: XCircle,
  },
};

export function StatusChip({ label, variant, icon: CustomIcon }: StatusChipProps) {
  const config = variantConfig[variant];
  const Icon = CustomIcon || config.icon;
  const displayLabel = label ?? DEFAULT_LABELS[variant];

  return (
    <div
      className={`${config.styles} inline-flex items-center gap-1.5 px-3 py-1 rounded-[var(--border-radius-badge-default)] border font-medium text-xs`}
    >
      <Icon className="w-3.5 h-3.5" />
      {displayLabel}
    </div>
  );
}
