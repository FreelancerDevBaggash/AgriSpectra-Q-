/**
 * Centralised runtime configuration for AgriSpectra-Q frontend.
 *
 * NEXT_PUBLIC_API_URL       → Demo API  (3 pre-loaded EnMAP scenes, instant results)
 * NEXT_PUBLIC_PROD_API_URL  → Prod API  (upload your own GeoTIFF for real analysis)
 *
 * Both are resolved at build time by Next.js (NEXT_PUBLIC_* are statically
 * replaced at build time — do NOT use dynamic runtime lookups).
 */

/** Demo API — default, 3 scenes pre-loaded, results in ~0.8 s */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  'https://api.agrispectra-q.cloud'

/** Production API — upload-only, runs real engine on user's GeoTIFF */
export const PROD_API_BASE =
  process.env.NEXT_PUBLIC_PROD_API_URL ??
  'https://prod.agrispectra-q.cloud'
