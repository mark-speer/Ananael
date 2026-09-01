# Quick Wins Quick Reference Guide

Fast lookup for Quick Wins (QW1–QW4) implementation files, imports, endpoints, and commands.

---

## At a Glance

| QW | Title | Status | Key Files | Purpose |
|-----|-------|--------|-----------|---------|
| **QW1** | React Router Setup | ✅ Done | routes.tsx, SharePage.tsx, main.tsx, App.tsx | URL routing for share links (/s/:type/:id) |
| **QW2** | JournalEntry Audit | ✅ Done | JournalEntry.ts, audit report | Schema validation, PII risk assessment |
| **QW3** | Visibility Enum + Indexes | ✅ Done | visibility.ts, 6 models, migration script | Privacy model for shareable artifacts |
| **QW4** | PublicUser DTO | ✅ Done | User.ts, userSerializers.ts, auth routes | Safe user data for public responses |

---

## QW1: React Router Setup

### Implementation Status

- ✅ React Router v6.4+ integrated
- ✅ Routes defined in `client/src/routes.tsx`
- ✅ SharePage component ready
- ✅ Main.tsx wrapped with BrowserRouter
- ✅ Share URLs working: `/s/:type/:id`

### Key Files

```
client/
  src/
    main.tsx                  # BrowserRouter wrapper
    App.tsx                   # Main app component (sidebar + module)
    routes.tsx                # Route definitions (/, /s/:type/:id)
    components/
      SharePage.tsx           # Render shared artifacts
```

### Usage

```typescript
// routes.tsx - define routes
import { routes } from './routes';

// App.tsx - use routes
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
const router = createBrowserRouter(routes);
<RouterProvider router={router} />;

// Navigate to share page
window.location.href = `/s/talisman/abc123def456`;
```

### Supported Share Types

```
/s/talisman/:id    → Talisman design (kamea, sigil, sutra)
/s/circle/:id      → Solomonic circle
/s/ritual/:id      → Ritual layout
/s/tree/:id        → Tree of Life note
/s/opus/:id        → Athanor vessel
/s/practice/:id    → Practice vessel
```

---

## QW2: JournalEntry Schema Audit

### Implementation Status

- ✅ Audit completed
- ✅ No blockers identified
- ✅ PII risks documented
- ✅ Recommendations for Phase 51 shared entries

### Audit Report

**File:** `docs/audits/JournalEntry-audit-report.md`

### Key Findings

| Risk | Issue | Mitigation |
|------|-------|-----------|
| 🔴 HIGH | `sky.lat/lon` exposes location | Filter when sharing |
| 🟠 MEDIUM | `body/title` contains PII | Respect visibility field |
| 🟡 LOW | Tags, entities generally safe | Safe to share |

### For Phase 51

When sharing journal entries:
1. Check `visibility` field (not yet added to JournalEntry)
2. Strip `sky.lat/lon` for guests
3. Don't share entries without owner consent

### Related Models

```typescript
// Entry types that may be shared later
entryType: 'ritual' | 'dream' | 'divination' | 'mood' | 'working' | 'note'

// Fields with PII risk
sky: { lat, lon, ... }     // Location data
body: string               // Personal thoughts
title: string              // May contain names/details
```

---

## QW3: Visibility Enum + Indexes

### Implementation Status

- ✅ Visibility enum defined
- ✅ 6 models updated with visibility field
- ✅ Indexes created on visibility field
- ✅ Migration script ready

### Key Files

```
server/src/
  types/
    visibility.ts            # Visibility enum and constants
  models/
    TalismanDesign.ts        # visibility: VisibilityString
    SolomonicCircle.ts       # visibility: VisibilityString
    RitualLayout.ts          # visibility: VisibilityString
    OpusVessel.ts            # visibility: VisibilityString
    PracticeVessel.ts        # visibility: VisibilityString
    TreeNote.ts              # visibility: VisibilityString
  scripts/migrations/
    add-visibility.ts        # Migration to add field
```

### Visibility Values

```typescript
enum Visibility {
  PRIVATE = 'private',      // Owner only (default)
  UNLISTED = 'unlisted',    // Link-shareable
  PUBLIC = 'public',        // Future: in public registry
}

const DEFAULT_VISIBILITY = 'private';
```

### Import & Usage

```typescript
import { Visibility, DEFAULT_VISIBILITY, VisibilityString } from '../types/visibility';

// Create with default
const design = await TalismanDesign.create({
  userId: creatorId,
  name: "My Design",
  visibility: DEFAULT_VISIBILITY,  // 'private'
});

// Update visibility
await TalismanDesign.updateOne(
  { _id: designId, userId: userId },
  { visibility: Visibility.UNLISTED }
);

// Query by visibility
const publicDesigns = await TalismanDesign.find({ visibility: Visibility.PUBLIC });
```

### Migration Command

```bash
cd server
ts-node scripts/migrations/add-visibility.ts
```

**Expected output:**
```
[Migration] talismandesigns: Updated 5, Skipped 0
[Migration] solomioniccircles: Updated 3, Skipped 0
...
[Migration] Total Updated: 15
[Migration] ✓ Migration completed successfully
```

