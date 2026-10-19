import type { NextConfig } from 'next'

const strapi = new URL(process.env.STRAPI_URL ?? 'http://localhost:1337')
const strapiIsLocal = ['localhost', '127.0.0.1', '[::1]'].includes(strapi.hostname)

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: [
      {
        protocol: strapi.protocol.replace(':', '') as 'http' | 'https',
        hostname: strapi.hostname,
        port: strapi.port,
        pathname: '/uploads/**',
      },
    ],
    // Next blocks optimising images from private IPs (SSRF guard). Only relax it for a local dev CMS.
    dangerouslyAllowLocalIP: strapiIsLocal && process.env.NODE_ENV !== 'production',
  },
}

export default nextConfig
