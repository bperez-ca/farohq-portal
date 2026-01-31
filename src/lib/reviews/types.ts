export type ReviewSourceType = "local" | "product";

export type ProviderId =
  | "google"
  | "yelp"
  | "apple"
  | "bing"
  | "trustpilot"
  | "yotpo"
  | "judgeme"
  | "stamped";

export type ReviewStatus = "new" | "drafted" | "replied" | "escalated" | "flagged";

export interface Review {
  id: string;
  provider: ProviderId;
  sourceType: ReviewSourceType;
  rating: 1 | 2 | 3 | 4 | 5;
  title?: string;
  body: string;
  author?: string;
  sku?: string;
  createdAt: string;
  permalink?: string;
  canReply: boolean;
  status: ReviewStatus;
  labels?: string[];
  replies?: Array<{
    id: string;
    body: string;
    createdAt: string;
    providerPosted?: boolean;
  }>;
}

export interface ReviewsState {
  reviews: Review[];
  lastImportedAt?: string;
}

export interface ReviewsFilters {
  providers: ProviderId[];
  stars?: number | "4plus";
  status?: ReviewStatus | "all";
  source?: ReviewSourceType | "all";
  query?: string;
}

export interface AutomationConfig {
  autoThank5Star: boolean;
  escalateThreeOrLess: boolean;
  keywordAlerts: string[];
}

export interface AutomationLogItem {
  id: string;
  ts: string;
  reviewId: string;
  action: "auto_thanked" | "escalated" | "keyword_alert";
  note?: string;
}

