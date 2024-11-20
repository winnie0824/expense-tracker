/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      stream: false,
      crypto: false,
      path: false,
      process: false,
      buffer: false,
      util: false,
      assert: false,
      worker_threads: false,
      os: false,
      readline: false,
    };
    return config;
  },
  transpilePackages: ['xlsx'],
}

module.exports = nextConfig
