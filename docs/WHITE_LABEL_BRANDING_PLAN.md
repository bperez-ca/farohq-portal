# White-Label Branding Implementation Plan

## Executive Summary

This document outlines a comprehensive plan to fully implement white-label branding throughout the FaroHQ Portal, allowing agencies to customize their portal with their own colors, logos, and branding elements.

## Current State Analysis

### ✅ What's Already Implemented

1. **Brand Theme Provider** (`BrandThemeProvider.tsx`)
   - Fetches brand theme from `/api/v1/brand/by-host`
   - Applies CSS variables dynamically (`--brand-color`, `--brand-color-hover`, `--brand-secondary`)
   - Updates favicon dynamically
   - Caches theme with 15-minute TTL
   - Supports both authenticated (org-id) and public (host-based) resolution

2. **Brand Data Structure**
   ```typescript
   interface BrandTheme {
     primary_color?: string       // ✅ Applied
     secondary_color?: string     // ✅ Applied
     logo_url?: string            // ⚠️ Available but not fully used
     favicon_url?: string         // ✅ Applied
     hide_powered_by?: boolean    // ✅ Used
     can_hide_powered_by?: boolean
     can_configure_domain?: boolean
     tier?: string
     tenant_name?: string         // ⚠️ Available but could be used more
   }
   ```

3. **CSS Infrastructure**
   - CSS variables defined in `globals.css`
   - Utility classes: `.bg-brand`, `.text-brand`, `.bg-brand-accent`
   - Color mapping to Tailwind primary/secondary variables

4. **Brand Components**
   - `BrandLogo` component exists with fallback support
   - `BrandThemeProvider` context with `useBrandTheme()` hook

5. **API Endpoints**
   - `/api/v1/brands` - Get/Update brand info
   - `/api/v1/brand/by-host` - Host-based brand resolution
   - `/api/v1/brand/by-domain` - Domain-based brand resolution

### ⚠️ Gaps & Opportunities

1. **Logo Usage**
   - Logo URL is fetched but not consistently displayed in:
     - Sidebar navigation (currently shows text "FARO")
     - Header/navbar (if exists)
     - Auth pages (signin/signup/login)
     - Email templates
     - Loading screens

2. **Color Application**
   - Brand colors applied to CSS variables but not consistently used in:
     - Button components (some use hardcoded colors)
     - Links and navigation items
     - Accent elements (borders, highlights)
     - Status indicators
     - Charts and visualizations

3. **Additional Branding Elements**
   - Typography (font family, sizes) - not yet supported
   - Spacing/layout customization
   - Border radius customization
   - Custom CSS themes via `theme_json`

4. **Brand Context Usage**
   - `useBrandTheme()` hook exists but not used consistently
   - Components should use theme context instead of hardcoded values

## Implementation Plan

### Phase 1: Core Branding Integration (Week 1)

#### 1.1 Logo Display Integration
**Priority: High**

**Components to Update:**
- [ ] `SidebarNav.tsx` - Replace "FARO" text with `BrandLogo`
- [ ] `Header` (if exists) - Add logo display
- [ ] Auth pages (`/signin`, `/signup`, `/login`) - Add logo at top
- [ ] Loading screens - Show logo during loading
- [ ] `PageHeader` component - Add optional logo prop

**Implementation Steps:**
```typescript
// Example: Update SidebarNav.tsx
import { BrandLogo } from '@/components/BrandLogo'
import { useBrandTheme } from '@/components/branding/BrandThemeProvider'

const { theme } = useBrandTheme()

// Replace text logo with:
<BrandLogo 
  logoUrl={theme?.logo_url} 
  className="h-8 w-auto" 
  alt={theme?.tenant_name || 'Logo'}
/>
```

**Files to Modify:**
- `src/components/navigation/SidebarNav.tsx`
- `src/app/signin/[[...signin]]/page.tsx`
- `src/app/signup/[[...signup]]/page.tsx`
- `src/app/login/page.tsx`
- `src/components/shared/PageHeader.tsx`

#### 1.2 Brand Color Integration in UI Components
**Priority: High**

**Components to Update:**
- [ ] Button components - Use `--brand-color` instead of hardcoded colors
- [ ] Link components - Use brand color for primary links
- [ ] Navigation items - Active state uses brand color
- [ ] Badge components - Use brand color for primary badges
- [ ] Card components - Accent borders use brand color
- [ ] Stat cards - Use brand color for metrics

**Implementation Steps:**
1. Audit all components for hardcoded colors
2. Replace with CSS variables or `bg-brand`/`text-brand` classes
3. Ensure dark mode compatibility

