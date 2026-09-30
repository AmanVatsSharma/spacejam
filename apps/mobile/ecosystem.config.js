module.exports = {
  apps: [
    {
      name: "spacejam-web",
      script: "node",
      args: "apps/web/server.js",
      cwd: "/home/ubuntu/spacejam",
      env: {
        PORT: 3000,
        NODE_ENV: "production",
        INTERNAL_API_URL: "http://127.0.0.1:4000",
        NEXT_PUBLIC_API_URL: "https://admin.spacejam.in"
      }
    }
  ]
};
