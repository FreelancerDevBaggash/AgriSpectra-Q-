/** @type {import('next').NextConfig} */
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
