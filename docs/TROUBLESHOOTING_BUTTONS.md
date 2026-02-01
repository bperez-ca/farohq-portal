# Troubleshooting: Sign In / Sign Up Buttons Not Working

## Common Issues and Solutions

### 1. Buttons Are Disabled (Most Common)

**Symptoms**: Buttons appear but are not clickable

**Cause**: Clerk authentication is not loaded (`isLoaded` is false)

**Solution**:
- Check if Clerk environment variables are set:
  ```bash
  echo $NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  echo $CLERK_SECRET_KEY
  ```
- If not set, add to `.env.local`:
  ```
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
  CLERK_SECRET_KEY=sk_test_...
  ```
- Restart the dev server after setting environment variables

### 2. Navigation Links Don't Work

**Symptoms**: Clicking "Sign In" or "Sign Up" links doesn't navigate

**Cause**: Next.js routing issue or JavaScript errors

**Solution**:
- Check browser console for JavaScript errors
- Ensure Next.js dev server is running: `npm run dev`
- Try hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
- Clear browser cache

### 3. Form Submission Doesn't Work

**Symptoms**: Clicking submit button does nothing

**Cause**: 
- Clerk not initialized
- Form validation failing silently
- JavaScript errors

**Solution**:
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab to see if requests are being made
4. Verify Clerk is loaded:
   ```javascript
   // In browser console
   console.log(window.Clerk)
   ```

### 4. Clerk Not Initialized

**Symptoms**: Forms don't submit, buttons disabled

**Cause**: Missing or incorrect Clerk configuration

**Solution**:
1. Verify Clerk keys are correct in Clerk Dashboard
2. Check that keys match between `.env.local` and Clerk Dashboard
3. Ensure you're using the correct environment (test vs production keys)
4. Check Clerk Dashboard for any service issues

## Quick Debugging Steps

### Step 1: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for errors (red text)
4. Common errors:
   - `Clerk: Missing publishableKey`
   - `Failed to load Clerk`
   - Network errors

### Step 2: Check Network Requests
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try clicking Sign In/Sign Up button
4. Look for:
   - Failed requests (red)
   - Missing API calls
   - CORS errors

### Step 3: Verify Environment Variables
```bash
# Check if environment variables are set
cd /Users/bperez/Projects/farohq-portal
cat .env.local 2>/dev/null || echo "No .env.local file found"
```

### Step 4: Check Button State
1. Right-click on the button
2. Select "Inspect Element"
3. Check if button has `disabled` attribute
4. If disabled, Clerk likely isn't loaded

## Expected Behavior

### Sign In Button (Homepage Links)
- Should navigate to `/signin` immediately
- No Clerk required for navigation

### Sign In Form Submit Button
- Should be disabled if Clerk not loaded
- Should show loading state when submitting
- Should redirect on success

### Sign Up Button (Homepage Links)
- Should navigate to `/signup` immediately
- No Clerk required for navigation

### Sign Up Form Submit Button
- Should be disabled if Clerk not loaded
- Should show loading state when submitting
- Should redirect on success

## Verification Checklist

- [ ] Clerk environment variables are set
- [ ] Dev server is running (`npm run dev`)
- [ ] No JavaScript errors in console
- [ ] Clerk keys are valid (check Clerk Dashboard)
- [ ] Browser is not blocking scripts
- [ ] No ad blockers interfering
- [ ] Network requests are succeeding

## Still Not Working?

If buttons still don't work after trying the above:

1. **Check the specific error**:
   - What exactly happens when you click?
   - Nothing happens?
   - Error message appears?
   - Page doesn't navigate?

2. **Check Clerk status**:
   - Visit Clerk Dashboard
   - Verify your application is active
   - Check for any service alerts

3. **Try a different browser**:
   - Test in incognito/private mode
   - Try Chrome, Firefox, or Safari
   - Disable browser extensions

4. **Check code for issues**:
   - Review recent changes
   - Check for syntax errors
   - Verify imports are correct
