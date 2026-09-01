/**
 * User Serializers - Unit and Integration Tests
 * Verifies PII isolation and serialization correctness
 */

import { toPublicUser, toPublicUsers, isSafePublic } from '../src/lib/userSerializers';
import type { FullUser, PublicUser } from '../src/types/User';

// Mock FullUser for testing
const mockFullUser: FullUser = {
  _id: '660f1234567890abcdef1234',
  email: 'alice@example.com', // PRIVATE - should never appear
  username: 'alice_the_wise',
  natal: {
    // PRIVATE - should never appear
    birthDate: '1990-05-15',
    birthTime: '14:30',
    birthPlace: {
      lat: 40.7128,
      lon: -74.006,
    },
    label: 'NYC Birth',
  },
  location: {
    // PRIVATE - should never appear
    lat: 51.5074,
    lon: -0.1278,
  },
  lastSeenAt: new Date('2024-09-01T10:30:00Z'), // PRIVATE - should never appear
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-09-01T10:30:00Z'),
};

const mockFullUserMinimal: FullUser = {
  _id: '660f5678901234567890abcd',
  email: 'bob@example.com',
  username: 'bob_the_seeker',
  createdAt: new Date('2024-02-15T00:00:00Z'),
  updatedAt: new Date('2024-02-15T00:00:00Z'),
};

