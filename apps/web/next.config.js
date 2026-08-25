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
   * Proxy backend routes through the Next server so the browser only ever
   * talks to one origin. Production backend listens on localhost:4000;
   * dev uses NEXT_PUBLIC_API_URL (default 3001). The API's REST global
   * prefix is /api, hence /api/print/upload → <api>/api/print/upload.
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
      {
        // Document uploads (GST/Aadhaar/agreement files) from the CRM.
        source: '/api/print/upload',
        destination: `${backendUrl}/api/print/upload`,
      },
      {
        // Uploaded files are served by the API at /uploads/* — mirror the
        // path so document URLs resolve on the public origin.
        source: '/uploads/:path*',
        destination: `${backendUrl}/uploads/:path*`,
      },
    ];
  },
};

const plugins = [withNx];

module.exports = composePlugins(...plugins)(nextConfig);
