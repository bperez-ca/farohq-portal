import { StatusChip } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

interface PresenceRowProps {
  platform: string;
  status: "synced" | "needs-update" | "missing";
  phone: string;
  hours: string;
  onAction?: () => void;
}

export function PresenceRow({
  platform,
  status,
  phone,
  hours,
  onAction,
}: PresenceRowProps) {
  const statusMap = {
    synced: { label: "Synced", variant: "success" as const },
    "needs-update": { label: "Needs Update", variant: "warning" as const },
    missing: { label: "Not Connected", variant: "danger" as const },
  };

  return (
    <tr className="border-b dark:border-slate-700 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <td className="p-4">
        <div className="font-medium">{platform}</div>
      </td>
      <td className="p-4">
        <div className="text-sm text-muted-foreground">
          {phone} • {hours}
        </div>
      </td>
      <td className="p-4">
        <StatusChip
          label={statusMap[status].label}
          variant={statusMap[status].variant}
        />
      </td>
      <td className="p-4 text-right">
        {status !== "synced" && (
          <Button
            onClick={onAction}
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
          >
            {status === "missing" ? "Connect" : "Fix"}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </td>
    </tr>
  );
}
