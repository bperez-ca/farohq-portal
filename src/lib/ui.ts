// shadcn/ui Base Components
export * from '../components/ui/accordion';
export * from '../components/ui/alert';
export * from '../components/ui/alert-dialog';
export * from '../components/ui/aspect-ratio';
export * from '../components/ui/avatar';
export * from '../components/ui/badge';
export * from '../components/ui/breadcrumb';
export * from '../components/ui/button';
export * from '../components/ui/calendar';
export * from '../components/ui/card';
export * from '../components/ui/carousel';
export * from '../components/ui/chart';
export * from '../components/ui/checkbox';
export * from '../components/ui/collapsible';
export * from '../components/ui/command';
export * from '../components/ui/context-menu';
export * from '../components/ui/dialog';
export * from '../components/ui/drawer';
export * from '../components/ui/dropdown-menu';
export * from '../components/ui/form';
export * from '../components/ui/hover-card';
export * from '../components/ui/input';
export * from '../components/ui/input-otp';
export * from '../components/ui/label';
export * from '../components/ui/menubar';
export * from '../components/ui/navigation-menu';
export * from '../components/ui/pagination';
export * from '../components/ui/popover';
export * from '../components/ui/progress';
export * from '../components/ui/radio-group';
export * from '../components/ui/resizable';
export * from '../components/ui/scroll-area';
export * from '../components/ui/select';
export * from '../components/ui/separator';
export * from '../components/ui/sheet';
export * from '../components/ui/skeleton';
export * from '../components/ui/slider';
export * from '../components/ui/sonner';
export * from '../components/ui/switch';
export * from '../components/ui/table';
export * from '../components/ui/tabs';
export * from '../components/ui/textarea';
export * from '../components/ui/toast';
// Note: toaster exports Toaster, but sonner also exports Toaster - using sonner's version
// export * from '../components/ui/toaster';
export * from '../components/ui/toggle';
export * from '../components/ui/toggle-group';
export * from '../components/ui/tooltip';

// Business Components (from mocks)
export * from '../components/BrandLogo';
export * from '../components/Logo';
export * from '../components/Navigation';
export * from '../components/FeatureCard';
export * from '../components/ui/CaptureBadge';
export * from '../components/ui/CommandPalette';
export * from '../components/ui/ConversationRow';
export * from '../components/ui/GooglePreviewCard';
export * from '../components/ui/Modal';
export * from '../components/ui/PresenceRow';
export * from '../components/ui/ProviderLogo';
export * from '../components/ui/ReviewItem';
export * from '../components/ui/SettingsNav';
export * from '../components/ui/StatCard';
export * from '../components/ui/StatusChip';
export * from '../components/ui/WeeklyDigestModal';

// Shared Components (framework-agnostic versions)
// Navigation Components
export * from '../components/shared/TopNav';
export * from '../components/shared/BottomNavMobile';
export * from '../components/shared/Breadcrumbs';
export type { BreadcrumbItemType } from '../components/shared/Breadcrumbs';
export * from '../components/shared/PageHeader';
export * from '../components/shared/KPITooltip';

// Contexts
export * from '../contexts/ThemeContext';

// Hooks
// Note: Hooks are client-only and should be imported directly from their source files
// in client components. Not exporting here to avoid server/client boundary issues.
// export * from '../hooks/use-toast';
// export * from '../hooks/useBrandTheme';
// export * from '../hooks/useTheme';

// Lib utilities
export { cn } from '../lib/utils';
export * from '../lib/theme';

// Types
export * from '../lib/types';
export * from '../lib/reviews/types';
export type { ProviderId } from '../lib/reviews/types';

// Re-export common types
export type { ButtonProps } from '../components/ui/button';
export type { BadgeProps } from '../components/ui/badge';
export type { CalendarProps } from '../components/ui/calendar';
export type { InputProps } from '../components/ui/input';
