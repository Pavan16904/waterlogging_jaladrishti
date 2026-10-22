module.exports = {
  apps: [
    {
      name: 'backend',
      cwd: './backend',
      script: './node_modules/tsx/dist/cli.mjs',
      args: 'watch src/server.ts',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000,
      env: {
        PORT: 5000,
        NODE_ENV: 'development',
      },
    },
    {
      name: 'frontend',
      cwd: './frontend',
      script: './node_modules/vite/bin/vite.js',
      args: '--host 0.0.0.0 --port 3001',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000,
    },
    {
      name: 'ml-service',
      cwd: './',
      script: 'python',
      args: '-m uvicorn main:app --app-dir ml_service --port 8000',
      interpreter: 'none',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000,
    },
  ],
};
