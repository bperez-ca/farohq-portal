# SDK Generation Guide

This document explains how to regenerate the TypeScript SDK after making changes to the FaroHQ Core App API.

## Overview

The SDK is automatically generated from the OpenAPI specification maintained in `farohq-core-app/api/openapi.yaml`. The generated SDK is located in `farohq-portal/src/lib/sdk/` and is automatically excluded from git.

## Prerequisites

- Node.js 18+ installed
- `@openapitools/openapi-generator-cli` installed (automatically installed as devDependency)

## Generating the SDK

To regenerate the SDK after API changes:

```bash
npm run generate-sdk
```

This command:
1. Reads the OpenAPI spec from `../farohq-core-app/api/openapi.yaml`
2. Generates TypeScript SDK code into `src/lib/sdk/`
3. Uses the `typescript-fetch` generator for type-safe API clients

## OpenAPI Specification Location

The OpenAPI specification is maintained in:
- **Path**: `farohq-core-app/api/openapi.yaml`
- **Maintenance**: Update this file when adding/modifying API endpoints
- **Sync**: Ensure the spec matches the actual API implementation

## Using the Generated SDK

After generation, the SDK is available via:

```typescript
import { Configuration, BrandApi, FilesApi, TenantsApi } from '@/lib/sdk';

// Create configuration with authentication
const config = new Configuration({
  basePath: 'http://localhost:8080',
  accessToken: async () => {
    // Return your auth token
    return token;
  },
});

// Use the API clients
const brandApi = new BrandApi(config);
const filesApi = new FilesApi(config);
const tenantsApi = new TenantsApi(config);
```

## Helper Functions

The portal provides helper functions in `src/lib/sdk-client.ts` that automatically configure the SDK with Clerk authentication:

```typescript
import { getBrandApi, getFilesApi, getTenantsApi } from '@/lib/sdk-client';

// In a Server Component or Route Handler
const brandApi = await getBrandApi();
const brands = await brandApi.apiV1BrandsGet();
```

## Workflow for API Changes

1. **Update OpenAPI spec** in `farohq-core-app/api/openapi.yaml`
2. **Implement API changes** in `farohq-core-app`
3. **Regenerate SDK** in portal: `npm run generate-sdk`
4. **Update usage** if API signatures changed
5. **Test** the integration

## Troubleshooting

### SDK generation fails
- Check that `farohq-core-app/api/openapi.yaml` exists and is valid
- Verify OpenAPI spec is valid YAML
- Check that `@openapitools/openapi-generator-cli` is installed

### Import errors after regeneration
- Rebuild the project: `npm run build`
- Clear Next.js cache: `rm -rf .next`
- Check that `src/lib/sdk/src/index.ts` exports all APIs correctly

### Type errors
- Regenerate the SDK after API changes
- Clear TypeScript cache: `rm -rf tsconfig.tsbuildinfo`
- Restart your TypeScript server in your editor

## File Structure

```
farohq-portal/
├── src/
│   └── lib/
│       ├── sdk/                    # Generated SDK (gitignored)
│       │   ├── src/
│       │   │   ├── apis/          # API client classes
│       │   │   ├── models/        # TypeScript models
│       │   │   └── runtime.ts     # HTTP client runtime
│       │   └── index.ts           # Re-export from src/
│       └── sdk-client.ts          # Helper functions with auth
├── scripts/
│   └── generate-sdk.sh            # SDK generation script
└── package.json                   # Contains generate-sdk script

farohq-core-app/
└── api/
    └── openapi.yaml               # OpenAPI specification
```

## Notes

- The SDK directory (`src/lib/sdk/`) is gitignored as it's generated code
- Always commit changes to `farohq-core-app/api/openapi.yaml` when updating the API
- The generated SDK uses `typescript-fetch` generator for better tree-shaking and bundle size
