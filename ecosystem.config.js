module.exports = {
  apps: [
    {
      name: 'govai-frontend',
      cwd: './frontend',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
    {
      name: 'govai-api',
      cwd: './backend',
      script: 'venv/bin/uvicorn',
      args: 'app.main:app --host 0.0.0.0 --port 8000',
      interpreter: 'none',
      env: {
        PYTHONPATH: '.',
      },
    },
    {
      name: 'govai-celery-worker',
      cwd: './backend',
      script: 'venv/bin/celery',
      args: '-A tasks.celery_app worker --loglevel=info',
      interpreter: 'none',
    },
    {
      name: 'govai-celery-beat',
      cwd: './backend',
      script: 'venv/bin/celery',
      args: '-A tasks.celery_app beat --loglevel=info',
      interpreter: 'none',
    },
  ],
};
