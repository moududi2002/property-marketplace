// 📍 /infrastructure/pm2/ecosystem.config.cjs
//
// PM2 process manager config.
// Deploy:  pm2 start infrastructure/pm2/ecosystem.config.cjs
// Save:    pm2 save
// Boot:    pm2 startup  → follow printed command

module.exports = {
  apps: [
    // ─── NestJS API ──────────────────────────────────────
    {
      name: "property-api",
      cwd: "./apps/api",
      script: "dist/main.js",
      instances: 2, // scale to CPU count, adjust as needed
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: 4035,
      },
      error_file: "./logs/api-error.log",
      out_file: "./logs/api-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      kill_timeout: 10_000,
      listen_timeout: 10_000,
      wait_ready: false,
    },

    // ─── Next.js Web ─────────────────────────────────────
    {
      name: "property-web",
      cwd: "./apps/web",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3035",
      instances: 1, // Next.js runs its own clustering — 1 is enough
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "800M",
      env: {
        NODE_ENV: "production",
        PORT: 3035,
      },
      error_file: "./logs/web-error.log",
      out_file: "./logs/web-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      kill_timeout: 5_000,
    },
  ],
};