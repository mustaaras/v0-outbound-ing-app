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