### Indexes

All 6 models have single-field index on visibility:

```typescript
visibility: {
  type: String,
  enum: ['private', 'unlisted', 'public'],
  default: 'private',
  index: true,  // ✅ Indexed for fast queries
}
```

**Query performance:**
- `Model.find({ visibility: 'public' })` ← Fast (indexed)
- `Model.find({ userId, visibility })` ← Uses userId index, then filters

---

## QW4: PublicUser DTO

### Implementation Status

- ✅ FullUser interface defined
- ✅ PublicUser interface defined
- ✅ Type guards created
- ✅ Serializers implemented and tested
- ✅ Auth routes updated to use serializers

### Key Files

```
server/src/
  types/
    User.ts                  # FullUser, PublicUser interfaces + type guards
  lib/
    userSerializers.ts       # toPublicUser(), toPublicUsers(), isSafePublic()
  routes/
    auth.ts                  # Login/register return FullUser, public endpoints return PublicUser
```

### Type Definitions

```typescript
// FullUser - INTERNAL (login, /api/auth/me)
interface FullUser {
  _id: string;
  email: string;             // 🔴 NEVER public
  username: string;
  natal?: { ... };           // 🔴 NEVER public
  location?: { ... };        // 🔴 NEVER public
  lastSeenAt?: Date | null;  // 🔴 NEVER public
  createdAt: Date;
  updatedAt: Date;
}

// PublicUser - SAFE (share links, creator attribution)
interface PublicUser {
  _id: string;
  username: string;
  traditions?: string[];     // ✅ Safe
  profileImageUrl?: string;  // ✅ Safe
  createdAt: Date;
}
```

### Serializer Functions

```typescript
import { toPublicUser, toPublicUsers, isSafePublic } from '../lib/userSerializers';

// Convert single user
const user = await User.findById(userId);
const publicUser = toPublicUser(user);
res.json(publicUser);

// Convert array
const users = await User.find().limit(10);
const publicUsers = toPublicUsers(users);
res.json(publicUsers);

// Validate before sending
if (!isSafePublic(publicUser)) {
  throw new Error('PII leakage detected!');
}
```

### Type Guards

```typescript
import { isFullUser, isPublicUser } from '../types/User';

function handleUser(user: FullUser | PublicUser) {
  if (isFullUser(user)) {
    console.log(user.email); // ✅ Available
  } else if (isPublicUser(user)) {
    console.log(user.username); // ✅ Available
    // console.log(user.email); // ❌ Not available
  }
}
```

### Auth Route Examples

```typescript
// Login - returns FullUser
POST /api/auth/login
→ 200 { user: FullUser }  // Has email, natal, location

// Register - returns FullUser
POST /api/auth/register
→ 201 { user: FullUser }  // Has email, natal, location

// Get my profile - returns FullUser
GET /api/auth/me (auth required)
→ 200 { user: FullUser }  // Has email, natal, location

// Get public profile - returns PublicUser
GET /api/users/:id/public (no auth required)
→ 200 PublicUser          // NO email, natal, location
```

### PII Fields (Always Private)

Never expose these in PublicUser:
- `email` — Authentication credential
- `passwordHash` — Security credential
- `natal` — Birth data (sensitive esoteric info)
- `location` — Geographic coordinates
- `lastSeenAt` — Presence tracking

---

## Common Imports

### Client-Side

```typescript
// React Router
import { useParams, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

// Types
import type { FullUser, PublicUser } from '../types/User';
import { isFullUser, isPublicUser } from '../types/User';

// Visibility
import { Visibility, DEFAULT_VISIBILITY } from '../types/visibility';
```

### Server-Side

```typescript
// User types and serializers
import type { FullUser, PublicUser } from '../types/User';
import { toPublicUser, toPublicUsers, isSafePublic } from '../lib/userSerializers';
import { isFullUser, isPublicUser } from '../types/User';

// Visibility
import { Visibility, DEFAULT_VISIBILITY } from '../types/visibility';

// Models
import type { IUser } from '../models/User';
import type { ITalismanDesign } from '../models/TalismanDesign';
import type { ISolomonicCircle } from '../models/SolomonicCircle';

// Auth middleware
import { AuthRequest, protect } from '../middleware/auth';
```

---

## Common Endpoints (Phase 50)

### Authentication

```
POST /api/auth/register
  Body: { username, email, password }
  Response: 201 { user: FullUser }

POST /api/auth/login
  Body: { email, password }
  Response: 200 { user: FullUser }

POST /api/auth/logout
  Response: 204 No Content

GET /api/auth/me (auth required)
  Response: 200 { user: FullUser }

PUT /api/auth/location (auth required)
  Body: { lat, lon }
  Response: 200 { user: FullUser }

PUT /api/auth/natal (auth required)
  Body: { birthDate, birthTime?, birthPlace?, label? }
  Response: 200 { user: FullUser }

POST /api/auth/presence (auth required)
  Response: 204 No Content
```

