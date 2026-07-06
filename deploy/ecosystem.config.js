module.exports = {
  apps: [
    {
      name: "spacejam-api",
      script: "node",
      args: "dist/main.js",
      cwd: "/home/ubuntu/deploy/api",
      env: {
        PORT: 3001,
        NODE_ENV: "production"
      }
    },
    {
      name: "spacejam-web",
      script: "node",
      args: "apps/web/server.js",
      cwd: "/home/ubuntu/deploy/web",
      env: {
        PORT: 3000,
        NODE_ENV: "production",
        INTERNAL_API_URL: "http://127.0.0.1:3001",
        NEXT_PUBLIC_API_URL: "https://spacejam.vedpragya.com"
      }
    }
  ]
};
