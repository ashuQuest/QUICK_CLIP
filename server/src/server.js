import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/index.js';
import { connectDB } from './config/db.js';
import { startCleanupJob } from './services/cleanupService.js';
import clipboardRoutes from './routes/clipboardRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import shareRoutes from './routes/shareRoutes.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

export const app = express();

// Trust proxy for rate limiting behind reverse proxies (Render, Cloudflare, etc.)
app.set('trust proxy', 1);

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Strict CORS Configuration
const allowedOrigins = [
  config.clientOrigin,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman) or matching origin
      if (!origin || allowedOrigins.includes(origin) || config.nodeEnv !== 'production') {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS policy`));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Management-Token'],
    exposedHeaders: ['Content-Disposition', 'Content-Length'],
    credentials: true,
  })
);

// Apply general rate limiter
app.use('/api/', generalLimiter);

// Note: Raw upload endpoints under /api/uploads/local handle streaming directly.
// Standard JSON and URL-encoded parsers for other routes:
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    name: 'QuickClip API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    storageProvider: config.storageProvider,
    maxUploadSizeMb: Math.round(config.maxUploadSizeBytes / (1024 * 1024)),
    defaultExpirySeconds: config.defaultExpirySeconds,
  });
});

// Mount API routes
app.use('/api/clipboard', clipboardRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/shares', shareRoutes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Check if the current file is executed directly (not imported as a module in tests)
const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('server.js') || 
  process.argv[1].endsWith('server')
) && !process.argv.some((arg) => arg.includes('test'));

if (isDirectRun && process.env.NODE_ENV !== 'test') {
  async function start() {
    try {
      await connectDB();
      app.listen(config.port, () => {
        console.log(`[QuickClip] Server running on port ${config.port} (${config.nodeEnv})`);
        console.log(`[QuickClip] Storage provider: ${config.storageProvider.toUpperCase()}`);
        console.log(`[QuickClip] Client origin: ${config.clientOrigin}`);
        startCleanupJob();
      });
    } catch (err) {
      console.error(`[QuickClip] Failed to start server:`, err);
      process.exit(1);
    }
  }

  start();
}
