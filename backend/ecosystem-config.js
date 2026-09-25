module.exports = {
  apps: [
    {
      name: "backend-api",
      script: "./dist/server.js", // 👈 Change this to match your true compiled output path!
      instances: "max",
      exec_mode: "cluster",
      watch: false,
      max_memory_restart: "1G",
      env: {
        // 👈 Default environment variables
        NODE_ENV: "development",
        PORT: 3001,
      },
      env_production: {
        // 👈 Production overrides
        NODE_ENV: "production",
        PORT: 3001,
      },
    },
  ],
};
