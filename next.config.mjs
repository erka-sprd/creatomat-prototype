/** @type {import('next').NextConfig} */
const nextConfig = {
  // Off so effects aren't double-invoked in dev (which re-inits the Lottie
  // loader and hitches its start) — gives dev parity with the prod build.
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  devIndicators: false,
  async headers() {
    return [
      {
        source: '/',
        headers: [{ key: 'Cache-Control', value: 'no-store' }],
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/designer/:path*',
        destination: '/',
        permanent: false,
      },
      {
        source: '/designer',
        destination: '/',
        permanent: false,
      },
    ]
  },
}

export default nextConfig
