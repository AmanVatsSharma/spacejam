//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require('@nx/next');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  nx: {},
  output: 'standalone',
  // @spacejam/ui is file:-linked and ships raw .ts/.tsx source; transpile it
  // through the Next/SWC pipeline so it bundles correctly during build.
  transpilePackages: ['@spacejam/ui'],
  // Unique build ID per deploy so the browser invalidates its RSC/router
  // cache. A static build ID causes stale cached routes to persist across
  // deploys (e.g. a route that previously 307-redirected stays cached).
  generateBuildId: () => `build-${Date.now()}`,
  skipTrailingSlashRedirect: true,
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  /**
   * Proxy /api/graphql requests to the NestJS backend.
   * In development the backend runs on port 3001; in production
   * it's typically behind the same origin (nginx reverse proxy).
   */
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return [
      {
        source: '/api/graphql',
        destination: `${backendUrl}/graphql`,
      },
    ];
  },
};

const plugins = [
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);
