# Save Button Disabled - Reasons & Solutions

## Button Disabled Conditions

The "Save Changes" button is disabled when **ANY** of these conditions are true:

```typescript
disabled={saving || isUploading || !isDirty || isValidatingSlug || !!slugError}
```

### 1. `saving === true` 
**Reason:** Currently saving changes to the backend
- **Status:** Temporary (button will re-enable after save completes)
- **Solution:** Wait for the save operation to complete
- **Visual:** Button shows "Saving..." text

### 2. `isUploading === true`
**Reason:** Currently uploading logo or favicon files
- **Status:** Temporary (button will re-enable after upload completes)
- **Solution:** Wait for file upload to finish
- **Visual:** Button shows "Saving..." text

### 3. `!isDirty` (Form Not Modified)
**Reason:** No changes detected in the form
- **Status:** Permanent until user makes changes
- **Solution:** Make at least one change to any field:
  - Change business name
  - Change slug
  - Change primary color
  - Change secondary color
  - Change website URL
  - Upload a new logo
  - Upload a new favicon
- **Visual:** Tooltip shows "No changes to save. Make changes to enable this button."
- **Debug:** Check console for `[Save Button] Disabled reasons: ['No changes detected (form is clean)']`

### 4. `isValidatingSlug === true`
**Reason:** Slug validation is in progress (checking if slug is available)
- **Status:** Temporary (usually 500ms debounce)
- **Solution:** Wait for validation to complete
- **Visual:** Tooltip shows "Validating slug..."
- **Debug:** Check console for `[Save Button] Disabled reasons: ['Slug validation in progress']`

### 5. `!!slugError` (Slug Validation Error)
**Reason:** Slug validation failed (slug is taken or invalid)
- **Status:** Permanent until slug error is resolved
- **Common Errors:**
  - "This slug is already taken. Please choose another."
  - Invalid format (must be lowercase letters, numbers, and hyphens only)
- **Solution:** 
  - Change the slug to a different value
  - Fix slug format if invalid
  - Wait if slug validation is still in progress
- **Visual:** Red error message below slug field + tooltip shows error
- **Debug:** Check console for `[Save Button] Disabled reasons: ['Slug error: ...']`

## How to Debug

### Browser Console
When the button is disabled, check the browser console for:
```
[Save Button] Disabled reasons: ['No changes detected (form is clean)']
[Save Button] State: {
  saving: false,
  isUploading: false,
  isDirty: false,
  isValidatingSlug: false,
  slugError: null,
  hasErrors: false
}
```

### Visual Indicators
1. **Tooltip:** Hover over the disabled button to see the reason
2. **Debug Message:** A small text appears below the button showing the reason
3. **Form Errors:** Check for red error messages below form fields

## Common Scenarios

### Scenario 1: Button Disabled After Page Load
**Cause:** `!isDirty` - Form hasn't been modified yet
**Solution:** Make any change to any field (even changing a color and changing it back)

### Scenario 2: Button Disabled While Typing Slug
**Cause:** `isValidatingSlug` - Slug validation is in progress (500ms debounce)
**Solution:** Wait for validation to complete (usually < 1 second)

### Scenario 3: Button Disabled After Slug Error
**Cause:** `!!slugError` - Slug is taken or invalid
**Solution:** 
- Change slug to a different value
- Ensure slug format is correct (lowercase, numbers, hyphens only)

### Scenario 4: Button Disabled After Clicking
**Cause:** `saving === true` - Save operation in progress
**Solution:** Wait for save to complete (button will show "Saving...")

## Technical Details

### Form State Management
- Uses `react-hook-form` with `isDirty` flag
- `isDirty` becomes `true` when any field value differs from default/initial values
- `isDirty` resets to `false` after successful save

### Slug Validation
- Triggers 500ms after user stops typing
- Validates against backend API: `/api/v1/tenants/validate-slug`
- Sets `slugError` if slug is unavailable or invalid
- Clears `slugError` when slug is valid or unchanged

### File Uploads
- `isUploading` is `true` during logo/favicon upload
- Upload happens before form submission
- Button disabled during upload to prevent duplicate submissions

## Quick Fix Checklist

If button is disabled, check:
- [ ] Have you made any changes to the form? (If no, make a change)
- [ ] Is slug validation in progress? (Wait a moment)
- [ ] Is there a slug error? (Fix the slug)
- [ ] Is a file upload in progress? (Wait for upload)
- [ ] Is a save operation in progress? (Wait for save)

## Code Location

**File:** `src/app/agency/settings/branding/page.tsx`
- **Line 909:** Button disabled condition
- **Line 74:** `isDirty` from `useForm`
- **Line 63-64:** `slugError` and `isValidatingSlug` state
- **Line 94-136:** Slug validation logic
