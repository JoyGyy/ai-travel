module.exports = {
  apps: [
    {
      args: 'start',
      cwd: __dirname,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/server-error.log',
      exec_mode: 'fork',
      instances: 1,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      max_memory_restart: '500M',
      name: 'react-travel-next',
      out_file: './logs/server-out.log',
      script: 'node_modules/.bin/next',
    },
  ],
}
