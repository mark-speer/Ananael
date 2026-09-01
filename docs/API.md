# Ananael API Reference - Authentication & User Profiles

## Overview

The authentication system separates **internal user data** (FullUser) from **public user data** (PublicUser) to prevent PII leakage in API responses.

### User Data Types

#### FullUser (Internal Only)
Returned only to authenticated users accessing their own data. Contains all user information including sensitive fields.

```typescript
interface FullUser {
  _id: string;                  // MongoDB ObjectId as string
  email: string;                // Email (PRIVATE - never in public responses)
  username: string;             // Public display name
  natal?: {                      // Birth data (PRIVATE - never public)
    birthDate: string;          // YYYY-MM-DD
    birthTime?: string | null;  // HH:MM or null
    birthPlace?: {
      lat: number;
      lon: number;
    } | null;
    label?: string | null;
  } | null;
  location?: {                   // Geographic location (PRIVATE - never public)
    lat: number;
    lon: number;
  } | null;
  lastSeenAt?: Date | null;     // Last auth activity (PRIVATE - never public)
  createdAt: Date;              // Account creation date
  updatedAt: Date;              // Last update date
}
```

#### PublicUser (Safe to Share)
Returned in all public contexts. Guaranteed to contain no PII.

```typescript
interface PublicUser {
  _id: string;                  // MongoDB ObjectId as string
  username: string;             // Public display name
  traditions?: string[];        // User's magical traditions (optional)
  profileImageUrl?: string;     // User avatar URL (optional)
  createdAt: Date;              // Account creation date
}
```

### PII Fields (Never Public)
These fields are **always private** and never included in PublicUser responses:
- `email` — Authentication credential
- `passwordHash` — Security credential
- `natal` — Birth data (very sensitive esoteric information)
- `location` — Geographic coordinates (tracking data)
- `lastSeenAt` — Presence tracking data

---

## Authentication Endpoints

### POST /api/auth/register
Register a new user account.

**Authentication:** Not required  
**Returns:** FullUser (user owns account), sets HttpOnly auth cookie

**Request Body:**
```json
{
  "username": "alice_the_wise",
  "email": "alice@example.com",
  "password": "secure_password_6plus_chars"
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "_id": "660f1234567890abcdef1234",
    "username": "alice_the_wise",
    "email": "alice@example.com",
    "natal": null,
    "location": null,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` — Missing required fields or invalid password length
- `409 Conflict` — Email already registered

---

### POST /api/auth/login
Authenticate and receive session token.

**Authentication:** Not required  
**Returns:** FullUser (user owns account), sets HttpOnly auth cookie

**Request Body:**
```json
{
  "email": "alice@example.com",
  "password": "secure_password_6plus_chars"
}
```

**Response:** `200 OK`
```json
{
  "user": {
    "_id": "660f1234567890abcdef1234",
    "username": "alice_the_wise",
    "email": "alice@example.com",
    "natal": {
      "birthDate": "1990-05-15",
      "birthTime": "14:30",
      "birthPlace": {
        "lat": 40.7128,
        "lon": -74.006
      },
      "label": "NYC Birth"
    },
    "location": {
      "lat": 51.5074,
      "lon": -0.1278
    },
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized` — Invalid email or password
- `500 Server Error` — Login processing failed

---

### POST /api/auth/logout
Clear authentication session.

**Authentication:** Not required  
**Returns:** `204 No Content`

---

### GET /api/auth/me
Fetch authenticated user's full profile.

**Authentication:** Required (HttpOnly cookie)  
**Returns:** FullUser (includes email, natal, location)

**Response:** `200 OK`
```json
{
  "user": {
    "_id": "660f1234567890abcdef1234",
    "username": "alice_the_wise",
    "email": "alice@example.com",
    "natal": { /* full birth data */ },
    "location": { /* coordinates */ },
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized` — Not authenticated
- `404 Not Found` — User account deleted
- `500 Server Error` — Fetch failed

---

### PUT /api/auth/location
Update user's geographic location (used for Celestial Timing).

**Authentication:** Required  
**Request Body:**
```json
{
  "lat": 51.5074,
  "lon": -0.1278
}
```

**Response:** `200 OK`
```json
{
  "user": {
    /* Full FullUser object with updated location */
  }
}
```

**Validation:**
- `lat` must be between -90 and 90
- `lon` must be between -180 and 180
- Both must be valid numbers

**Error Responses:**
- `400 Bad Request` — Invalid coordinates
- `401 Unauthorized` — Not authenticated
- `404 Not Found` — User not found

---

### PUT /api/auth/natal
Update user's natal birth profile (used for Celestial Timing).

