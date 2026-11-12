import { app } from './app.js';
import { env } from './config/env.js';
import { configService } from './services/config.service.js';

// Initialize encrypted configuration from Supabase before serving requests
configService.initialize().then(() => {
  console.log('[OJALOGS_API] Config service initialized successfully.');
}).catch(err => {
  console.warn('[OJALOGS_API] Config service init notice:', err.message);
});

const server = app.listen(env.PORT, () => {
  console.log(`[OJALOGS_API] Server listening on port ${env.PORT} (${env.NODE_ENV})`);
  console.log(`[OJALOGS_API] Health endpoint: http://localhost:${env.PORT}/api/v1/health`);
});

process.on('SIGTERM', () => {
  console.log('[OJALOGS_API] SIGTERM received. Gracefully shutting down...');
  server.close(() => {
    process.exit(0);
  });
});


