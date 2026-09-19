/** @type {import('next').NextConfig} */

// ── Copy maplibre-gl worker to /public at config-load time ──────────────────
// maplibre-gl v6 ships the Web Worker as a separate file. It must be served
// as a static asset at /maplibre-gl-worker.mjs and registered via
// maplibregl.setWorkerUrl() before any Map is rendered.
//
// We copy it here (in next.config.js) so it runs in EVERY environment:
//   • local dev          (next dev)
//   • local build        (next build)
//   • Vercel build CI    (npm run build → node next.config.js evaluation)
//   • Railway / Render   (same)
//
// The file is also committed to git under /public as a hard fallback.
;(function copyMaplibreWorker() {
  const fs   = require('fs')
  const path = require('path')
  const src  = path.resolve(__dirname, 'node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs')
  const dest = path.resolve(__dirname, 'public/maplibre-gl-worker.mjs')
  try {
    if (fs.existsSync(src)) {
      fs.mkdirSync(path.dirname(dest), { recursive: true })
      fs.copyFileSync(src, dest)
    }
  } catch (e) {
    // Non-fatal: the committed file in /public serves as fallback
    console.warn('[next.config] maplibre worker copy skipped:', e.message)
  }
})()

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['maplibre-gl'],

  // Bake the Railway URL into the client bundle at build time.
  // This guarantees NEXT_PUBLIC_API_URL is always available on the client
  // regardless of how the hosting platform injects env vars.
  // process.env.NEXT_PUBLIC_API_URL (if set in Vercel dashboard) takes
  // precedence; the literal string is the fallback.
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ||
      'https://agrispectra-q-production-7bd0.up.railway.app',
  },

  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
}

module.exports = nextConfig
