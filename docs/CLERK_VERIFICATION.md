# Quick Clerk Verification Guide

## Your Clerk Instance
- **Frontend API URL**: `https://real-pegasus-21.clerk.accounts.dev`
- **JWKS URL**: `https://real-pegasus-21.clerk.accounts.dev/.well-known/jwks.json`

## Verify Your Keys

1. Go to https://dashboard.clerk.com
2. Select your application
3. Go to **API Keys**
4. Verify:
   - **Frontend API URL** shows: `https://real-pegasus-21.clerk.accounts.dev`
   - **Publishable Key** starts with `pk_test_` or `pk_live_`
   - **Secret Key** starts with `sk_test_` or `sk_live_`

## Update .env.local

Make sure your `.env.local` has:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_KEY
CLERK_SECRET_KEY=sk_test_YOUR_ACTUAL_KEY
```

Replace `YOUR_ACTUAL_KEY` with the actual keys from Clerk Dashboard.

## Verify Backend Matches

In `farohq-core-app/.env`:
```env
CLERK_JWKS_URL=https://real-pegasus-21.clerk.accounts.dev/.well-known/jwks.json
```

Both portal and backend must use the same Clerk instance!
