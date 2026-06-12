import type { NextConfig } from "next";

const INTERNAL_ORIGIN = (process.env.INTERNAL_API_URL || 'http://localhost:4000/api').replace(/\/api\/?$/, '');

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'dwveylarjblldpgdgjtx.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'archivum-portal.duckdns.org',
        pathname: '/uploads/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: `${INTERNAL_ORIGIN}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
