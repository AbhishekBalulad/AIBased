module.exports = {
  apps: [
    {
      name: 'ai-gov-policy-job-backend',
      script: 'server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    }
  ]
};
