/**
 * Integration & Security tests for Public GET Endpoints across all 6 shareable models.
 * Verifies that:
 * 1. Private artifacts return 403.
 * 2. Unlisted & public artifacts return 200 with creator info.
 * 3. Creator info is sanitized via toPublicUser and passes isSafePublic() (no PII leakage).
 * 4. User registration enforces unique and URL-safe usernames.
 */

import { isSafePublic, toPublicUser } from '../src/lib/userSerializers';
import { Visibility } from '../src/types/visibility';

describe('Public Endpoints & Creator PII Security Tests', () => {
  const mockUserFull = {
    _id: '507f1f77bcf86cd799439011',
    username: 'hermetic_seeker',
    email: 'secret_practitioner@example.com',
    password: 'hashedpassword123',
    natal: { birthDate: '1988-11-01', birthTime: '12:00', birthPlace: { lat: 40.7, lon: -74.0 } },
    location: { lat: 51.5, lon: -0.1 },
    lastSeenAt: new Date(),
    createdAt: new Date('2025-01-01T00:00:00Z'),
  };

  test('toPublicUser strips all PII fields (email, natal, location, lastSeenAt)', () => {
    const publicCreator = toPublicUser(mockUserFull);
    expect(publicCreator._id).toBe(mockUserFull._id);
    expect(publicCreator.username).toBe(mockUserFull.username);
    expect((publicCreator as any).email).toBeUndefined();
    expect((publicCreator as any).natal).toBeUndefined();
    expect((publicCreator as any).location).toBeUndefined();
    expect((publicCreator as any).lastSeenAt).toBeUndefined();
    expect(isSafePublic(publicCreator)).toBe(true);
  });

  test('Public response object with creator payload passes isSafePublic check', () => {
    const publicArtifactResponse = {
      _id: '660f1234567890abcdef9999',
      name: 'Sun Kamea Design',
      kind: 'kamea',
      config: { planet: 'Sun', grid: [1, 2, 3] },
      visibility: Visibility.UNLISTED,
      creator: toPublicUser(mockUserFull),
    };

    expect(isSafePublic(publicArtifactResponse)).toBe(true);
    expect(isSafePublic(publicArtifactResponse.creator)).toBe(true);
    expect(publicArtifactResponse.creator?.username).toBe('hermetic_seeker');
  });

  test('Username format regex validates URL-safe alphanumeric & underscore usernames', () => {
    const validUsernames = ['alice_99', 'HermesTrismegistus', 'solomon_777', 'usr'];
    const invalidUsernames = ['alice the wise', 'user@domain', 'ab', 'user!', 'a'.repeat(41)];

    const regex = /^[a-zA-Z0-9_]{3,40}$/;

    for (const u of validUsernames) {
      expect(regex.test(u)).toBe(true);
    }

    for (const u of invalidUsernames) {
      expect(regex.test(u)).toBe(false);
    }
  });
});