### Public Profiles (Future: Phase 51+)

```
GET /api/users/:userId/public
  Response: 200 PublicUser
```

---

## Common Endpoints (Phase 51)

### Share Links (Public - No Auth Required)

```
GET /api/talisman/:id/public
  Response: 200 { ...design, creator: PublicUser }
  Error: 403 if visibility='private'

GET /api/solomonic/:id/public
  Response: 200 { ...circle, creator: PublicUser }
  Error: 403 if visibility='private'

GET /api/ritual/:id/public
  Response: 200 { ...layout, creator: PublicUser }
  Error: 403 if visibility='private'

GET /api/tree/:id/public
  Response: 200 { ...note, creator: PublicUser }
  Error: 403 if visibility='private'

GET /api/opus/:id/public
  Response: 200 { ...vessel, creator: PublicUser }
  Error: 403 if visibility='private'

GET /api/practice/:id/public
  Response: 200 { ...vessel, creator: PublicUser }
  Error: 403 if visibility='private'
```

### Update Visibility (Auth Required)

```
PATCH /api/talisman/:id
  Body: { visibility: 'private' | 'unlisted' | 'public' }
  Response: 200 { ...design }

# Same pattern for all 6 models
PATCH /api/solomonic/:id
PATCH /api/ritual/:id
PATCH /api/tree/:id
PATCH /api/opus/:id
PATCH /api/practice/:id
```

---

## Testing Commands

### Run All Tests

```bash
cd server
npm run test
```

### Run Specific Test

```bash
# Visibility tests
npm run test -- --testNamePattern="visibility"

# Serializer tests
npm run test -- --testNamePattern="PublicUser"

# User type tests
npm run test -- --testPathPattern="User"
```

### Manual Testing

```bash
# Start server
npm run dev:server  # Runs on localhost:5000

# Start client
npm run dev:client  # Runs on localhost:5173

# Test React Router
curl -s http://localhost:5173/s/talisman/abc123

# Test public endpoint
curl -s http://localhost:5000/api/talisman/abc123/public | jq '.'

# Test PII isolation
curl -s http://localhost:5000/api/talisman/abc123/public | jq '.creator'
# Should have: username, createdAt, traditions, profileImageUrl
# Should NOT have: email, natal, location
```

---

## File Structure Reference

### Client Structure

```
client/src/
  main.tsx                    # BrowserRouter entry
  App.tsx                     # Main app (modules)
  routes.tsx                  # Route definitions
  components/
    SharePage.tsx             # /s/:type/:id rendering
    ...other modules...
  context/
    AuthContext.tsx           # Auth state
  lib/
    api.ts                    # apiFetch helper
    ...other utilities...
  data/
    ...static corpora...
```

### Server Structure

```
server/src/
  types/
    User.ts                   # FullUser, PublicUser
    visibility.ts             # Visibility enum
  models/
    User.ts
    TalismanDesign.ts
    SolomonicCircle.ts
    RitualLayout.ts
    OpusVessel.ts
    PracticeVessel.ts
    TreeNote.ts
  routes/
    auth.ts                   # Auth endpoints
    talisman.ts               # Talisman routes (+ public)
    solomonic.ts              # Circle routes (+ public)
    ritual.ts                 # Ritual routes (+ public)
    tree.ts                   # Tree routes (+ public)
    opus.ts                   # Opus routes (+ public)
    practice.ts               # Practice routes (+ public)
  lib/
    userSerializers.ts        # toPublicUser, isSafePublic
    authCookie.ts
    presence.ts
  middleware/
    auth.ts                   # protect middleware
  scripts/
    migrations/
      add-visibility.ts       # Visibility migration
```

---

## Troubleshooting Quick Links

### SharePage not loading

1. Check URL: `/s/talisman/abc123def456` (correct ID?)
2. Check API endpoint: `GET /api/talisman/abc123def456/public`
3. Check visibility: Make sure it's not 'private'
4. Check browser console for errors

### PII leaked in response

1. Ensure using `toPublicUser(creator)` not raw user doc
2. Run `isSafePublic()` check before sending
3. Verify no email/natal/location fields in response JSON

### Visibility field missing

1. Run migration: `ts-node scripts/migrations/add-visibility.ts`
2. Verify MongoDB: `db.talismandesigns.findOne()` has visibility field
3. Check model file: visibility field in schema

### Type errors

1. Import types: `import type { PublicUser } from '../types/User'`
2. Use type guards: `if (isPublicUser(user)) { ... }`
3. Check TypeScript version: `npm list typescript`

---

## Documentation Index

- **Full API Reference:** `docs/API.md`
- **TypeScript Types Guide:** `docs/TYPES.md`
- **Phase 51 Implementation:** `docs/PHASE-51-IMPLEMENTATION-GUIDE.md`
- **Database Migrations:** `docs/MIGRATIONS.md`
- **Architecture Overview:** `docs/ARCHITECTURE.md`
- **Handoff Checklist:** `docs/QW-HANDOFF-CHECKLIST.md`
