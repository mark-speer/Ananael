/**
 * User Type Definitions
 * Separates internal (FullUser) from public (PublicUser) representations
 * to prevent PII leakage in API responses.
 */

/**
 * Internal User representation (login response, /api/auth/me only).
 * Contains all user data including sensitive fields.
 * 
 * SENSITIVE FIELDS (never exposed publicly):
 * - email: Authentication credential, personal identifier
 * - passwordHash: Security credential, never transmitted
 * - natal: Birth date/time/place, highly personal esoteric data
 * - location: Geographic coordinates, privacy-sensitive tracking data
 * - lastSeenAt: Presence tracking, can be used for inference
 */
export interface FullUser {
  _id: string;
  email: string;
  username: string;
  /** Birth profile (NEVER expose in public API) */
  natal?: {
    birthDate: string;
    birthTime?: string | null;
    birthPlace?: {
      lat: number;
      lon: number;
    } | null;
    label?: string | null;
  } | null;
  /** Geographic location (NEVER expose in public API) */
  location?: {
    lat: number;
    lon: number;
  } | null;
  /** Last authentication activity (NEVER expose in public API) */
  lastSeenAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Public User representation for sharing in social contexts.
 * Safe to expose in all public endpoints.
 * 
 * EXPOSED FIELDS ONLY:
 * - _id: Object identifier (needed for references)
 * - username: Public display name
 * - traditions: User's magical traditions (optional, future feature)
 * - profileImageUrl: User's avatar (optional, future feature)
 * - createdAt: Account creation date (public info, account tenure)
 * 
 * NEVER includes: email, passwordHash, natal, location, lastSeenAt
 */
export interface PublicUser {
  _id: string;
  username: string;
  traditions?: string[];
  profileImageUrl?: string;
  createdAt: Date;
}

/**
 * Type guard to distinguish FullUser from PublicUser
 */
export function isPublicUser(user: unknown): user is PublicUser {
  if (!user || typeof user !== 'object') return false;
  const obj = user as Record<string, unknown>;
  // PublicUser has only these fields (minimal)
  return (
    typeof obj._id === 'string' &&
    typeof obj.username === 'string' &&
    obj.createdAt instanceof Date &&
    !('email' in obj || 'natal' in obj || 'location' in obj || 'lastSeenAt' in obj)
  );
}

/**
 * Type guard to distinguish FullUser from PublicUser
 */
export function isFullUser(user: unknown): user is FullUser {
  if (!user || typeof user !== 'object') return false;
  const obj = user as Record<string, unknown>;
  // FullUser has email field
  return (
    typeof obj._id === 'string' &&
    typeof obj.username === 'string' &&
    typeof obj.email === 'string' &&
    obj.createdAt instanceof Date
  );
}
