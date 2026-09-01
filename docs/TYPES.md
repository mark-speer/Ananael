# Ananael TypeScript Types Guide

Complete reference for TypeScript types used throughout the Ananael codebase.

---

## User Types

### FullUser (Internal Representation)

Used only for authenticated endpoints where the user owns the data. Contains all user information including sensitive fields.

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

**Usage:**
```typescript
// ✅ Auth endpoints (login, /api/auth/me, PUT /api/auth/location)
import { FullUser } from '../types/User';

const handleLogin = async (credentials) => {
  const response = await fetch('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
  const { user }: { user: FullUser } = await response.json();
  // User object has email, natal, location
};
```

### PublicUser (Safe for Sharing)

Used for all public-facing endpoints. Guaranteed to contain no PII.

```typescript
interface PublicUser {
  _id: string;                  // MongoDB ObjectId as string
  username: string;             // Public display name
  traditions?: string[];        // User's magical traditions (optional)
  profileImageUrl?: string;     // User avatar URL (optional)
  createdAt: Date;              // Account creation date
}
```

**Usage:**
```typescript
// ✅ Public endpoints (share links, creator attribution)
import { PublicUser } from '../types/User';

const renderCreator = (creator: PublicUser) => {
  // Safe to display: username, traditions, profileImageUrl
  // NOT available: email, natal, location, lastSeenAt
};

// ❌ WRONG - PublicUser doesn't have email
const badCode = (user: PublicUser) => {
  console.log(user.email); // TypeScript Error!
};
```

### Type Guards

Use type guard functions to narrow union types:

```typescript
import { isPublicUser, isFullUser } from '../types/User';

function handleUserData(user: FullUser | PublicUser) {
  if (isFullUser(user)) {
    // user is FullUser - has email, natal, location
    console.log(user.email);
  } else if (isPublicUser(user)) {
    // user is PublicUser - safe fields only
    console.log(user.username);
  }
}
```

---

## Visibility Types

### Visibility Enum

Controls access level for shareable artifacts (talismans, circles, rituals, etc.).

```typescript
enum Visibility {
  PRIVATE = 'private',      // Only owner can see (default)
  UNLISTED = 'unlisted',    // Anyone with link can see
  PUBLIC = 'public',        // Appears in directories (future)
}

type VisibilityString = 'private' | 'unlisted' | 'public';

const DEFAULT_VISIBILITY: VisibilityString = 'private';
```

**Import:**
```typescript
import { Visibility, DEFAULT_VISIBILITY, VisibilityString } from '../types/visibility';
```

**Usage:**
```typescript
// Check visibility level
if (design.visibility === Visibility.PUBLIC) {
  // Safe to show in any context
}

if (design.visibility === Visibility.PRIVATE) {
  // Only show to owner
}

// Set default when creating
const newDesign = {
  visibility: DEFAULT_VISIBILITY, // 'private'
};

// Validate user input
const isValidVisibility = (value: string): value is VisibilityString => {
  return Object.values(Visibility).includes(value as Visibility);
};
```

---

## Shared Artifact Types

### ITalismanDesign

Kamea, sigil, or sutra design with visibility control.

```typescript
interface ITalismanDesign extends Document {
  userId: Types.ObjectId;       // Creator ID
  date: Date;                   // Creation date
  name: string;                 // Design name (max 100 chars)
  kind: 'kamea' | 'sigil' | 'sutra';
  config: Record<string, unknown>;  // Design configuration JSON
  notes?: string;               // User notes (max 5000 chars)
  visibility: VisibilityString; // 'private' | 'unlisted' | 'public'
  createdAt: Date;
  updatedAt: Date;
}
```

**Example:**
```typescript
const talisman: ITalismanDesign = {
  _id: new ObjectId(),
  userId: creatorId,
  name: "Mercury Sigil for Communication",
  kind: "sigil",
  visibility: "unlisted", // Can share via link
  config: { /* sigil data */ },
  notes: "Created for business presentation",
};
```

### ISolomonicCircle

Solomonic circle design (Goetia, Heptameron, generic).

```typescript
interface ISolomonicCircle extends Document {
  userId: Types.ObjectId;
  date: Date;
  name: string;                 // Max 100 chars
  tradition: 'goetia' | 'heptameron' | 'generic';
  config: Record<string, unknown>;  // Circle configuration JSON
  notes?: string;               // Max 5000 chars
  visibility: VisibilityString;
  createdAt: Date;
  updatedAt: Date;
}
```

### IRitualLayout

Altar or ritual space layout.

```typescript
interface IRitualLayout extends Document {
  userId: Types.ObjectId;
  date: Date;
  name: string;                 // Max 100 chars
  config: Record<string, unknown>;  // Layout configuration JSON
  notes?: string;
  visibility: VisibilityString;
  createdAt: Date;
  updatedAt: Date;
}
```

### IOpusVessel

Athanor / Alchemical vessel vessel.

```typescript
interface IOpusVessel extends Document {
  userId: Types.ObjectId;
  date: Date;
  name: string;
  stageId?: string;             // Alchemical stage reference
  config: Record<string, unknown>;
  notes?: string;
  visibility: VisibilityString;
  createdAt: Date;
  updatedAt: Date;
}
```

