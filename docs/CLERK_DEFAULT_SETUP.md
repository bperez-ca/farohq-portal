# Clerk Default Components Setup

## ✅ Changes Made

I've replaced the custom authentication forms with Clerk's default `<SignIn />` and `<SignUp />` components.

### Benefits

1. **Google OAuth Built-in**: Clerk's default components include Google OAuth support out of the box
2. **More Reliable**: Tested components that handle all edge cases
3. **Less Code**: No custom form validation or state management needed
4. **Better UX**: Clerk handles loading states, errors, and redirects automatically

## What Changed

### Sign In Page (`/signin`)
- Replaced custom `LoginForm` with Clerk's `<SignIn />` component
- Simplified from ~100 lines to ~15 lines
- Redirects to `/dashboard` after sign in

### Sign Up Page (`/signup`)
- Replaced custom `SignupForm` with Clerk's `<SignUp />` component
- Kept `UserSyncHandler` to sync user data to backend after signup
- Redirects to `/onboarding` after sign up
- Simplified from ~170 lines to ~70 lines

## Configuration

### Google OAuth Setup

To enable Google OAuth (if not already enabled):

1. Go to Clerk Dashboard: https://dashboard.clerk.com/
2. Navigate to **User & Authentication** → **Social Connections**
3. Enable **Google**
4. Add your Google OAuth credentials (Client ID & Client Secret)
5. Save changes

The default Clerk components will automatically show the Google sign-in button.

### Customization (Optional)

If you want to customize the appearance later, you can use the `appearance` prop:

```tsx
<SignIn
  appearance={{
    variables: {
      colorPrimary: '#2563eb',
    },
    elements: {
      formButtonPrimary: 'bg-blue-600 hover:bg-blue-700',
    },
  }}
/>
```

## Testing

1. **Restart dev server** (if it was running):
   ```bash
   # Stop with Ctrl+C, then:
   npm run dev
   ```

2. **Test Sign Up**:
   - Go to `http://localhost:3001/signup`
   - Should see Clerk's default signup form
   - Google OAuth button should appear (if configured in Clerk Dashboard)
   - Try signing up - should redirect to `/onboarding`

3. **Test Sign In**:
   - Go to `http://localhost:3001/signin`
   - Should see Clerk's default signin form
   - Google OAuth button should appear (if configured)
   - Try signing in - should redirect to `/dashboard`

## User Sync

The `UserSyncHandler` component is still included in the signup page to sync user data to your backend after Clerk authentication completes. This happens automatically and won't block the user flow.

## What's Removed

The following custom components are no longer used but can be kept for reference:
- `src/components/auth/LoginForm.tsx`
- `src/components/auth/SignupForm.tsx`

You can delete them if you don't need them anymore.
