import path from 'path';
import fs from 'fs';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import connectDB from './config/db';
import authRoutes from './routes/auth';
import gematriaRoutes from './routes/gematria';
import ichingRoutes from './routes/iching';
import tarotRoutes from './routes/tarot';
import treeRoutes from './routes/tree';
import ritualRoutes from './routes/ritual';
import solomonicRoutes from './routes/solomonic';
import journalRoutes from './routes/journal';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5000';

/** Built React app (copied into dist/public in the Docker image) */
const publicDir = path.join(__dirname, 'public');
const hasClient = fs.existsSync(path.join(publicDir, 'index.html'));

/**
 * Security headers.
 * CSP relaxed so the Vite-built SPA can load Google Fonts in production.
 */
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

/**
 * CORS — allow configured origin(s).
 * Comma-separated CLIENT_ORIGIN values are supported for Portainer / multi-host setups.
 * When the UI is served from this same process, browser calls are same-origin.
 */
const allowedOrigins = CLIENT_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));

/** Health check for Compose / Portainer probes */
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'ananael-server', client: hasClient });
});

app.use('/api/auth', authRoutes);
app.use('/api/tarot', tarotRoutes);
app.use('/api/gematria', gematriaRoutes);
app.use('/api/iching', ichingRoutes);
app.use('/api/tree', treeRoutes);
app.use('/api/ritual', ritualRoutes);
app.use('/api/solomonic', solomonicRoutes);
app.use('/api/journal', journalRoutes);

if (hasClient) {
  app.use(express.static(publicDir));

  /** SPA fallback — non-API routes serve index.html */
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) {
      next();
      return;
    }
    res.sendFile(path.join(publicDir, 'index.html'));
  });
} else {
  app.get('/', (_req: Request, res: Response) => {
    res.status(200).json({
      service: 'ananael-server',
      message: 'API only — React build not found. Use Docker Compose production image or run the Vite client.',
      health: '/api/health',
    });
  });
}

/** Boot: connect DB then listen */
const start = async (): Promise<void> => {
  await connectDB();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ananael server listening on port ${PORT} (client=${hasClient})`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
