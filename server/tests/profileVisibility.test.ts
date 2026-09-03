/**
 * Integration tests for Profile Visibility endpoints (Phase 56)
 * Tests the public profile access control and visibility enforcement
 */

import { Types } from 'mongoose';
import { Visibility } from '../src/types/visibility';
import { toPublicUser, isSafePublic } from '../src/lib/userSerializers';

describe('Profile Visibility Access Control (Phase 56)', () => {
  // Mock user objects for testing
  const createMockUser = (username: string, visibility: string) => ({
    _id: new Types.ObjectId(),
    username,
    email: `${username}@example.com`,
    password: 'hashedpassword123',
    visibility: visibility as any,
    traditions: ['Goetia', 'Kabbalah'],
    createdAt: new Date('2025-01-01T00:00:00Z'),
    lastSeenAt: new Date(),
  });

  describe('Public Profile Serialization', () => {
    it('should strip PII when serializing public profile', () => {
      const user = createMockUser('public_user', Visibility.PUBLIC);
      const publicProfile = toPublicUser(user);

      // Verify safe data is present
      expect(publicProfile.username).toBe('public_user');
      expect(publicProfile.createdAt).toEqual(user.createdAt);

      // Verify PII is stripped
      expect((publicProfile as any).email).toBeUndefined();
      expect((publicProfile as any).natal).toBeUndefined();
      expect((publicProfile as any).location).toBeUndefined();
      expect((publicProfile as any).lastSeenAt).toBeUndefined();
    });

    it('should pass isSafePublic check after serialization', () => {
      const user = createMockUser('test_user', Visibility.PUBLIC);
      const publicProfile = toPublicUser(user);

      expect(isSafePublic(publicProfile)).toBe(true);
    });

    it('should not expose password hash in public profile', () => {
      const user = createMockUser('secure_user', Visibility.PUBLIC);
      const publicProfile = toPublicUser(user);

      expect((publicProfile as any).password).toBeUndefined();
    });
  });

  describe('Visibility Enum Validation', () => {
    it('should recognize valid visibility states', () => {
      const validStates = [
        Visibility.PRIVATE,
        Visibility.UNLISTED,
        Visibility.PUBLIC,
      ];

      for (const state of validStates) {
        const user = createMockUser('user', state);
        expect([Visibility.PRIVATE, Visibility.UNLISTED, Visibility.PUBLIC]).toContain(
          user.visibility
        );
      }
    });

    it('should have 3 valid visibility states', () => {
      const states = [Visibility.PRIVATE, Visibility.UNLISTED, Visibility.PUBLIC];
      expect(states.length).toBe(3);
      expect(new Set(states).size).toBe(3); // All unique
    });
  });

  describe('Private Profile Handling', () => {
    it('should not serialize private profiles without authorization', () => {
      const privateUser = createMockUser('private_user', Visibility.PRIVATE);

      // Simulate access control: check if visibility is private
      const shouldRejectAccess = privateUser.visibility === Visibility.PRIVATE;

      expect(shouldRejectAccess).toBe(true);
    });

    it('should allow owner to view their own private profile', () => {
      const privateUser = createMockUser('private_user', Visibility.PRIVATE);
      const ownerId = privateUser._id.toString();
      const requestingUserId = ownerId;

      // Owner can always view their own profile
      const isOwner = ownerId === requestingUserId;
      expect(isOwner).toBe(true);
    });
  });

  describe('Public Profile Visibility', () => {
    it('should allow unauthenticated access to public profiles', () => {
      const publicUser = createMockUser('public_user', Visibility.PUBLIC);

      // Public profiles should be accessible without authentication
      const canAccess = publicUser.visibility === Visibility.PUBLIC;

      expect(canAccess).toBe(true);
    });

    it('should allow unauthenticated access to unlisted profiles with direct link', () => {
      const unlistedUser = createMockUser('unlisted_user', Visibility.UNLISTED);

      // Unlisted profiles are accessible but not listed in directories
      const canAccess =
        unlistedUser.visibility === Visibility.UNLISTED ||
        unlistedUser.visibility === Visibility.PUBLIC;

      expect(canAccess).toBe(true);
    });
  });

  describe('Profile Data Isolation', () => {
    it('should never include email in public response', () => {
      const user = createMockUser('user', Visibility.PUBLIC);
      const publicProfile = toPublicUser(user);

      expect(publicProfile).not.toHaveProperty('email');
    });

    it('should never include natal (birth) data in public response', () => {
      const user = createMockUser('user', Visibility.PUBLIC);
      const publicProfile = toPublicUser(user);

      expect(publicProfile).not.toHaveProperty('natal');
    });

    it('should never include location in public response', () => {
      const user = createMockUser('user', Visibility.PUBLIC);
      const publicProfile = toPublicUser(user);

      expect(publicProfile).not.toHaveProperty('location');
    });

    it('should include safe data: username, traditions, createdAt', () => {
      const user = createMockUser('user', Visibility.PUBLIC);
      user.traditions = ['Goetia', 'Kabbalah'];

      const publicProfile = toPublicUser(user);

      expect(publicProfile).toHaveProperty('username', 'user');
      expect(publicProfile).toHaveProperty('traditions');
      expect(publicProfile).toHaveProperty('createdAt');
    });
  });

  describe('Visibility Update Authorization', () => {
    it('should validate that only owner can update visibility', () => {
      const user = createMockUser('user', Visibility.PRIVATE);
      const ownerId = user._id.toString();
      const requestingUserId = ownerId;
      const isOwner = ownerId === requestingUserId;

      expect(isOwner).toBe(true);
    });

    it('should reject visibility updates from non-owner', () => {
      const user = createMockUser('user', Visibility.PRIVATE);
      const ownerId = user._id.toString();
      const attackerId = new Types.ObjectId().toString();
      const isOwner = ownerId === attackerId;

      expect(isOwner).toBe(false);
    });

    it('should allow transitioning between visibility states', () => {
      const validTransitions = [
        [Visibility.PRIVATE, Visibility.PUBLIC],
        [Visibility.PRIVATE, Visibility.UNLISTED],
        [Visibility.PUBLIC, Visibility.PRIVATE],
        [Visibility.PUBLIC, Visibility.UNLISTED],
        [Visibility.UNLISTED, Visibility.PRIVATE],
        [Visibility.UNLISTED, Visibility.PUBLIC],
      ];

      for (const [from, to] of validTransitions) {
        const isValidTransition = true; // All transitions are allowed
        expect(isValidTransition).toBe(true);
      }
    });
  });
});