### IPracticeVessel

Subtle Body or Shamanism practice intention.

```typescript
interface IPracticeVessel extends Document {
  userId: Types.ObjectId;
  date: Date;
  name: string;
  config: Record<string, unknown>;  // Contains system: 'shamanism' | subtle-body fields
  notes?: string;
  visibility: VisibilityString;
  createdAt: Date;
  updatedAt: Date;
}
```

### ITreeNote

Tree of Life study note.

```typescript
interface ITreeNote extends Document {
  userId: Types.ObjectId;
  date: Date;
  nodeId: string;               // Sephirah reference (e.g., 'malkuth', 'kether')
  content: string;              // Study notes
  visibility: VisibilityString;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## User Serializer Functions

### toPublicUser()

Converts a FullUser or Mongoose document to a safe PublicUser DTO.

```typescript
import { toPublicUser } from '../lib/userSerializers';

// From any user data source
const user = await User.findById(userId);
const publicUser = toPublicUser(user);

// Result is type-safe PublicUser
res.json(publicUser);
```

**Guarantees:**
- Only includes safe fields (username, traditions, profileImageUrl, createdAt)
- Never includes email, natal, location, lastSeenAt, passwordHash
- Handles edge cases (null values, missing fields)
- Type-safe output

**Signature:**
```typescript
function toPublicUser(user: FullUser | IUser | any): PublicUser
```

### toPublicUsers()

Batch convert array of users.

```typescript
const users = await User.find().limit(10);
const publicUsers = toPublicUsers(users);
res.json(publicUsers);
```

**Signature:**
```typescript
function toPublicUsers(users: (FullUser | IUser | any)[]): PublicUser[]
```

### isSafePublic()

Runtime validation that an object contains no PII.

```typescript
const publicUser = toPublicUser(user);
if (!isSafePublic(publicUser)) {
  throw new Error('PII leakage detected!');
}
res.json(publicUser); // Safe to broadcast
```

**Signature:**
```typescript
function isSafePublic(obj: any): boolean
```

---

## Import Reference

### Common Imports

```typescript
// User types
import type { FullUser, PublicUser } from '../types/User';
import { isFullUser, isPublicUser } from '../types/User';

// Visibility
import { Visibility, DEFAULT_VISIBILITY, type VisibilityString } from '../types/visibility';

// Model types (server-side)
import type { IUser } from '../models/User';
import type { ITalismanDesign } from '../models/TalismanDesign';
import type { ISolomonicCircle } from '../models/SolomonicCircle';
import type { IRitualLayout } from '../models/RitualLayout';
import type { IOpusVessel } from '../models/OpusVessel';
import type { IPracticeVessel } from '../models/PracticeVessel';
import type { ITreeNote } from '../models/TreeNote';

// Serializers
import { toPublicUser, toPublicUsers, isSafePublic } from '../lib/userSerializers';
```

---

## Best Practices

### 1. Always Use the Right Type

```typescript
// ✅ CORRECT - Using FullUser for private context
async function getMyProfile(req: AuthRequest): Promise<FullUser> {
  const user = await User.findById(req.userId);
  return {
    _id: user._id.toString(),
    email: user.email,
    username: user.username,
    // ... full user data
  };
}

// ✅ CORRECT - Using PublicUser for public context
async function getPublicProfile(userId: string): Promise<PublicUser> {
  const user = await User.findById(userId);
  return toPublicUser(user);
}

// ❌ WRONG - Returning FullUser publicly
async function badGetPublicProfile(userId: string): Promise<FullUser> {
  const user = await User.findById(userId);
  return user as FullUser; // Exposes email, natal, location!
}
```

### 2. Type Safety at Compile Time

```typescript
// TypeScript prevents PII exposure at compile time
const fullUser: FullUser = { /* ... email: "user@example.com" */ };
const publicUser: PublicUser = fullUser; // ❌ TypeScript Error!
// Type 'FullUser' is not assignable to type 'PublicUser'

// Always convert explicitly
const publicUser: PublicUser = toPublicUser(fullUser); // ✅ OK
```

### 3. Visibility Default

```typescript
// Always use DEFAULT_VISIBILITY when creating new documents
import { DEFAULT_VISIBILITY } from '../types/visibility';

const newDesign = await TalismanDesign.create({
  userId: req.userId,
  name: "My Talisman",
  kind: "sigil",
  visibility: DEFAULT_VISIBILITY, // 'private' - owner only
});
```

### 4. Type Guards for Union Types

```typescript
function handleUser(user: FullUser | PublicUser) {
  // Wrong - might not have email
  // console.log(user.email);

  // Right - check first
  if (isFullUser(user)) {
    console.log(user.email); // ✅ Safe
  }
}
```

---

## Related Documentation

- **API Reference:** `docs/API.md`
- **Architecture:** `docs/ARCHITECTURE.md`
- **Phase 51 Guide:** `docs/PHASE-51-IMPLEMENTATION-GUIDE.md`
- **Quick Reference:** `docs/QW-QUICK-REFERENCE.md`