**Components to Review:**
- `src/components/ui/button.tsx` (if custom)
- `src/components/shared/StatCard.tsx`
- `src/components/navigation/NavItem.tsx`
- `src/components/shared/PageHeader.tsx`

#### 1.3 Enhanced Brand Theme Provider
**Priority: Medium**

**Enhancements:**
- [ ] Add typography support (font family from brand)
- [ ] Support for `theme_json` customizations
- [ ] Server-side theme injection for SSR
- [ ] Improved error handling and fallbacks

### Phase 2: Advanced Branding Features (Week 2)

#### 2.1 Typography Customization
**Priority: Medium**

**Features:**
- [ ] Font family selection from brand theme
- [ ] Font weight customization
- [ ] Letter spacing adjustments
- [ ] Apply to root CSS variables

**Implementation:**
```css
:root {
  --brand-font-family: var(--brand-font, 'Inter', system-ui, sans-serif);
}

body {
  font-family: var(--brand-font-family);
}
```

#### 2.2 Custom Theme JSON Support
**Priority: Low**

**Structure:**
```json
{
  "theme_json": {
    "colors": {
      "brand": "#2563eb",
      "brand_hover": "#1d4ed8",
      "accent": "#10b981",
      "background": "#ffffff",
      "foreground": "#1a1a1a"
    },
    "typography": {
      "font_family": "Inter, sans-serif",
      "font_size_base": "16px",
      "line_height_base": "1.5"
    },
    "spacing": {
      "border_radius": "0.5rem"
    }
  }
}
```

**Implementation:**
- Parse `theme_json` from brand API
- Apply to CSS variables dynamically
- Fallback to defaults if not provided

#### 2.3 Brand Context Hook Enhancement
**Priority: Medium**

**Features:**
- [ ] Add helper functions: `getBrandColor()`, `getLogoUrl()`
- [ ] Loading state management
- [ ] Theme update subscription (for real-time updates)
- [ ] SSR-safe theme access

**New Hook API:**
```typescript
const {
  theme,
  loading,
  logoUrl,
  primaryColor,
  secondaryColor,
  tenantName,
  isBranded,
} = useBrandTheme()
```

### Phase 3: Branding UI/UX Polish (Week 3)

#### 3.1 Loading States
**Priority: Medium**

- [ ] Show logo skeleton during brand theme loading
- [ ] Prevent flash of unstyled content (FOUC)
- [ ] Graceful degradation when brand API fails

#### 3.2 Dark Mode Branding
**Priority: High**

- [ ] Ensure brand colors work in dark mode
- [ ] Auto-adjust color luminosity if needed
- [ ] Support separate dark mode brand colors

**Implementation:**
```typescript
const applyBrandTheme = (brandTheme: BrandTheme, isDark: boolean) => {
  if (isDark) {
    // Lighten brand colors for dark mode
    const adjustedColor = lightenColor(brandTheme.primary_color, 0.1)
    root.style.setProperty('--brand-color', adjustedColor)
  } else {
    root.style.setProperty('--brand-color', brandTheme.primary_color)
  }
}
```

#### 3.3 Email Template Branding
**Priority: Low**

- [ ] Include logo in email templates
- [ ] Use brand colors in email styling
- [ ] Branded email signatures

### Phase 4: Testing & Documentation (Week 4)

#### 4.1 Testing
**Priority: High**

- [ ] Unit tests for `BrandThemeProvider`
- [ ] Integration tests for logo display
- [ ] Visual regression tests for branded pages
- [ ] Test with various brand configurations
- [ ] Test fallback scenarios (missing logo, invalid colors)

#### 4.2 Documentation
**Priority: Medium**

- [ ] Update README with branding guide
- [ ] Document CSS variables and utility classes
- [ ] Component usage examples
- [ ] Brand configuration guide for agencies

#### 4.3 Performance Optimization
**Priority: Medium**

- [ ] Optimize brand theme fetching (reduce API calls)
- [ ] Implement service worker caching for brand assets
- [ ] Lazy load logo images
- [ ] Minimize CSS variable updates

## Technical Implementation Details

### Brand Theme Resolution Flow

```
1. User visits portal
   ↓
2. BrandThemeProvider initializes
   ↓
3. Check localStorage cache (15min TTL)
   ↓
4. If cached and valid → Use cached theme
   ↓
5. If not cached:
   - Authenticated: Fetch via `/api/v1/brand/by-host?org-id={id}`
   - Public: Fetch via `/api/v1/brand/by-host?host={hostname}`
   ↓
6. Apply theme to CSS variables
7. Update favicon
8. Cache theme with timestamp
```