describe('User Serializers - toPublicUser', () => {
  describe('Basic Serialization', () => {
    test('should extract only safe fields from FullUser', () => {
      const result = toPublicUser(mockFullUser);

      // Safe fields should be present
      expect(result._id).toBe(mockFullUser._id);
      expect(result.username).toBe(mockFullUser.username);
      expect(result.createdAt).toEqual(mockFullUser.createdAt);
    });

    test('should never include email field', () => {
      const result = toPublicUser(mockFullUser);
      expect(result).not.toHaveProperty('email');
      expect('email' in result).toBe(false);
    });

    test('should never include passwordHash field', () => {
      const result = toPublicUser(mockFullUser);
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('password');
    });

    test('should never include natal field', () => {
      const result = toPublicUser(mockFullUser);
      expect(result).not.toHaveProperty('natal');
      expect('natal' in result).toBe(false);
    });

    test('should never include location field', () => {
      const result = toPublicUser(mockFullUser);
      expect(result).not.toHaveProperty('location');
      expect('location' in result).toBe(false);
    });

    test('should never include lastSeenAt field', () => {
      const result = toPublicUser(mockFullUser);
      expect(result).not.toHaveProperty('lastSeenAt');
      expect('lastSeenAt' in result).toBe(false);
    });

    test('should return correct type shape', () => {
      const result = toPublicUser(mockFullUser);
      expect(typeof result._id).toBe('string');
      expect(typeof result.username).toBe('string');
      expect(result.createdAt instanceof Date).toBe(true);
    });
  });

  describe('Optional Fields', () => {
    test('should handle missing traditions field gracefully', () => {
      const result = toPublicUser(mockFullUser);
      // traditions is optional, should not be present if not in source
      expect(result.traditions).toBeUndefined();
    });

    test('should include traditions if present in user', () => {
      const userWithTraditions = {
        ...mockFullUser,
        traditions: ['Western Hermetic', 'Taoist'],
      };
      const result = toPublicUser(userWithTraditions);
      expect(result.traditions).toEqual(['Western Hermetic', 'Taoist']);
    });

    test('should include profileImageUrl if present in user', () => {
      const userWithImage = {
        ...mockFullUser,
        profileImageUrl: 'https://example.com/avatar.jpg',
      };
      const result = toPublicUser(userWithImage);
      expect(result.profileImageUrl).toBe('https://example.com/avatar.jpg');
    });

    test('should handle empty traditions array', () => {
      const userWithEmptyTraditions = {
        ...mockFullUser,
        traditions: [],
      };
      const result = toPublicUser(userWithEmptyTraditions);
      expect(result.traditions).toBeUndefined();
    });

    test('should skip profileImageUrl if it is falsy', () => {
      const userWithoutImage = {
        ...mockFullUser,
        profileImageUrl: '',
      };
      const result = toPublicUser(userWithoutImage);
      expect(result.profileImageUrl).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    test('should convert ObjectId to string', () => {
      const userWithObjectId = {
        ...mockFullUser,
        _id: { toString: () => 'converted-id' } as any,
      };
      const result = toPublicUser(userWithObjectId);
      expect(result._id).toBe('converted-id');
    });

    test('should handle user with all optional fields missing', () => {
      const result = toPublicUser(mockFullUserMinimal);
      expect(result._id).toBe(mockFullUserMinimal._id);
      expect(result.username).toBe(mockFullUserMinimal.username);
      expect(result.createdAt).toEqual(mockFullUserMinimal.createdAt);
      expect(result.traditions).toBeUndefined();
      expect(result.profileImageUrl).toBeUndefined();
    });

    test('should throw TypeError if user is null', () => {
      expect(() => toPublicUser(null)).toThrow(TypeError);
      expect(() => toPublicUser(null)).toThrow('User is required');
    });

    test('should throw TypeError if user is undefined', () => {
      expect(() => toPublicUser(undefined)).toThrow(TypeError);
      expect(() => toPublicUser(undefined)).toThrow('User is required');
    });
  });

  describe('PII Leakage Prevention', () => {
    test('should not expose email even if accessed via Object.keys', () => {
      const result = toPublicUser(mockFullUser);
      const keys = Object.keys(result);
      expect(keys).not.toContain('email');
    });

    test('should not expose natal even if accessed via Object.getOwnPropertyNames', () => {
      const result = toPublicUser(mockFullUser);
      const props = Object.getOwnPropertyNames(result);
      expect(props).not.toContain('natal');
    });

    test('should not expose location even if accessed via JSON.stringify', () => {
      const result = toPublicUser(mockFullUser);
      const json = JSON.stringify(result);
      expect(json).not.toContain('location');
      expect(json).not.toContain('"51.5074"');
      expect(json).not.toContain('"-0.1278"');
    });

    test('should not expose lastSeenAt in JSON serialization', () => {
      const result = toPublicUser(mockFullUser);
      const json = JSON.stringify(result);
      expect(json).not.toContain('lastSeenAt');
      expect(json).not.toContain('2024-09-01');
    });

    test('should produce deterministic output (same input = same output)', () => {
      const result1 = toPublicUser(mockFullUser);
      const result2 = toPublicUser(mockFullUser);
      expect(result1).toEqual(result2);
      expect(JSON.stringify(result1)).toBe(JSON.stringify(result2));
    });
  });

  describe('Serialization Correctness', () => {
    test('should match PublicUser interface shape', () => {
      const result = toPublicUser(mockFullUser);
      const publicUser: PublicUser = result;
      expect(publicUser._id).toBeDefined();
      expect(publicUser.username).toBeDefined();
      expect(publicUser.createdAt).toBeDefined();
    });

    test('should preserve createdAt as Date object', () => {
      const createdAt = new Date('2024-01-15T12:30:45Z');
      const user = { ...mockFullUser, createdAt };
      const result = toPublicUser(user);
      expect(result.createdAt).toEqual(createdAt);
      expect(result.createdAt instanceof Date).toBe(true);
    });
  });
});

describe('User Serializers - toPublicUsers', () => {
  test('should convert array of FullUsers to PublicUsers', () => {
    const users = [mockFullUser, mockFullUserMinimal];
    const results = toPublicUsers(users);

    expect(results).toHaveLength(2);
    expect(results[0]._id).toBe(mockFullUser._id);
    expect(results[1]._id).toBe(mockFullUserMinimal._id);
  });

  test('should preserve order of users in array', () => {
    const users = [mockFullUserMinimal, mockFullUser];
    const results = toPublicUsers(users);

    expect(results[0]._id).toBe(mockFullUserMinimal._id);
    expect(results[1]._id).toBe(mockFullUser._id);
  });

  test('should throw TypeError if input is not an array', () => {
    expect(() => toPublicUsers({} as any)).toThrow(TypeError);
    expect(() => toPublicUsers('users' as any)).toThrow(TypeError);
    expect(() => toPublicUsers(null as any)).toThrow(TypeError);
  });

  test('should handle empty array', () => {
    const results = toPublicUsers([]);
    expect(results).toEqual([]);
  });

  test('should never expose PII in any converted user', () => {
    const users = [mockFullUser, mockFullUserMinimal];
    const results = toPublicUsers(users);

    results.forEach(publicUser => {
      expect(publicUser).not.toHaveProperty('email');
      expect(publicUser).not.toHaveProperty('natal');
      expect(publicUser).not.toHaveProperty('location');
      expect(publicUser).not.toHaveProperty('lastSeenAt');
    });
  });
});

describe('User Serializers - isSafePublic', () => {
  test('should return true for PublicUser objects', () => {
    const publicUser: PublicUser = {
      _id: '660f1234567890abcdef1234',
      username: 'alice',
      createdAt: new Date(),
    };
    expect(isSafePublic(publicUser)).toBe(true);
  });

  test('should return false if email is present', () => {
    const unsafeUser = {
      _id: '660f1234567890abcdef1234',
      username: 'alice',
      email: 'alice@example.com',
      createdAt: new Date(),
    };
    expect(isSafePublic(unsafeUser)).toBe(false);
  });

  test('should return false if natal is present', () => {
    const unsafeUser = {
      _id: '660f1234567890abcdef1234',
      username: 'alice',
      natal: { birthDate: '1990-05-15' },
      createdAt: new Date(),
    };
    expect(isSafePublic(unsafeUser)).toBe(false);
  });

  test('should return false if location is present', () => {
    const unsafeUser = {
      _id: '660f1234567890abcdef1234',
      username: 'alice',
      location: { lat: 40.7128, lon: -74.006 },
      createdAt: new Date(),
    };
    expect(isSafePublic(unsafeUser)).toBe(false);
  });

  test('should return false if lastSeenAt is present', () => {
    const unsafeUser = {
      _id: '660f1234567890abcdef1234',
      username: 'alice',
      lastSeenAt: new Date(),
      createdAt: new Date(),
    };
    expect(isSafePublic(unsafeUser)).toBe(false);
  });

  test('should return false if password is present', () => {
    const unsafeUser = {
      _id: '660f1234567890abcdef1234',
      username: 'alice',
      password: 'hashed-password',
      createdAt: new Date(),
    };
    expect(isSafePublic(unsafeUser)).toBe(false);
  });

  test('should return false if passwordHash is present', () => {
    const unsafeUser = {
      _id: '660f1234567890abcdef1234',
      username: 'alice',
      passwordHash: 'hashed-password',
      createdAt: new Date(),
    };
    expect(isSafePublic(unsafeUser)).toBe(false);
  });

  test('should return true if PII fields are null/undefined', () => {
    const userWithNullPII = {
      _id: '660f1234567890abcdef1234',
      username: 'alice',
      email: null,
      natal: undefined,
      location: null,
      lastSeenAt: undefined,
      createdAt: new Date(),
    };
    expect(isSafePublic(userWithNullPII)).toBe(true);
  });

  test('should return true for non-object inputs', () => {
    expect(isSafePublic(null)).toBe(true);
    expect(isSafePublic(undefined)).toBe(true);
    expect(isSafePublic('string')).toBe(true);
    expect(isSafePublic(123)).toBe(true);
  });

  test('should return true for empty objects', () => {
    expect(isSafePublic({})).toBe(true);
  });
});

describe('Integration: Serialization Chain', () => {
  test('toPublicUser output should pass isSafePublic check', () => {
    const publicUser = toPublicUser(mockFullUser);
    expect(isSafePublic(publicUser)).toBe(true);
  });

  test('toPublicUsers output should pass isSafePublic check for all users', () => {
    const users = [mockFullUser, mockFullUserMinimal];
    const publicUsers = toPublicUsers(users);
    publicUsers.forEach(user => {
      expect(isSafePublic(user)).toBe(true);
    });
  });

  test('JSON serialization of toPublicUser should not expose PII', () => {
    const publicUser = toPublicUser(mockFullUser);
    const json = JSON.stringify(publicUser);
    const parsed = JSON.parse(json);
    expect(isSafePublic(parsed)).toBe(true);
  });

  test('should handle round-trip serialization', () => {
    const publicUser1 = toPublicUser(mockFullUser);
    const json = JSON.stringify(publicUser1);
    const publicUser2: PublicUser = JSON.parse(json);
    
    // Note: createdAt becomes a string after JSON round-trip
    expect(publicUser2._id).toBe(publicUser1._id);
    expect(publicUser2.username).toBe(publicUser1.username);
  });
});
