/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Fail the build when there are TypeScript errors so issues are visible
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig

// Add a dev-only Content-Security-Policy header that allows 'unsafe-eval' so
// local tooling (Turbopack HMR, source maps, and some developer analytics
// scripts) can work without triggering CSP-eval errors during development.
// DO NOT enable unsafe-eval in production – only add this header to aid the
// local developer experience.
if (process.env.NODE_ENV === 'development') {
  nextConfig.headers = async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Content-Security-Policy',
          // Keep rules fairly strict but allow eval and inline scripts in dev only.
          value:
            "default-src 'self'; " +
            "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://va.vercel-scripts.com; " +
            "connect-src 'self' ws://localhost:3000 http://localhost:3000 https://knpjfzfuwncoqqbntqoc.supabase.co https://www.google-analytics.com https://www.googletagmanager.com; " +
            "img-src 'self' data: https:; " +
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
            "font-src 'self' https://fonts.gstatic.com; " +
            "frame-src 'none';",
        },
      ],
    },
  ]
}
