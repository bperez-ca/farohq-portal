export type LeadStage =
  | "Prospect"
  | "Diagnostic Pending"
  | "Diagnostic Ready"
  | "Invited"
  | "Trialing"
  | "Active Client"
  | "Churn Risk"
  | "Churned";

export interface Prospect {
  id: string;
  name: string;
  industry: string;
  city: string;
  phone: string;
  gbpUrl?: string;
  createdAt: string;
  updatedAt: string;
  stage: LeadStage;
  owner?: string;
  lastActivityAt?: string;
  diagnosticId?: string;
  estMonthlyValue?: number;
}

export interface GrowthDiagnostic {
  id: string;
  prospectId: string;
  createdAt: string;
  presenceScore: number;
  reviewsScore: number;
  speedToLeadScore: number;
  notes?: string;
  findings: {
    presence: Array<{
      platform: string;
      status: "Consistent" | "Needs fix";
      issues?: string[];
    }>;
    reviews: {
      currentRating: number;
      benchmark: number;
      last30: number;
      goal: number;
    };
    speedToLead: {
      avgReplyMs: number;
      recommendedMs: number;
    };
  };
  shareToken?: string;
  openCount?: number;
}

export type LeadSource =
  | "Instagram DM"
  | "Facebook"
  | "Google Chat"
  | "Web Chat"
  | "SMS"
  | "Email";

export type EventType =
  | "message_received"
  | "message_replied"
  | "review_requested"
  | "review_received"
  | "quote_sent"
  | "quote_accepted"
  | "booking_marked"
  | "revenue_recorded"
  | "autoresponder_triggered";

export interface Event {
  id: string;
  businessId: string;
  ts: string;
  type: EventType;
  payload?: Record<string, any>;
}

export type DayOfWeek = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export type HoursRange = {
  day: DayOfWeek;
  open: string | null;
  close: string | null;
};

export type SpecialHour = {
  date: string;
  open: string | null;
  close: string | null;
  note?: string;
};

export type ServiceArea = {
  type: "city" | "postal" | "radius";
  value: string;
};

export interface Category {
  primary: string;
  additional: string[];
}

export interface BusinessAddress {
  street: string;
  unit?: string;
  city: string;
  region: string;
  postal: string;
  country: string;
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  x?: string;
  linkedin?: string;
  pinterest?: string;
  tiktok?: string;
  youtube?: string;
}

export interface ActionLinks {
  order?: string;
  reservation?: string;
  booking?: string;
  menu?: string;
  appointment?: string;
  quote?: string;
}

export interface AttributeFlag {
  key: string;
  value: boolean | string;
}

export interface ServiceItem {
  id: string;
  category?: string;
  name: string;
  description?: string;
  price?: number;
  unit?: string;
}

export interface ProductItem {
  id: string;
  name: string;
  category?: string;
  imageUrl?: string;
  price?: number;
  salePrice?: number;
  description?: string;
  buyUrl?: string;
}

export interface MenuSection {
  id: string;
  name: string;
  items: Array<{
    id: string;
    name: string;
    price?: number;
    description?: string;
    imageUrl?: string;
  }>;
}

export type MediaType =
  | "logo"
  | "cover"
  | "interior"
  | "exterior"
  | "team"
  | "product"
  | "before_after"
  | "video";

export interface MediaItem {
  id: string;
  kind: MediaType;
  url: string;
  caption?: string;
  createdAt: string;
}

export type PostType = "update" | "offer" | "event";

export interface BusinessPost {
  id: string;
  type: PostType;
  title: string;
  body?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  startsAt?: string;
  endsAt?: string;
  createdAt: string;
  scheduled?: boolean;
}

export interface QAItem {
  id: string;
  question: string;
  answer?: string;
  isFAQ?: boolean;
}

export interface MessagingSettings {
  enabled: boolean;
  defaultChannel: "SMS" | "Web Chat" | "Instagram DM" | "Facebook" | "Email";
  slaTargetMinutes: number;
  afterHours: {
    enabled: boolean;
    start: string;
    end: string;
    message: string;
  };
  templates: Array<{
    id: string;
    name: string;
    text: string;
  }>;
}

export interface BusinessProfile {
  id: string;
  name: string;
  legalName?: string;
  address?: BusinessAddress;
  serviceAreaEnabled: boolean;
  serviceAreas?: ServiceArea[];
  phones: {
    primary: string;
    alt1?: string;
    alt2?: string;
  };
  website?: string;
  category: Category;
  description?: string;
  hours: HoursRange[];
  specialHours?: SpecialHour[];
  services?: ServiceItem[];
  products?: ProductItem[];
  menus?: MenuSection[];
  media?: MediaItem[];
  posts?: BusinessPost[];
  qa?: QAItem[];
  attributes?: AttributeFlag[];
  links?: ActionLinks;
  socials?: SocialLinks;
  messaging?: MessagingSettings;
  listingsHealthIndex?: number;
  lastSyncedAt?: string;
}

