/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      stream: false,
      crypto: false,
      process: false,
      path: false,
      buffer: false,
    };
    return config;
  },
}

module.exports = nextConfig
