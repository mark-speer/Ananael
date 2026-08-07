/**
 * Shared CLIENT_ORIGIN allowlist parsing for CORS and CSRF.
 */
export function getAllowedOrigins(): string[] {
  const raw = process.env.CLIENT_ORIGIN || 'http://localhost:5000';
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

export function isOriginAllowed(
  origin: string,
  allowed: string[] = getAllowedOrigins()
): boolean {
  return allowed.includes('*') || allowed.includes(origin);
}
