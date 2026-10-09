const app = require('./app');
const config = require('./config');
const db = require('./db');
const logger = require('./utils/logger');

async function main() {
  if (!config.databaseUrl) {
    logger.error('startup.missing_env', {
      message: 'DATABASE_URL is not set. Copy .env.example to .env and configure it.',
    });
    process.exit(1);
  }

  try {
    await db.init();
  } catch (err) {
    logger.error('startup.db_init_failed', { message: err.message });
    process.exit(1);
  }

  logger.info('startup.ai_mode', {
    mode: config.ai.apiKey
      ? 'LLM + deterministic fallback'
      : 'deterministic fallback only (no AI_API_KEY set)',
    model: config.ai.model,
  });

  const server = app.listen(config.port, () => {
    logger.info('server.started', { port: config.port, env: config.env });
  });

  const shutdown = (signal) => {
    logger.info('server.stopping', { signal });
    server.close(async () => {
      await db.end().catch(() => {});
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main();