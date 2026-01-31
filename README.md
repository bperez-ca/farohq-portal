# FaroHQ Portal

Customer portal dashboard for FaroHQ, deployed on Vercel.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Authentication**: Clerk
- **Styling**: Tailwind CSS
- **Components**: Inlined UI components (from `@farohq/ui` package, now in `src/components/ui/`)
- **API Client**: Generated TypeScript SDK (from `farohq-core-app/api/openapi.yaml`)
- **Deployment**: Vercel

## Development

```bash
npm install
npm run generate-sdk  # Generate SDK from OpenAPI spec (first time or after API changes)
npm run dev
```

### SDK Generation

The TypeScript SDK is generated from the OpenAPI specification in `farohq-core-app/api/openapi.yaml`. 

- **First time**: Run `npm run generate-sdk` after installing dependencies
- **After API changes**: Run `npm run generate-sdk` to regenerate the SDK
- See [docs/SDK_GENERATION.md](docs/SDK_GENERATION.md) for details

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
- [SDK Generation](docs/SDK_GENERATION.md) - How to regenerate the SDK after API changes

## Backend API

The portal communicates with the FaroHQ backend API (core-app) running on Cloud Run.

All API calls include Clerk JWT tokens for authentication.
