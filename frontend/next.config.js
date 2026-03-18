/** @type {import('next').NextConfig} */
const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: '/api/auth/:path*', destination: `${backendUrl}/api/auth/:path*` },
      { source: '/api/transactions/:path*', destination: `${backendUrl}/api/transactions/:path*` },
      { source: '/api/categories/:path*', destination: `${backendUrl}/api/categories/:path*` },
      { source: '/api/budget/:path*', destination: `${backendUrl}/api/budget/:path*` },
      { source: '/api/reports/:path*', destination: `${backendUrl}/api/reports/:path*` },
      { source: '/api/users/:path*', destination: `${backendUrl}/api/users/:path*` },
      { source: '/api/folders/:path*', destination: `${backendUrl}/api/folders/:path*` },
    ];
  },
};

module.exports = nextConfig;
