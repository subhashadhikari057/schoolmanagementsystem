import type { NextConfig } from 'next';

// Add rewrite to proxy frontend relative /api calls to backend service to avoid 404.
// Keeps existing relative fetches (e.g. /api/v1/fees/...) working without code changes.
const backendOrigin = process.env.BACKEND_ORIGIN || 'http://localhost:8080';
const isProduction = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  // Production optimizations
  // output: 'standalone',
  compress: true,
  images: {
    remotePatterns: [
      // Development patterns
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8080',
        pathname: '/api/v1/files/**',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '8080',
        pathname: '/api/v1/files/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8080',
        pathname: '/api/v1/files/**',
      },
      {
        protocol: 'https',
        hostname: '127.0.0.1',
        port: '8080',
        pathname: '/api/v1/files/**',
      },
      // Production patterns - replace 'sms.navneetverma.com' with your actual domain
      {
        protocol: 'https',
        hostname: 'sms.navneetverma.com',
        pathname: '/api/v1/files/**',
      },
      {
        protocol: 'https',
        hostname: 'sms.navneetverma.com',
        pathname: '/uploads/**',
      },
    ],
    domains: ['localhost', '127.0.0.1', 'sms.navneetverma.com'],
  },
  async rewrites() {
    // In production, API calls go through nginx proxy
    if (isProduction) {
      return [];
    }

    // Development rewrites
    return [
      {
        source: '/api/:path*',
        destination: `${backendOrigin}/api/:path*`,
      },
    ];
  },

  // Production security headers
  async headers() {
    if (!isProduction) return [];

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
