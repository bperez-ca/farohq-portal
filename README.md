# FaroHQ Portal

Customer portal dashboard for FaroHQ, deployed on Vercel.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Authentication**: Clerk
- **Styling**: Tailwind CSS
- **Components**: @farohq/ui (published package)
- **Deployment**: Vercel

## Development

```bash
npm install
npm run dev
```

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

## Deployment

The portal is automatically deployed to Vercel on push to main branch.

## Documentation

- [Clerk Setup](CLERK_API_SETUP.md)
- [API Client Usage](CLERK_API_SETUP.md#api-client-structure)

## Backend API

The portal communicates with the FaroHQ backend API (core-app) running on Cloud Run.

All API calls include Clerk JWT tokens for authentication.
