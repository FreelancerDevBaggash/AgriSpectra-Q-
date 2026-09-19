/**
 * Copies maplibre-gl v6 static assets from node_modules to /public.
 *
 * maplibre-gl v6 requires TWO files served as static assets:
 *   /public/maplibre-gl-worker.mjs  — Web Worker entry point
 *   /public/maplibre-gl-shared.mjs  — shared module imported by the worker at runtime
 *
 * Both are registered via maplibregl.setWorkerUrl('/maplibre-gl-worker.mjs').
 * The worker then fetches maplibre-gl-shared.mjs relative to itself at runtime.
 *
 * This script is called by next.config.js at config-load time (all environments).
 */

const fs   = require('fs')
const path = require('path')

const dist  = path.resolve(__dirname, '../node_modules/maplibre-gl/dist')
const pub   = path.resolve(__dirname, '../public')
const files = ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']

fs.mkdirSync(pub, { recursive: true })

for (const file of files) {
  const src  = path.join(dist, file)
  const dest = path.join(pub, file)
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest)
    console.log(`[copy-maplibre] ✓ ${file}`)
  } else {
    console.warn(`[copy-maplibre] ✗ not found: ${src}`)
  }
}
