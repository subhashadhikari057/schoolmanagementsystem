import type { NextConfig } from 'next';

// Add rewrite to proxy frontend relative /api calls to backend service to avoid 404.
// Keeps existing relative fetches (e.g. /api/v1/fees/...) working without code changes.
const backendOrigin = process.env.BACKEND_ORIGIN || 'http://localhost:8080';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
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
    ],
    domains: ['localhost', '127.0.0.1'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
