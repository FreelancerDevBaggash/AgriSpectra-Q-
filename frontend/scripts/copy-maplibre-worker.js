/**
 * Copies maplibre-gl-worker.mjs from node_modules to /public so it can be
 * served statically and referenced via maplibregl.setWorkerUrl('/maplibre-gl-worker.mjs').
 *
 * maplibre-gl v6 no longer bundles the worker inline — it must be an external file.
 * This script runs automatically via `postinstall` and before `next build`.
 */

const fs = require('fs')
const path = require('path')

const src  = path.resolve(__dirname, '../node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs')
const dest = path.resolve(__dirname, '../public/maplibre-gl-worker.mjs')

if (!fs.existsSync(src)) {
  console.warn('[copy-maplibre-worker] Source not found:', src)
  process.exit(0)
}

fs.mkdirSync(path.dirname(dest), { recursive: true })
fs.copyFileSync(src, dest)
console.log('[copy-maplibre-worker] Copied worker →', dest)
