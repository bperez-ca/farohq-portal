import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

interface ReviewItemProps {
  stars: number;
  reviewerName: string;
  platform: string;
  timestamp: string;
  text: string;
  hasReply?: boolean;
  platformConnected?: boolean;
  onReply?: () => void;
}

export function ReviewItem({
  stars,
  reviewerName,
  platform,
  timestamp,
  text,
  hasReply = false,
  platformConnected: _platformConnected = true,
  onReply,
}: ReviewItemProps) {
  return (
    <Card className="p-4 rounded-xl dark:bg-slate-800 dark:border-slate-700">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < stars
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="font-medium">{reviewerName}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">{platform}</Badge>
              <span>{timestamp}</span>
            </div>
          </div>
        </div>
        <p className="text-sm">{text}</p>
        {!hasReply && onReply && (
          <Button onClick={onReply} variant="outline" size="sm">
            Reply
          </Button>
        )}
        {hasReply && (
          <div className="text-xs text-muted-foreground">Already replied</div>
        )}
      </div>
    </Card>
  );
}
