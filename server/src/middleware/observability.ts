import { randomUUID } from 'crypto';
import { Request, RequestHandler, Response } from 'express';

interface RouteStats {
  count: number;
  errors: number;
  totalDurationMs: number;
  maxDurationMs: number;
}

export interface ObservabilityRouteSummary {
  route: string;
  count: number;
  errors: number;
  averageDurationMs: number;
  maxDurationMs: number;
}

const routeStats = new Map<string, RouteStats>();

function slowRequestThreshold(): number {
  return Number(process.env.OBSERVABILITY_SLOW_MS) || 500;
}

function routeName(req: Request): string {
  const route = req.route?.path;
  if (route) return `${req.baseUrl}${route}`;
  return req.path;
}

function writeLog(event: string, fields: Record<string, unknown>): void {
  console.log(JSON.stringify({ event, ...fields }));
}

export function getRouteSummaries(limit = 3): ObservabilityRouteSummary[] {
  return [...routeStats.entries()]
    .map(([route, stats]) => ({
      route,
      count: stats.count,
      errors: stats.errors,
      averageDurationMs: Number((stats.totalDurationMs / stats.count).toFixed(2)),
      maxDurationMs: Number(stats.maxDurationMs.toFixed(2)),
    }))
    .sort((a, b) => b.maxDurationMs - a.maxDurationMs)
    .slice(0, limit);
}

export function resetRouteSummaries(): void {
  routeStats.clear();
}

export const requestObservability: RequestHandler = (
  req: Request,
  res: Response,
  next
): void => {
  const requestId = req.header('x-request-id') || randomUUID();
  const startedAt = process.hrtime.bigint();
  res.setHeader('x-request-id', requestId);

  res.on('finish', () => {
    const durationMs =
      Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const route = routeName(req);
    const stats = routeStats.get(route) || {
      count: 0,
      errors: 0,
      totalDurationMs: 0,
      maxDurationMs: 0,
    };

    stats.count += 1;
    stats.errors += res.statusCode >= 500 ? 1 : 0;
    stats.totalDurationMs += durationMs;
    stats.maxDurationMs = Math.max(stats.maxDurationMs, durationMs);
    routeStats.set(route, stats);

    const fields = {
      requestId,
      method: req.method,
      route,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
    };

    writeLog(
      durationMs >= slowRequestThreshold()
        ? 'http.request.slow'
        : 'http.request.complete',
      fields
    );
  });

  next();
};