**Authentication:** Required  
**Request Body:**
```json
{
  "birthDate": "1990-05-15",
  "birthTime": "14:30",
  "birthPlace": {
    "lat": 40.7128,
    "lon": -74.006
  },
  "label": "NYC Birth"
}
```

**Field Details:**
- `birthDate` — Required, format: `YYYY-MM-DD`
- `birthTime` — Optional, format: `HH:MM` (24-hour)
- `birthPlace` — Optional, coordinates `{lat, lon}`
- `label` — Optional, display name (max 80 chars)

**Response:** `200 OK`
```json
{
  "user": {
    /* Full FullUser object with updated natal data */
  }
}
```

**Error Responses:**
- `400 Bad Request` — Invalid date/time format
- `401 Unauthorized` — Not authenticated
- `404 Not Found` — User not found

---

### POST /api/auth/presence
Heartbeat for idle clients (updates lastSeenAt).

**Authentication:** Required  
**Returns:** `204 No Content`

Used by client applications to indicate user activity.

---

### GET /api/auth/user-count
Get total registered users and current online count.

**Authentication:** Not required  
**Returns:** `200 OK`

**Response:**
```json
{
  "count": 1247,
  "online": 43
}
```

---

## Public User Profile Endpoints

### GET /api/users/:userId/public
Fetch public user profile (no authentication required).

**Authentication:** Not required  
**Returns:** PublicUser (safe for public sharing)

**URL Parameters:**
- `userId` — MongoDB ObjectId (24 hex chars)

**Response:** `200 OK`
```json
{
  "_id": "660f1234567890abcdef1234",
  "username": "alice_the_wise",
  "traditions": ["Western Hermetic", "Taoist"],
  "profileImageUrl": "https://...",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**Security Guarantees:**
- ✓ Email **never** included
- ✓ Natal data **never** included
- ✓ Location **never** included
- ✓ lastSeenAt **never** included
- ✓ passwordHash **never** included

**Error Responses:**
- `400 Bad Request` — Invalid userId format
- `404 Not Found` — User not found
- `500 Server Error` — Server error

---

## Security Best Practices

### For Frontend Developers
1. **Always use FullUser for authenticated contexts** (login, profile page, settings)
2. **Always use PublicUser for social contexts** (shared designs, creator attribution)
3. **Never send FullUser data to public endpoints**
4. **Assume PublicUser has no email/natal/location fields**

### For Backend Developers
1. **Use `toPublicUser()` serializer when returning public responses**
2. **Use `isSafePublic()` helper to validate before sending**
3. **Auth-gated endpoints return FullUser** (login, /auth/me, PUT auth/*)
4. **Public endpoints return PublicUser** (/api/users/:id/public, shared designs)
5. **Never return Mongoose documents directly** (always serialize)

### Type Safety
The TypeScript interfaces prevent accidental PII exposure at compile time:
```typescript
// ✅ This works - FullUser has email
const fullUser: FullUser = { /* ... email: "..." */ };

// ❌ This fails - PublicUser doesn't have email
const publicUser: PublicUser = { /* ... email: "..." */ };
// TypeScript Error: Object literal may only specify known properties
```

---

## Serializer Functions

### toPublicUser(user: FullUser | IUser): PublicUser
Converts a FullUser or Mongoose user document to a safe PublicUser DTO.

```typescript
import { toPublicUser } from '../lib/userSerializers';

