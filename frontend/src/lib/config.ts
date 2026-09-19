/**
 * Centralised runtime configuration for AgriSpectra-Q frontend.
 *
 * NEXT_PUBLIC_API_URL is resolved at build time by Next.js.
 * The literal fallback is the production Railway URL — it is intentionally
 * hardcoded here so that even if Vercel fails to inject the env variable at
 * build time, the correct backend URL is still baked into the bundle.
 *
 * Do NOT replace this with a dynamic runtime lookup — NEXT_PUBLIC_* variables
 * must be statically replaced at build time for client-side rendering to work.
 */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  'https://agrispectra-q-production-7bd0.up.railway.app'
