/**
 * User Serializer Functions
 * Converts internal FullUser representations to safe PublicUser DTOs
 * for use in public API responses, ensuring PII isolation.
 */

import type { PublicUser } from '../types/User';

/**
 * Converts a FullUser or Mongoose IUser document to a PublicUser DTO.
 * 
 * Extracts only safe fields:
 * - _id: Object identifier
 * - username: Public display name
 * - traditions: User's magical traditions (optional)
 * - profileImageUrl: User's avatar (optional)
 * - createdAt: Account creation date
 * 
 * Guarantees that NO private fields are included:
 * - email: never included
 * - passwordHash: never included
 * - natal: never included
 * - location: never included
 * - lastSeenAt: never included
 * 
 * @param user - FullUser interface or Mongoose IUser document
 * @returns PublicUser safe for public API responses
 * @throws TypeError if user is null/undefined
 */
export function toPublicUser(user: {
  _id?: unknown;
  username: string;
  createdAt: Date;
  traditions?: unknown;
  profileImageUrl?: unknown;
}): PublicUser {
  if (!user) {
    throw new TypeError('User is required');
  }

  const publicUser: PublicUser = {
    _id: typeof user._id === 'string' ? user._id : String(user._id),
    username: user.username,
    createdAt: user.createdAt,
  };

  // Add optional fields only if present and valid
  if (user.traditions && Array.isArray(user.traditions) && user.traditions.length > 0) {
    publicUser.traditions = user.traditions as string[];
  }

  if (user.profileImageUrl && typeof user.profileImageUrl === 'string') {
    publicUser.profileImageUrl = user.profileImageUrl;
  }

  return publicUser;
}

/**
 * Batch converts multiple users to PublicUser DTOs.
 * Useful for endpoints returning arrays of users.
 * 
 * @param users - Array of user objects
 * @returns Array of PublicUser DTOs
 */
export function toPublicUsers(users: Array<{
  _id?: unknown;
  username: string;
  createdAt: Date;
  traditions?: unknown;
  profileImageUrl?: unknown;
}>): PublicUser[] {
  if (!Array.isArray(users)) {
    throw new TypeError('Users must be an array');
  }
  return users.map(user => toPublicUser(user));
}

/**
 * Verifies that an object is safe to send as public (no PII).
 * Useful for runtime validation and debugging.
 * 
 * @param obj - Object to verify
 * @returns true if object contains no known PII fields
 */
export function isSafePublic(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return true;

  const piiFields = ['email', 'password', 'passwordHash', 'natal', 'location', 'lastSeenAt'];
  
  for (const field of piiFields) {
    if (field in obj) {
      const value = obj[field];
      // Null/undefined is ok, but any actual value is PII leakage
      if (value !== null && value !== undefined) {
        return false;
      }
    }
  }

  return true;
}
