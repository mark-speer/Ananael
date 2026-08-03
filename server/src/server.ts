import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import connectDB from './config/db';
import authRoutes from './routes/auth';
import tarotRoutes from './routes/tarot';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost';

/** Security headers */
app.use(helmet());

/**
 * CORS — allow configured origin(s).
 * Comma-separated CLIENT_ORIGIN values are supported for Portainer / multi-host setups.
 * Production UI usually same-origins via Nginx /api proxy, so CORS is mainly for direct :5000 access.
 */
const allowedOrigins = CLIENT_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Non-browser or same-origin proxied tools may omit Origin
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
  res.json({ status: 'ok', service: 'ananael-server' });
});

app.use('/api/auth', authRoutes);
app.use('/api/tarot', tarotRoutes);

/** Boot: connect DB then listen */
const start = async (): Promise<void> => {
  await connectDB();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ananael server listening on port ${PORT}`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