### CSS Variable Strategy

**Core Brand Variables:**
```css
:root {
  /* Brand Colors */
  --brand-color: #2563eb;              /* Primary brand color */
  --brand-color-hover: #1d4ed8;        /* Hover state (10% darker) */
  --brand-secondary: #6b7280;          /* Secondary brand color */
  
  /* Mapped to Tailwind */
  --primary: 221.2 83.2% 53.3%;        /* HSL from brand color */
  --primary-foreground: 210 40% 98%;
  
  /* Typography */
  --brand-font: 'Inter', system-ui, sans-serif;
  --font-family: var(--brand-font);
}
```

**Utility Classes:**
```css
.bg-brand { background-color: var(--brand-color); }
.text-brand { color: var(--brand-color); }
.border-brand { border-color: var(--brand-color); }
.hover\:bg-brand:hover { background-color: var(--brand-color-hover); }
```

### Component Integration Pattern

**Before:**
```tsx
<Button className="bg-blue-600 hover:bg-blue-700">
  Click me
</Button>
```

**After:**
```tsx
<Button className="bg-brand hover:bg-brand-hover">
  Click me
</Button>
```

Or using inline styles with CSS variables:
```tsx
<Button style={{ backgroundColor: 'var(--brand-color)' }}>
  Click me
</Button>
```

## File Structure

```
src/
├── components/
│   ├── branding/
│   │   ├── BrandThemeProvider.tsx      # ✅ Exists - enhance
│   │   ├── DomainVerification.tsx      # ✅ Exists
│   │   └── BrandThemeLoader.tsx        # 🆕 SSR theme loader
│   ├── BrandLogo.tsx                   # ✅ Exists - enhance
│   └── ui/
│       └── BrandedButton.tsx           # 🆕 Brand-aware button
├── hooks/
│   └── useBrandTheme.ts                # 🆕 Re-export from provider
├── lib/
│   └── brand-utils.ts                  # 🆕 Brand utilities
└── app/
    └── (auth)/
        ├── signin/
        ├── signup/
        └── login/
            └── BrandedAuthLayout.tsx   # 🆕 Shared auth layout with logo
```

## Success Criteria

### Must Have (MVP)
- ✅ Logo displayed in sidebar
- ✅ Logo displayed on auth pages
- ✅ Brand colors applied to all buttons and primary UI elements
- ✅ Favicon updates dynamically
- ✅ "Powered by" badge respects `hide_powered_by` setting
- ✅ Graceful fallbacks when brand data is missing

### Should Have (V1)
- ✅ Typography customization (font family)
- ✅ Dark mode brand color support
- ✅ Brand colors in navigation (active states)
- ✅ Loading states during brand fetch

### Nice to Have (V2)
- ⚪ Custom theme JSON support
- ⚪ Advanced typography customization
- ⚪ Email template branding
- ⚪ Service worker caching for brand assets

## Risk Assessment

### Risks
1. **Performance**: Multiple brand API calls
   - **Mitigation**: Implement caching (15min TTL), consider service worker
   
2. **FOUC (Flash of Unstyled Content)**: Brand colors not applied immediately
   - **Mitigation**: SSR theme injection, inline critical CSS
   
3. **Color Contrast**: Some brand colors may not meet WCAG standards
   - **Mitigation**: Auto-adjust colors for accessibility, provide warnings
   
4. **Logo Loading**: External logo URLs may be slow
   - **Mitigation**: Lazy loading, fallbacks, CDN optimization

### Dependencies
- Backend brand API must be stable
- Logo URLs must be accessible (CORS, signed URLs)
- CSS variable support (modern browsers)

## Next Steps

1. **Review & Approve Plan** - Get stakeholder sign-off
2. **Set up Development Branch** - `feature/white-label-branding`
3. **Phase 1 Implementation** - Logo and color integration
4. **Testing** - Manual and automated testing
5. **Documentation** - Update README and component docs
6. **Deploy** - Staged rollout with feature flags

## Questions & Decisions Needed

1. Should we support separate light/dark mode brand colors?
2. Should brand theme updates be real-time (WebSocket) or poll-based?
3. What is the maximum logo file size? (Currently 2MB)
4. Should we validate brand colors for accessibility before applying?
5. Do we need brand-specific email templates?

---

**Last Updated**: 2025-01-27
**Status**: Planning Phase
**Owner**: Development Team
