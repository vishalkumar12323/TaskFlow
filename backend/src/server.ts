import './config/env'; // Validate env vars first
import app from './app';
import { env } from './config/env';
import { pool } from './db';
import { logger } from './utils/logger';

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
  logger.info(`📋 Health: http://localhost:${env.PORT}/api/v1/health`);
});

// ─── Graceful Shutdown ───────────────────────────────────────────────────────
const shutdown = async (signal: string) => {
  logger.warn(`⚠️  ${signal} received — shutting down gracefully`);
  server.close(async () => {
    await pool.end();
    logger.info('✅ DB pool closed. Process terminated.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('uncaughtException',  (err) => { logger.error('Uncaught Exception', { err }); process.exit(1); });
process.on('unhandledRejection', (err) => { logger.error('Unhandled Rejection', { err }); process.exit(1); });
