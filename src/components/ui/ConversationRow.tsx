import { Instagram, MessageSquare, Mail, Facebook, Phone } from "lucide-react";

interface ConversationRowProps {
  channel: string;
  contactName: string;
  lastMessage: string;
  timestamp: string;
  status: "waiting" | "replied";
  unread?: boolean;
  onClick?: () => void;
}

const channelConfig = {
  Instagram: {
    icon: Instagram,
    color: "text-pink-600 dark:text-pink-400",
    bg: "bg-pink-50 dark:bg-pink-950/30",
  },
  Facebook: {
    icon: Facebook,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30",
  },
  WhatsApp: {
    icon: MessageSquare,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-950/30",
  },
  SMS: {
    icon: MessageSquare,
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-100 dark:bg-slate-800",
  },
  Email: {
    icon: Mail,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/30",
  },
  "Google Business": {
    icon: MessageSquare,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30",
  },
};

export function ConversationRow({
  channel,
  contactName,
  lastMessage,
  timestamp,
  status,
  unread = false,
  onClick,
}: ConversationRowProps) {
  const config = channelConfig[channel as keyof typeof channelConfig] || channelConfig.SMS;
  const Icon = config.icon;

  return (
    <div
      className={`p-4 border-b dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
        unread ? "bg-blue-50/30 dark:bg-blue-950/20" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${config.bg} mt-0.5 flex-shrink-0 relative`}>
          <Icon className={`w-4 h-4 ${config.color}`} />
          {unread && (
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white dark:border-slate-900" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className={`font-medium truncate ${unread ? "font-semibold" : ""}`}>
                {contactName}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                  status === "waiting"
                    ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
                    : "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                }`}
              >
                {status === "waiting" ? "New" : "Replied"}
              </span>
            </div>
            <span className="text-xs text-muted-foreground flex-shrink-0">{timestamp}</span>
          </div>
          <p className="text-sm text-muted-foreground truncate">{lastMessage}</p>
        </div>
      </div>
    </div>
  );
}
