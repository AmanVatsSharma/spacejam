//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require('@nx/next');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  nx: {},
  // Standalone output is required for the production deploy workflow:
  // we ship .next/standalone + .next/static + .next/BUILD_ID to the server.
  output: 'standalone',
  transpilePackages: ['@spacejam/ui'],
  generateBuildId: () => `build-${Date.now()}`,
  skipTrailingSlashRedirect: true,
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { dev }) => {
    if (!dev) {
      config.optimization.concatenateModules = false;
    }
    return config;
  },
  /**
   * Proxy /api/graphql requests to the NestJS backend.
   * Production backend listens on localhost:4000. Dev uses 3001.
   */
  async rewrites() {
    const backendUrl =
      process.env.NODE_ENV === 'production'
        ? 'http://localhost:4000'
        : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return [
      {
        source: '/api/graphql',
        destination: `${backendUrl}/graphql`,
      },
    ];
  },
};

const plugins = [withNx];

module.exports = composePlugins(...plugins)(nextConfig);
