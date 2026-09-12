import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  experimental: {
    staleTimes: {
      dynamic: 180, // Cache dynamic routes in client router cache for 3 minutes (instant back/forward navigation)
      static: 300,  // Cache static routes for 5 minutes
    },
    optimizePackageImports: ['react-icons/lu', 'react-icons/fa6', 'lucide-react', 'date-fns'],
  },
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  eslint: {
    // Lint is run explicitly in CI via `npm run lint`; don't duplicate during build.
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
