import { createApp } from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';

async function bootstrap() {
  const app = createApp();

  try {
    await connectDatabase();
  } catch (error) {
    if (env.nodeEnv === 'production') {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Unknown connection error';
    console.warn(`[database] MongoDB connection unavailable; API started without persistence. ${message}`);
  }

  app.listen(env.port, () => {
    console.info(`[server] TransitOps API listening on port ${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error('[server] Failed to start TransitOps API', error);
  process.exit(1);
});
