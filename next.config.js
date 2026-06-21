/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async redirects() {
    // ADR-022: public route renamed Prizes → Goals; keep old links working.
    return [
      { source: '/math/prizes', destination: '/math/goals', permanent: true },
      { source: '/math/prizes/:path*', destination: '/math/goals/:path*', permanent: true },
    ]
  },
}

module.exports = nextConfig
