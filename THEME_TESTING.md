# White-Label Theme System E2E Testing Guide

## Overview

This document provides a comprehensive guide for testing the M0.2: White-Label Theme System implementation.

## Test Page

Access the theme test page at: `http://localhost:3001/test-theme`

This page provides:
- Real-time test results
- Theme state monitoring
- CSS variable inspection
- Logo display testing
- Button color verification
- Navigation persistence testing
- Favicon verification

## Prerequisites

1. **Start Services:**
   ```bash
   # Start backend services (gateway, brand service, etc.)
   docker compose up -d
   
   # Or start individual services
   # Gateway: http://localhost:8080
   # Brand Service: http://localhost:8081
   ```

2. **Start Portal:**
   ```bash
   cd apps/portal
   npm run dev
   ```

3. **Ensure Brand Data Exists:**
   - Brand service should have branding data in the database
   - Test with domain: `localhost` or `localhost:3001`
   - Or use host: `localhost:3001` for by-host endpoint

## Test Checklist

### ✅ Test 1: Theme Loads from API on Page Load

**Steps:**
1. Open `http://localhost:3001/test-theme`
2. Check the "Theme State" card
3. Verify "Loading State" changes from "Loading..." to "Loaded"
4. Verify "Brand Theme" shows "Available"

**Expected Result:**
- Theme should load automatically on page load
- No errors in browser console
- Brand theme data should be displayed

**API Endpoint:**
- Should call: `/api/v1/brand/by-host?host=localhost:3001`
- Or: `/api/v1/brand/by-domain?domain=localhost`

### ✅ Test 2: Brand Color Applies to Buttons/CTAs

**Steps:**
1. Navigate to test page
2. Check "Button Color Test" section
3. Inspect buttons with browser DevTools
4. Verify CSS variable `--primary` is set
5. Verify buttons with `bg-primary` use brand color

**Expected Result:**
- All buttons with `bg-primary` class should use brand color
- CSS variable `--primary` should be set from brand theme
- Button hover states should use `--brand-color-hover`

**Manual Check:**
- Open DevTools → Elements → Inspect a button
- Check computed styles for `background-color`
- Should match the brand color from theme

### ✅ Test 3: Logo Displays from Brand Config

**Steps:**
1. Navigate to test page
2. Check "Logo Display Test" section
3. Verify logo displays in different sizes
4. Check browser Network tab for logo image request

**Expected Result:**
- Logo should display from `brandTheme.logoUrl`
- If no logo URL, should fallback to default Logo component
- Logo should be visible in all size variants

**Pages to Check:**
- Home page (`/`)
- Sign in page (`/signin`)
- Sign up page (`/signup`)
- All should show BrandLogo component

### ✅ Test 4: Theme Persists Across Navigation

**Steps:**
1. Navigate to test page
2. Note the current theme (light/dark)
3. Click navigation links to other pages
4. Use browser back button to return
5. Verify theme is still the same

**Expected Result:**
- Theme should persist when navigating between pages
- localStorage should contain theme preference
- Brand theme should be cached (15min TTL)

**Pages to Test:**
- `/` → `/signin` → `/signup` → `/test-theme`
- Theme should remain consistent

### ✅ Test 5: Favicon Updates from Brand Config

**Steps:**
1. Navigate to test page
2. Check "Favicon Test" section
3. Look at browser tab icon
4. Verify favicon URL is displayed
5. Check if favicon matches the URL

**Expected Result:**
- Browser tab should show favicon from `brandTheme.faviconUrl`
- If no favicon URL, default favicon should be shown
- Favicon should update when theme loads

**Manual Check:**
- Look at browser tab icon
- Should match the favicon URL in theme data

## Automated Test Results

The test page automatically checks:

1. ✅ Theme loads from API
2. ✅ Brand color CSS variable set
3. ✅ Primary color mapped to brand
4. ✅ Logo URL available
5. ✅ Favicon URL available
6. ✅ Theme persists (localStorage)

All tests should show green checkmarks when passing.

## Troubleshooting

### Theme Not Loading

**Symptoms:**
- "Loading State" stuck on "Loading..."
- "Brand Theme" shows "Not Available"
- Error in browser console

**Solutions:**
1. Check if gateway is running: `http://localhost:8080/health`
2. Check if brand service is running: `http://localhost:8081/health`
3. Verify API endpoint: `/api/v1/brand/by-host?host=localhost:3001`
4. Check browser Network tab for failed requests
5. Verify CORS is configured correctly

### Brand Colors Not Applying

**Symptoms:**
- Buttons don't use brand color
- CSS variables not set
- `--primary` is empty

**Solutions:**
1. Check if `applyBrandTheme()` is being called
2. Verify brand theme has `primaryColor` or `themeJson.colors.brand`
3. Check browser console for JavaScript errors
4. Verify CSS variables in DevTools → Elements → :root

### Logo Not Displaying

**Symptoms:**
- Logo shows default/fallback
- Image request fails
- Logo URL is empty

**Solutions:**
1. Verify `brandTheme.logoUrl` is set
2. Check if logo URL is accessible (CORS, authentication)
3. Verify image format is supported
4. Check browser Network tab for image request

### Theme Not Persisting

**Symptoms:**
- Theme resets on navigation
- localStorage is empty
- Theme context not working

**Solutions:**
1. Check if ThemeProvider wraps the app in layout.tsx
2. Verify localStorage is not blocked
3. Check browser console for errors
4. Verify theme context is properly set up

## API Testing

### Test Brand Endpoint Directly

```bash
# Test by-host endpoint
curl "http://localhost:8080/api/v1/brand/by-host?host=localhost:3001"

# Test by-domain endpoint
curl "http://localhost:8080/api/v1/brand/by-domain?domain=localhost"
```

**Expected Response:**
```json
{
  "agency_id": "...",
  "logo_url": "https://...",
  "favicon_url": "https://...",
  "primary_color": "#2563eb",
  "secondary_color": "#6b7280",
  "theme_json": {
    "typography": {
      "font_family": "Inter, system-ui, sans-serif"
    },
    "colors": {
      "brand": "#2563eb",
      "brand_hover": "#1d4ed8",
      "accent": "#10b981"
    }
  }
}
```

## Browser DevTools Checks

### Inspect CSS Variables

1. Open DevTools (F12)
2. Go to Elements tab
3. Select `<html>` element
4. Check Computed styles or Styles panel
5. Look for CSS variables:
   - `--brand-color`
   - `--brand-color-hover`
   - `--primary`
   - `--brand-font`

### Check Network Requests

1. Open DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Look for request to `/api/v1/brand/by-host` or `/api/v1/brand/by-domain`
4. Verify response status is 200
5. Check response body contains brand data

### Check localStorage

1. Open DevTools → Application tab
2. Go to Local Storage → `http://localhost:3001`
3. Check for:
   - `theme`: Should be "light" or "dark"
   - `brand-theme`: Should contain cached theme data

## Success Criteria

All of the following must pass:

- [x] Theme loads from API on page load
- [x] Brand color applies to all buttons/CTAs
- [x] Logo displays from brand config
- [x] Theme persists across navigation
- [x] Favicon updates from brand config

## Next Steps

After all tests pass:

1. Update FARO_IMPLEMENTATION_PLAN.md to mark M0.2 as complete
2. Document any issues found
3. Create PR with all changes
4. Move to next milestone (M0.3: Enhanced Dark Mode)








