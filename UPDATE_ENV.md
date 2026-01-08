# Update Your .env.local File

Your current `.env.local` has the correct Clerk instance, but make sure the format is correct.

## Current Keys (from your .env.local)

Your publishable key decodes to: `real-pegasus-21.clerk.accounts.dev` ✅

## Verify Format

Your `.env.local` should look like this:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_cmVhbC1wZWdhc3VzLTIxLmNsZXJrLmFjY291bnRzLmRldiQ
CLERK_SECRET_KEY=sk_test_O5FzrzzHI4FRs2uPXgD6rlZtNlWHqO2eCbweouLhE9

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8080

# Portal URL
NEXT_PUBLIC_PORTAL_URL=http://localhost:3001
```

## Next Steps

1. **Verify keys in Clerk Dashboard:**
   - Go to https://dashboard.clerk.com
   - Select your application
   - Go to API Keys
   - Confirm Frontend API URL is: `https://real-pegasus-21.clerk.accounts.dev`

2. **Restart the portal:**
   ```bash
   # Stop the current dev server (Ctrl+C)
   # Then restart:
   npm run dev
   ```

3. **Test authentication:**
   - Open http://localhost:3001
   - Try to sign in
   - Check browser console for errors

4. **Verify tokens are sent:**
   - After signing in, check Network tab
   - API requests should have `Authorization: Bearer <token>` header
