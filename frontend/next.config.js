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
// Both files are also committed to git under /public as a hard fallback.
;(function copyMaplibreAssets() {
  const fs   = require('fs')
  const path = require('path')
  const dist = path.resolve(__dirname, 'node_modules/maplibre-gl/dist')
  const pub  = path.resolve(__dirname, 'public')
  // maplibre-gl v6 requires TWO files to be served as static assets:
  //   maplibre-gl-worker.mjs  — the Web Worker entry point
  //   maplibre-gl-shared.mjs  — shared code imported by the worker at runtime
  const files = ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']
  try {
    fs.mkdirSync(pub, { recursive: true })
    for (const file of files) {
      const src  = path.join(dist, file)
      const dest = path.join(pub, file)
      if (fs.existsSync(src)) fs.copyFileSync(src, dest)
    }
  } catch (e) {
    // Non-fatal: committed files in /public serve as fallback
    console.warn('[next.config] maplibre assets copy skipped:', e.message)
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
      'https://api.agrispectra-q.cloud',
    NEXT_PUBLIC_PROD_API_URL:
      process.env.NEXT_PUBLIC_PROD_API_URL ||
      'https://prod.agrispectra-q.cloud',
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
