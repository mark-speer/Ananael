import path from 'path';
import fs from 'fs';
import http from 'http';
import https from 'https';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import dotenv from 'dotenv';
import connectDB from './config/db';
import { getJwtSecret } from './lib/authCookie';
import { getAllowedOrigins } from './lib/origins';
import { csrfProtect } from './middleware/csrf';
import {
  getRouteSummaries,
  requestObservability,
} from './middleware/observability';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import gematriaRoutes from './routes/gematria';
import geomancyRoutes from './routes/geomancy';
import ichingRoutes from './routes/iching';
import tarotRoutes from './routes/tarot';
import runesRoutes from './routes/runes';
import treeRoutes from './routes/tree';
import ritualRoutes from './routes/ritual';
import solomonicRoutes from './routes/solomonic';
import journalRoutes from './routes/journal';
import talismanRoutes from './routes/talisman';
import planetaryRoutes from './routes/planetary';
import opusRoutes from './routes/opus';
import practiceRoutes from './routes/practice';
import enochianRoutes from './routes/enochian';
import liturgyRoutes from './routes/liturgy';
import shamanismRoutes from './routes/shamanism';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const SSL_CERT_PATH = process.env.SSL_CERT_PATH;
const SSL_KEY_PATH = process.env.SSL_KEY_PATH;

/** Built React app (copied into dist/public in the Docker image) */
const publicDir = path.join(__dirname, 'public');
const hasClient = fs.existsSync(path.join(publicDir, 'index.html'));

app.use(requestObservability);

/**
 * Security headers including CSP for the Vite-built SPA + Google Fonts.
 */
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
  })
);

/**
 * CORS — allow configured origin(s).
 * Comma-separated CLIENT_ORIGIN values are supported for Portainer / multi-host setups.
 * When the UI is served from this same process, browser calls are same-origin.
 */
const allowedOrigins = getAllowedOrigins();

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(origin)
      ) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(csrfProtect);

/** Health check for Compose / Portainer probes */
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'ananael-server',
    client: hasClient,
    topSlowRoutes: getRouteSummaries(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/tarot', tarotRoutes);
app.use('/api/runes', runesRoutes);
app.use('/api/gematria', gematriaRoutes);
app.use('/api/geomancy', geomancyRoutes);
app.use('/api/iching', ichingRoutes);
app.use('/api/tree', treeRoutes);
app.use('/api/ritual', ritualRoutes);
app.use('/api/solomonic', solomonicRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/talisman', talismanRoutes);
app.use('/api/planetary', planetaryRoutes);
app.use('/api/opus', opusRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/enochian', enochianRoutes);
app.use('/api/liturgy', liturgyRoutes);
app.use('/api/shamanism', shamanismRoutes);

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

/** Boot: validate secrets, connect DB, then listen (HTTPS when cert paths are set). */
const start = async (): Promise<void> => {
  getJwtSecret();
  await connectDB();

  const certOk =
    Boolean(SSL_CERT_PATH && SSL_KEY_PATH) &&
    fs.existsSync(SSL_CERT_PATH as string) &&
    fs.existsSync(SSL_KEY_PATH as string);

  if (SSL_CERT_PATH && SSL_KEY_PATH && !certOk) {
    console.warn(
      `TLS paths set but cert/key not found (${SSL_CERT_PATH}, ${SSL_KEY_PATH}); falling back to HTTP`
    );
  }

  const server = certOk
    ? https.createServer(
        {
          cert: fs.readFileSync(SSL_CERT_PATH as string),
          key: fs.readFileSync(SSL_KEY_PATH as string),
        },
        app
      )
    : http.createServer(app);

  server.listen(PORT, '0.0.0.0', () => {
    const scheme = certOk ? 'https' : 'http';
    console.log(
      `Ananael server listening on ${scheme}://0.0.0.0:${PORT} (client=${hasClient})`
    );
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
