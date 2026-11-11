import { fileURLToPath } from 'url'

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    rules: {
      // `next dev` only: stamp every native JSX element with its source
      // location (data-src) for the Cmd+E edit mode — components/dev-edit.
      // The overlay itself is left out so it never outlines its own panel.
      '*.tsx': {
        condition: {
          all: ['development', { not: 'foreign' }, { not: { path: /(^|\/)components\/dev-edit\// } }],
        },
        loaders: [fileURLToPath(new URL('./lib/dev-edit/stamp-loader.cjs', import.meta.url))],
      },
    },
  },
  // Allow HMR/dev requests from a phone on the same Wi-Fi. Set DEV_LAN_IP to
  // your Mac's LAN IP in .env.local (gitignored) — update it there when it
  // changes on reconnect; this file stays clean in git.
  allowedDevOrigins: process.env.DEV_LAN_IP ? [process.env.DEV_LAN_IP] : [],
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
