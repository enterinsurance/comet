/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: true,
  webpack: (config, { isServer }) => {
    // Handle PDF.js canvas fallback
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
      }
    }

    return config
  },
}

module.exports = nextConfig
