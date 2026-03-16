/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: '/api/auth/:path*', destination: 'http://localhost:4000/api/auth/:path*' },
      { source: '/api/transactions/:path*', destination: 'http://localhost:4000/api/transactions/:path*' },
      { source: '/api/categories/:path*', destination: 'http://localhost:4000/api/categories/:path*' },
      { source: '/api/budget/:path*', destination: 'http://localhost:4000/api/budget/:path*' },
      { source: '/api/reports/:path*', destination: 'http://localhost:4000/api/reports/:path*' },
      { source: '/api/users/:path*', destination: 'http://localhost:4000/api/users/:path*' },
      { source: '/api/folders/:path*', destination: 'http://localhost:4000/api/folders/:path*' },
    ];
  },
};

module.exports = nextConfig;
