/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile packages for Next.js compatibility (removed @farohq/ui as it's now inlined)
  webpack: (config) => {
    // Ensure peer dependencies from UI package resolve from portal app's node_modules
    const peerDeps = [
      'sonner',
      'react-day-picker',
      'embla-carousel-react',
      'recharts',
      'cmdk',
      'vaul',
      'react-hook-form',
      'input-otp',
      'react-resizable-panels',
    ];
    
    config.resolve.alias = {
      ...config.resolve.alias,
      ...peerDeps.reduce((aliases, dep) => {
        try {
          aliases[dep] = require.resolve(dep);
        } catch (e) {
          // Ignore if not installed
        }
        return aliases;
      }, {}),
    };
    return config;
  },
  // Remove experimental.appDir as it's now stable in Next.js 14
  images: {
    domains: ['cdn.thefaro.co', 'localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.thefaro.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_APP_DOMAIN: process.env.NEXT_PUBLIC_APP_DOMAIN || 'app.thefaro.co',
    NEXT_PUBLIC_PORTAL_WILDCARD: process.env.NEXT_PUBLIC_PORTAL_WILDCARD || 'portal.thefaro.co',
    BRAND_RESOLUTION_MODE: process.env.BRAND_RESOLUTION_MODE || 'host-or-domain',
    CDN_BASE: process.env.CDN_BASE || 'https://cdn.thefaro.co',
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    
    return [
      // Note: Brand routes are handled by route handlers (apps/portal/src/app/api/v1/brand/*)
      // This allows fallback to mock data when gateway is not running
      // Other API routes are proxied to gateway
      {
        source: '/api/v1/auth/:path*',
        destination: `${apiUrl}/api/v1/auth/:path*`,
      },
      {
        source: '/api/v1/brands/:path*',
        destination: `${apiUrl}/api/v1/brands/:path*`,
      },
      {
        source: '/api/v1/files/:path*',
        destination: `${apiUrl}/api/v1/files/:path*`,
      },
      // Note: /api/v1/tenants/* routes are handled by Next.js route handlers for authentication
      // Route handlers: /api/v1/tenants/[id], /api/v1/tenants/my-orgs, etc.
      {
        source: '/api/v1/locations/:path*',
        destination: `${apiUrl}/api/v1/locations/:path*`,
      },
      // Fallback for other API routes
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
