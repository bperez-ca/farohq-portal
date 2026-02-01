# Button Styling Guide - Consistent Rounded Rectangles

## Design System

All buttons across the application should use **rounded rectangles** (rectangles with rounded corners) for consistency.

### Standard Button Style
- **Shape:** Rectangle with rounded corners
- **Border Radius:** `0.5rem` (8px) - uses CSS variable `--radius`
- **Minimum Height:** `2.5rem` (40px) for text buttons
- **Padding:** `0.5rem 1rem` (8px vertical, 16px horizontal) for text buttons

### Icon-Only Buttons
- **Shape:** Square with rounded corners (not circular)
- **Border Radius:** `0.5rem` (8px)
- **Sizing:** Maintains aspect ratio (square)

## Implementation

### Global CSS Override
**File:** `src/app/globals.css`

Global CSS rules ensure all buttons use consistent rounded rectangle styling:

```css
/* All buttons use rounded rectangles */
button,
.btn,
[role="button"],
input[type="button"],
input[type="submit"],
input[type="reset"] {
  border-radius: var(--radius, 0.5rem) !important;
}

/* Override circular/pill-shaped buttons */
button[class*="rounded-full"],
.btn[class*="rounded-full"] {
  border-radius: var(--radius, 0.5rem) !important;
}
```

### Button Component Usage

All buttons use the `Button` component from `@farohq/ui`:

```tsx
import { Button } from '@farohq/ui'

// Standard button
<Button variant="default">Save Changes</Button>

// Outline button
<Button variant="outline">Cancel</Button>

// Icon button (will be square with rounded corners)
<Button variant="ghost" size="icon">
  <Icon className="h-4 w-4" />
</Button>
```

## What's Changed

### Before
- Inconsistent button shapes (circular, pill-shaped, rectangular)
- Different border radius values across components
- Icon buttons were sometimes circular

### After
- All buttons use consistent rounded rectangle shape
- Uniform border radius (`0.5rem`)
- Icon buttons are square with rounded corners
- Consistent padding and sizing

## Exceptions

The following elements are **NOT** affected by button styling (remain circular):
- Loading spinners (`.animate-spin`)
- Avatar images
- Progress indicators
- Decorative circular elements

## Customization

The border radius can be customized via the CSS variable:
- `--radius` in `:root` (default: `0.5rem`)
- Can be overridden by brand theme JSON: `theme_json.spacing.border_radius`

## Testing

To verify button consistency:
1. Check all buttons across the application
2. Verify they all have rounded rectangle shape (not circular or pill-shaped)
3. Confirm icon buttons are square with rounded corners
4. Ensure consistent border radius throughout

## Files Modified

- `src/app/globals.css` - Added global button styling rules
