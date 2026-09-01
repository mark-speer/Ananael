# QW4: Draft Public User DTO & PII Isolation

**Goal:** Design public user profile shape that avoids PII leakage. Never expose email, birth data, or location in social contexts.

---

## Problem Statement

Current `User` model includes:
- `email` — private (authentication)
- `passwordHash` — private (never exposed)
- `natal` — private (personalization)
- `location` — private (Magical OS personalization)
- `lastSeenAt` — private (presence)

When a practitioner shares a design, we need to show the creator's username + traditions, but **never** their PII.

---

## Public User DTO Design

```typescript
// server/src/lib/userSerializers.ts

/** Full User object (login response, /api/auth/me only) */
export interface FullUser {
  _id: string;
  email: string;
  username: string;
  natal?: {
    date: string;
    time?: string;
    place?: string;
    // ... full chart data
  };
  location?: {
    lat: number;
    lon: number;
    name?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

/** Public User object (profiles, shared artifacts, presence) */
export interface PublicUser {
  _id: string;
  username: string;
  traditions?: string[]; // e.g., ['Western Hermetic', 'Taoist']
  profileImageUrl?: string; // Optional avatar
  createdAt: Date; // Account creation date (public info)
}

/** User presence (online count, last seen) */
export interface UserPresence {
  _id: string;
  username: string;
  isOnline: boolean;
  lastSeenAt: Date;
}

/** Sanitize full user to public DTO */
export function toPublicUser(user: FullUser): PublicUser {
  return {
    _id: user._id,
    username: user.username,
    traditions: [], // Placeholder; add later if user_traditions table
    profileImageUrl: undefined, // Placeholder
    createdAt: user.createdAt,
  };
}
```

---

## TypeScript Interfaces

**File:** `server/src/types/user.ts`

```typescript
import type { Document } from 'mongoose';

export interface PublicUserProfile {
  _id: string;
  username: string;
  traditions?: string[];
  profileImageUrl?: string;
  createdAt: Date;
}

export interface UserPresenceInfo {
  _id: string;
  username: string;
  isOnline: boolean;
  lastSeenAt?: Date;
}

export interface UserDocument extends Document {
  _id: string;
  email: string;
  username: string;
  passwordHash: string;
  natal?: object; // Don't expose in public
  location?: object; // Don't expose in public
  createdAt: Date;
  updatedAt: Date;
  lastSeenAt?: Date;
}

// Helper function to extract public profile
export function userToPublicProfile(user: UserDocument): PublicUserProfile {
  return {
    _id: user._id.toString(),
    username: user.username,
    traditions: [], // Future: fetch from user_traditions table
    profileImageUrl: undefined, // Future: user avatar
    createdAt: user.createdAt,
  };
}
```

---

## API Usage Examples

### Login Response (Full User, Auth-gated)
```typescript
// POST /api/auth/login
// Response: 200 OK
{
  user: {
    _id: "660f...",
    email: "alice@example.com",
    username: "alice_the_wise",
    natal: { date: "1990-05-15", ... },
    location: { lat: 40.7128, lon: -74.0060 },
    createdAt: "2024-01-01T00:00:00Z"
  },
  token: "eyJ0eXAi..." // httpOnly cookie
}
```

### Public Profile Endpoint (Stripped DTO)
```typescript
// GET /api/users/:username/public (no auth required)
// Response: 200 OK
{
  _id: "660f...",
  username: "alice_the_wise",
  traditions: ["Western Hermetic"],
  profileImageUrl: "https://...",
  createdAt: "2024-01-01T00:00:00Z"
}
```

### Shared Design Response (Creator stripped)
```typescript
// GET /api/talisman/designs/:id/public (no auth required)
// Response: 200 OK
{
  _id: "550e...",
  name: "Planetary Kamea - Mercury",
  mode: "kamea",
  config: { ... },
  visibility: "public",
  creator: {
    _id: "660f...",
    username: "alice_the_wise",
    createdAt: "2024-01-01T00:00:00Z"
  },
  createdAt: "2024-09-15T12:00:00Z"
}
```

---

## Implementation Checklist

### 1. Create Serializers
- [ ] Define PublicUserProfile interface
- [ ] Implement toPublicUser() function
- [ ] Add unit tests (verify email/natal/location never included)

### 2. Update Auth Routes
- [ ] `POST /api/auth/login` — return full user (test: email present)
- [ ] `GET /api/auth/me` — return full user (test: email present)
- [ ] Verify password reset uses full user (no leakage)

### 3. Create Public Routes
- [ ] `GET /api/users/:username/public` — return stripped profile
- [ ] Test: email not in response
- [ ] Test: natal not in response
- [ ] Test: location not in response

### 4. Update Share Design Responses
- [ ] All `/api/*/designs/:id/public` responses
- [ ] Include `creator: toPublicUser(designOwner)`
- [ ] Never include full User object

### 5. Presence Endpoints (Future)
- [ ] `GET /api/auth/user-count` — count online users
- [ ] `GET /api/auth/presence` — return only username + isOnline
- [ ] Never leak email or last location

### 6. Testing
```typescript
// Unit test: PII isolation
describe('User Serializers', () => {
  it('toPublicUser never exposes email', () => {
    const fullUser: FullUser = {
      _id: '660f...',
      email: 'alice@example.com', // Should not appear
      username: 'alice_the_wise',
      natal: { ... }, // Should not appear
      location: { lat: 40.7128, lon: -74.0060 }, // Should not appear
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const publicUser = toPublicUser(fullUser);

    expect(publicUser).toEqual({
      _id: '660f...',
      username: 'alice_the_wise',
      traditions: [],
      profileImageUrl: undefined,
      createdAt: expect.any(Date),
    });
    expect(publicUser).not.toHaveProperty('email');
    expect(publicUser).not.toHaveProperty('natal');
    expect(publicUser).not.toHaveProperty('location');
  });
});
```

---

## Acceptance Criteria

- ✓ PublicUserProfile interface defined
- ✓ toPublicUser() function implemented
- ✓ Unit tests verify PII isolation (>80% coverage)
- ✓ Login endpoint returns full user (auth-gated)
- ✓ Public profile endpoint returns stripped DTO (no auth)
- ✓ All share design endpoints use public DTO for creator
- ✓ No regressions in existing endpoints
- ✓ Code reviewed (no email/natal/location in public responses)

---

## Future Enhancements

- Add `traditions` field (user_traditions table + join)
- Add `profileImageUrl` (user avatar upload)
- Add `bio` field (optional, user-generated)
- Social follow/reputation score (Phase S3+)

---

## Next Steps
- Phase 51, P3: Integrate toPublicUser() into public endpoints
- Phase 52: Display public user info on shared designs
- Phase S3+: Add follow/reputation on public profiles
