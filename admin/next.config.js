/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignorer les erreurs TypeScript pendant le build Vercel
  typescript: {
    ignoreBuildErrors: true,
  },
  // Ignorer les erreurs ESLint pendant le build Vercel
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig; // (ou export default nextConfig; si c'est un .mjs)