const user = await User.findById(userId);
const publicUser = toPublicUser(user);
res.json(publicUser); // Safe to send publicly
```

**Guarantees:**
- Only includes safe fields
- Never includes PII fields
- Deterministic (same input → same output)
- Type-safe output

### toPublicUsers(users: FullUser[]): PublicUser[]
Batch convert array of users.

```typescript
const users = await User.find().limit(10);
const publicUsers = toPublicUsers(users);
res.json(publicUsers); // All safe
```

### isSafePublic(obj: any): boolean
Runtime validation that an object contains no PII.

```typescript
const publicUser = toPublicUser(user);
if (isSafePublic(publicUser)) {
  res.json(publicUser); // Safe to broadcast
}
```

---

## PII Isolation Verification

The system verifies PII isolation through:

1. **TypeScript Interfaces** — Compile-time type safety
2. **Serializer Functions** — Runtime conversion with validation
3. **Automated Tests** — Unit tests verify email/natal/location never leak
4. **Safe Public Validator** — Runtime checks before sending

### Test Coverage
- ✓ toPublicUser never includes email
- ✓ toPublicUser never includes natal
- ✓ toPublicUser never includes location
- ✓ toPublicUser never includes lastSeenAt
- ✓ toPublicUser never includes passwordHash
- ✓ JSON serialization never leaks PII
- ✓ Deterministic output (same input → same output)
- ✓ Edge cases handled (missing fields, null values)

---

## Future Enhancements

- [ ] Add `traditions` table with user_traditions join
- [ ] Add `profileImageUrl` support (avatar uploads)
- [ ] Add `bio` field (optional, user-generated)
- [ ] Social follow/reputation system (Phase S3+)
- [ ] Public profile discovery endpoint (Phase 52)
- [ ] User search with pagination (Phase S3+)

---

## Share URLs (Phase 51)

### Route Pattern: `/s/:type/:id`

Share links for viewing designs publicly (no authentication required).

**Supported Types:**
- `talisman` — Kamea, sigil, or sutra design
- `circle` — Solomonic circle
- `ritual` — Ritual layout / altar
- `tree` — Tree of Life study note
- `opus` — Athanor vessel
- `practice` — Subtle Body or Shamanism practice vessel

**Examples:**
```
/s/talisman/660f1234567890abcdef1234
/s/circle/660f2234567890abcdef2234
/s/ritual/660f3234567890abcdef3234
/s/tree/660f4234567890abcdef4234
```

### Implementation

**Frontend:** React Router handles `/s/:type/:id` via SharePage component (`client/src/components/SharePage.tsx`).

**Backend:** Each model provides a public endpoint:
- `GET /api/talisman/:id/public` → TalismanDesign with creator
- `GET /api/solomonic/:id/public` → SolomonicCircle with creator
- `GET /api/ritual/:id/public` → RitualLayout with creator
- `GET /api/tree/:id/public` → TreeNote with creator
- `GET /api/opus/:id/public` → OpusVessel with creator
- `GET /api/practice/:id/public` → PracticeVessel with creator

**Authentication:** Not required for public endpoints.

**Visibility Control:**
- If `visibility === 'private'` → Returns 403 Forbidden
- If `visibility === 'unlisted'` or `public` → Returns design + creator info

### Response Format

```json
{
  "_id": "660f1234567890abcdef1234",
  "name": "Mercury Sigil for Communication",
  "kind": "sigil",
  "config": { /* design data */ },
  "notes": "Created for business presentation",
  "visibility": "unlisted",
  "creator": {
    "_id": "660f9999999999999999999",
    "username": "alice_the_wise",
    "traditions": ["Western Hermetic", "Taoist"],
    "profileImageUrl": "https://...",
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### Security Guarantees

- ✓ Creator `email` **never** included
- ✓ Creator `natal` data **never** included
- ✓ Creator `location` **never** included
- ✓ Creator `lastSeenAt` **never** included
- ✓ Private designs return 403 (not revealed as existing)
- ✓ Design content visible only to guests with link

---

## Visibility Field (Phase 51)

All shareable models include a `visibility` field controlling access level.

### Enum Values

```typescript
enum Visibility {
  PRIVATE = 'private',      // Owner only (default, backward compatible)
  UNLISTED = 'unlisted',    // Link-shareable (Phase 51)
  PUBLIC = 'public',        // Public registry listing (Phase 52+)
}
```

### Default Behavior

All existing documents default to `'private'` via migration script (`server/scripts/migrations/add-visibility.ts`).

**Backward Compatibility:** Existing designs automatically become private-only until explicitly published.

### Model Usage

```typescript
// Talisman Design
{
  userId: ObjectId,
  name: string,
  kind: 'kamea' | 'sigil' | 'sutra',
  config: object,
  visibility: 'private' | 'unlisted' | 'public',  // Default: 'private'
}

// All 6 models follow same pattern:
// - TalismanDesign
// - SolomonicCircle
// - RitualLayout
// - OpusVessel
// - PracticeVessel
// - TreeNote
```

### Querying by Visibility

```typescript
// Get all public designs
const publicDesigns = await TalismanDesign.find({ visibility: 'public' });

// Get owner's unlisted designs
const unlistedDesigns = await TalismanDesign.find({ 
  userId: creatorId, 
  visibility: 'unlisted' 
});

// Get all owner's designs (private + unlisted + public)
const allOwned = await TalismanDesign.find({ userId: creatorId });
```

### Modifying Visibility

**Owner only — requires authentication:**

```
PATCH /api/talisman/:designId
  Body: { visibility: 'private' | 'unlisted' | 'public' }
  Auth: Required (must be owner)
  Response: 200 { design with updated visibility }
```

Same pattern for all 6 model endpoints.

---

## Related Documentation

- **Architecture:** `docs/ARCHITECTURE.md`
- **TypeScript Types:** `docs/TYPES.md`
- **Phase 51 Guide:** `docs/PHASE-51-IMPLEMENTATION-GUIDE.md`
- **Quick Reference:** `docs/QW-QUICK-REFERENCE.md`
- **Migrations:** `docs/MIGRATIONS.md`
- **Handoff Checklist:** `docs/QW-HANDOFF-CHECKLIST.md`
