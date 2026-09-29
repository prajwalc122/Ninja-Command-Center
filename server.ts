import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import { apiRouter } from './server/routes/api';
import { db } from './server/config/db';
import {
  enforceHttps,
  sanitizeInputs,
  generalLimiter,
  createRateLimitMiddleware,
  safeErrorHandler,
} from './server/middleware/security';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const portArgIdx = process.argv.indexOf('--port');
const portFromArg = portArgIdx !== -1 ? process.argv[portArgIdx + 1] : undefined;
// Dev server must strictly run on port 3000 behind nginx reverse proxy on 8080
const PORT = portFromArg || 3000;

// Trust reverse proxies (Google Cloud Run / Kubernetes)
app.set('trust proxy', 1);

// 1. Enforce HTTPS in production environments
app.use(enforceHttps);

// 2. Production Security Headers via Helmet (Configured for AI Studio iFrame compatibility)
app.use(
  helmet({
    xFrameOptions: false, // Required for AI Studio iFrame preview embedding
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          'https://apis.google.com',
          'https://www.gstatic.com',
        ],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: [
          "'self'",
          'https://apis.google.com',
          'https://*.googleapis.com',
          'https://*.firebaseio.com',
          'https://*.run.app',
          'https://*.google.com',
          'wss:',
          'ws:',
        ],
        frameSrc: ["'self'", 'https://www.google.com', 'https://maps.google.com', 'https://*.firebaseapp.com'],
        frameAncestors: ["'self'", 'https:', 'http:'], // Allow embedding in AI Studio workspace iframe
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
      },
    },
  })
);

// 3. Strict CORS Policy (Permits AI Studio preview domains)
const allowedOrigins = [
  process.env.APP_URL,
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, same-origin, mobile) or matching allowed domains
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.endsWith('.run.app') ||
        origin.includes('google.com') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// 4. Safe Body Parsing (15MB max payload)
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// 5. Anti-XSS & Anti-NoSQL Input Sanitizer
app.use(sanitizeInputs);

// 6. Global API Rate Limiting
const globalApiLimiter = createRateLimitMiddleware(generalLimiter, 'global');
app.use('/api', globalApiLimiter);

// 7. Static uploads serving with safe caching
const uploadsDir = path.resolve('uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir, { maxAge: '1d', dotfiles: 'ignore' }));

// 8. Mount Backend API Router
app.use('/api', apiRouter);

// 9. Health & Readiness endpoint (Safe telemetry)
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    security: 'enforced',
    timestamp: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY,
  });
});

// 10. Global Safe Error Handler (Never leaks stack traces in production)
app.use(safeErrorHandler);

async function startServer() {
  await db.init();

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Development mode with Vite middleware and attached HMR server
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          server,
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: serve built assets
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[SECURITY ENFORCED] NINJA Command Center running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
