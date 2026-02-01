# Portal Authentication Setup

This document provides a quick setup guide for the portal authentication system with FusionAuth and SSO providers.

## Quick Start

### 1. Start Services

```bash
# Start FusionAuth
docker compose up -d

# Start Portal (from project root)
cd apps/portal
npm run dev
```

### 2. Configure FusionAuth

1. Open FusionAuth admin: http://localhost:9011/admin
2. Create application `lvos-web` with redirect URI: `http://localhost:3001/api/auth/callback`
3. Configure SSO providers (see detailed guide below)

### 3. Test Authentication

1. Open landing page: http://localhost:3000
2. Click "Sign in" → redirects to portal signin
3. Test SSO providers or email/password login

## Authentication Flow

```
Landing Page → Portal Signin → FusionAuth → Callback → Dashboard
```

1. **Landing Page** (`localhost:3000`) - Contains "Sign in" link
2. **Portal Signin** (`localhost:3001/signin`) - Authentication page with SSO options
3. **FusionAuth** (`localhost:9011`) - Handles authentication and token exchange
4. **Callback** (`/api/auth/callback`) - Processes authorization code and sets session
5. **Dashboard** - Protected route requiring valid session

## SSO Providers

The signin page supports:
- **Google** - OAuth 2.0
- **Facebook** - OAuth 2.0  
- **LinkedIn** - OAuth 2.0
- **Instagram** - OAuth 2.0

## Configuration Files

- **Signin Page**: `src/app/signin/page.tsx`
- **Auth Callback**: `src/app/api/auth/callback/route.ts`
- **Logout Handler**: `src/app/api/auth/logout/route.ts`
- **Middleware**: `src/middleware.ts` - Route protection
- **Health Check**: `src/app/api/health/route.ts`

## Environment Variables

Create `.env.local`:

```env
FUSIONAUTH_URL=http://localhost:9011
FUSIONAUTH_CLIENT_ID=lvos-web
FUSIONAUTH_CLIENT_SECRET=dev-secret
NEXTAUTH_URL=http://localhost:3001
```

## Testing

Run the test script:

```powershell
# Windows
.\scripts\test-auth-flow.ps1

# Linux/Mac
./scripts/test-auth-flow.sh
```

## Troubleshooting

### Common Issues

1. **Redirect URI Mismatch**
   - Ensure FusionAuth redirect URI exactly matches: `http://localhost:3001/api/auth/callback`

2. **CORS Errors**
   - Check FusionAuth CORS settings
   - Verify all URLs use correct ports

3. **Session Not Persisting**
   - Check cookie settings in browser dev tools
   - Verify middleware session validation

4. **SSO Provider Errors**
   - Ensure provider apps are configured correctly
   - Check provider redirect URIs point to FusionAuth

### Debug Mode

Enable debug logging:
1. Open browser dev tools → Network tab
2. Monitor requests to `/api/auth/callback`
3. Check FusionAuth logs: `docker logs lvos-fusionauth`

## Security Notes

- Session cookies are HTTP-only and secure
- Tokens are stored server-side only
- PKCE is enforced for OAuth flows
- CSRF protection via state parameter

## Production Deployment

For production:
1. Use HTTPS URLs
2. Store secrets in environment variables
3. Configure proper CORS origins
4. Enable audit logging in FusionAuth
5. Use production SSO app credentials

## Documentation

- **Detailed SSO Setup**: `../docs/SSO_SETUP.md`
- **FusionAuth Bootstrap**: `../infra/fusionauth-bootstrap.md`
- **Architecture Rules**: `../AGENTS.md`



