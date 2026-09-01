# Phase 51 Implementation Guide

**Status:** Ready to start  
**Prerequisites:** All Quick Wins (QW1–QW4) completed  

This guide provides step-by-step instructions for Phase 51: **Shareable Designs**. All infrastructure is in place.

---

## Prerequisites Checklist

Before starting Phase 51 work, verify all QWs are complete:

- ✅ **QW1** — React Router setup (routes.tsx, SharePage.tsx)
- ✅ **QW2** — JournalEntry audit (migration planning complete)
- ✅ **QW3** — Visibility enum + indexes (6 shareable models updated)
- ✅ **QW4** — PublicUser DTO (serializers tested)

**Verify locally:**
```bash
# 1. Check React Router works
npm run dev:client   # Should see SharePage load at /s/talisman/123

# 2. Check visibility field exists
cd server && npm run test   # Should pass User and Visibility tests

# 3. Check serializer works
node -e "import { toPublicUser } from './src/lib/userSerializers'; console.log(toPublicUser({username:'test', _id:'123', createdAt:new Date()}))"
```

---

## Phase 51 Scope: Shareable Designs

### Overview

Enable creators to share their designs via unlisted links. Core products:
- Talisman designs (kamea, sigil, sutra)
- Solomonic circles (Goetia, Heptameron, generic)
- Ritual layouts (altar spaces)
- Tree of Life notes
- Opus vessels (Athanor)
- Practice vessels (Subtle Body, Shamanism)

### Architecture

```
Creator's Design (private)
           ↓
        [publish]
           ↓
   Design (unlisted) ← GET /api/{model}/:id/public?token=...
           ↓
   SharePage loads ← /s/{type}/{id}
           ↓
    View-only display
```

---

## P1: Add Visibility Endpoints

Extend existing routes to serve public reads without authentication.

### Step 1: Create Public GET Handler

**File:** `server/src/routes/talisman.ts` (example for all 6 models)

Add a public GET endpoint that:
1. Checks visibility field
2. Returns public data only
3. Works without authentication

**Pattern for each route file:**

```typescript
// ✅ Private endpoint (owner only, requires auth)
router.get('/:id', protect, async (req, res) => {
  const design = await TalismanDesign.findOne({
    _id: req.params.id,
    userId: req.userId,
  });
  if (!design) return res.status(404).json({ error: 'Not found' });
  res.json(design); // Owner sees full object
});

// ✅ PUBLIC endpoint (no auth required, respects visibility)
router.get('/:id/public', async (req, res) => {
  const design = await TalismanDesign.findById(req.params.id);
  if (!design) return res.status(404).json({ error: 'Not found' });
  
  // Check visibility
  if (design.visibility === 'private') {
    return res.status(403).json({ error: 'This design is private' });
  }
  
  // Load creator info
  const creator = await User.findById(design.userId);
  
  // Return public response
  res.json({
    ...design,
    creator: toPublicUser(creator), // Safe user data
  });
});
```

### Step 2: Implement for All 6 Models

Routes to update:
1. `server/src/routes/talisman.ts` → `GET /api/talisman/:id/public`
2. `server/src/routes/solomonic.ts` → `GET /api/solomonic/:id/public`
3. `server/src/routes/ritual.ts` → `GET /api/ritual/:id/public`
4. `server/src/routes/tree.ts` → `GET /api/tree/:id/public`
5. `server/src/routes/opus.ts` → `GET /api/opus/:id/public`
6. `server/src/routes/practice.ts` → `GET /api/practice/:id/public`

### Step 3: Security Checklist

- [ ] Auth NOT required for public endpoints
- [ ] Visibility field checked before returning
- [ ] Private documents return 403 (Forbidden)
- [ ] Creator info uses `toPublicUser()` serializer
- [ ] No email/natal/location leaked
- [ ] Returned JSON validated with `isSafePublic()`
- [ ] Tests verify 403 for private designs

### Step 4: Testing Checklist

```bash
# Unit test each public endpoint
npm run test -- --testNamePattern="public" --testPathPattern="talisman"

# Integration test (with real MongoDB)
curl -X GET http://localhost:5000/api/talisman/abc123/public

# Verify no PII leaked
curl -s http://localhost:5000/api/talisman/abc123/public | jq '.creator'
# Should have: username, createdAt, traditions, profileImageUrl
# Should NOT have: email, natal, location, lastSeenAt
```

---

## P2: Share Link Resolution

SharePage component loads the shared design and displays it.

### Step 1: Update SharePage Component

**File:** `client/src/components/SharePage.tsx`

```typescript
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function SharePage() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const [design, setDesign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDesign();
  }, [type, id]);

  async function loadDesign() {
    try {
      setLoading(true);
      // Map URL type to API endpoint
      const apiPath = mapTypeToApiPath(type);
      const response = await fetch(`/api${apiPath}/${id}/public`);
      
      if (!response.ok) {
        throw new Error(response.status === 403 ? 'Private' : 'Not found');
      }
      
      const data = await response.json();
      setDesign(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
      setDesign(null);
    } finally {
      setLoading(false);
    }
  }

  function mapTypeToApiPath(type: string): string {
    const mapping: Record<string, string> = {
      'talisman': '/talisman',
      'circle': '/solomonic',
      'ritual': '/ritual',
      'tree': '/tree',
      'opus': '/opus',
      'practice': '/practice',
    };
    return mapping[type] || '/unknown';
  }

  if (loading) {
    return <LoadingState type={type} id={id} />;
  }

  if (error) {
    return <ErrorState error={error} type={type} />;
  }

  if (!design) {
    return <NotFoundState type={type} id={id} />;
  }

  // Render the design based on type
  return <DesignViewer type={type} design={design} />;
}
```

### Step 2: Create Display Components

Build view-only renderers for each design type:
- `TalismanViewer.tsx` (kamea, sigil, sutra)
- `CircleViewer.tsx` (Solomonic)
- `RitualViewer.tsx` (altar layout)
- `TreeNoteViewer.tsx` (study note)
- `OpusViewer.tsx` (vessel)
- `PracticeViewer.tsx` (intention)

**Example: TalismanViewer**

```typescript
interface TalismanViewerProps {
  design: {
    name: string;
    kind: 'kamea' | 'sigil' | 'sutra';
    config: Record<string, unknown>;
    notes?: string;
    creator: PublicUser;
    createdAt: Date;
  };
}

export function TalismanViewer({ design }: TalismanViewerProps) {
  return (
    <div className="container mx-auto p-8">
      <header className="border-b border-ananael-gold/30 pb-8">
        <h1 className="text-4xl font-display text-ananael-gold">{design.name}</h1>
        <p className="text-ananael-gold/70 text-sm">
          By {design.creator.username} · Created {formatDate(design.createdAt)}
        </p>
      </header>

      <div className="my-8">
        {design.kind === 'kamea' && <KamearRenderer config={design.config} />}
        {design.kind === 'sigil' && <SigilRenderer config={design.config} />}
        {design.kind === 'sutra' && <SutraRenderer config={design.config} />}
      </div>

      {design.notes && (
        <section className="border-t border-ananael-gold/30 pt-8">
          <h2 className="text-xl text-ananael-gold mb-4">Notes</h2>
          <p className="text-ananael-text whitespace-pre-wrap">{design.notes}</p>
        </section>
      )}

      <footer className="mt-16 border-t border-ananael-gold/30 pt-8 text-center text-sm">
        <p className="text-ananael-gold/70">
          Created with <span className="text-ananael-gold">Ananael</span>
        </p>
      </footer>
    </div>
  );
}
```

### Step 3: Error Handling

```typescript
export function ErrorState({ error, type }: { error: string; type: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ananael-bg">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-display text-ananael-gold">
          {error === 'Private' ? 'This design is private' : 'Not found'}
        </h1>
        <p className="text-ananael-gold/70">
          {error === 'Private' 
            ? 'The creator has not shared this design.'
            : `We couldn't find that ${type}.`}
        </p>
        <a href="/" className="inline-block mt-8 px-6 py-2 bg-ananael-gold/20 hover:bg-ananael-gold/30 rounded">
          Back to Ananael
        </a>
      </div>
    </div>
  );
}
```

### Step 4: Testing

```bash
# 1. Create a design and get its ID
# (manually or via test script)

# 2. Set visibility to 'unlisted'
curl -X PATCH http://localhost:5000/api/talisman/abc123 \
  -H "Content-Type: application/json" \
  -b "auth=your_token" \
  -d '{"visibility":"unlisted"}'

# 3. Test cold load via share link
open http://localhost:5173/s/talisman/abc123
# Should load and display the talisman

# 4. Test 403 for private design
curl -X GET http://localhost:5000/api/talisman/xyz789/public
# Should return 403 if visibility is 'private'
```

---

## P3: Creator Attribution

Add creator info to all public responses.

### Step 1: Load Creator in All Public Endpoints

Already partially done in P1. Ensure all 6 route files do this:

```typescript
router.get('/:id/public', async (req, res) => {
  const design = await TalismanDesign.findById(req.params.id);
  if (!design) return res.status(404).json({ error: 'Not found' });
  if (design.visibility === 'private') return res.status(403).json({ error: 'Private' });

  // ✅ Load creator
  const creator = await User.findById(design.userId);
  
  res.json({
    ...design.toObject(),
    creator: toPublicUser(creator), // Safe public user data
  });
});
```

### Step 2: Display Creator in SharePage

Viewers should see who created the design:

```typescript
export function CreatorCard({ creator }: { creator: PublicUser }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-ananael-bg/50 rounded border border-ananael-gold/20">
      {creator.profileImageUrl && (
        <img 
          src={creator.profileImageUrl} 
          alt={creator.username}
          className="w-12 h-12 rounded-full"
        />
      )}
      <div>
        <p className="font-semibold text-ananael-gold">{creator.username}</p>
        {creator.traditions && (
          <p className="text-sm text-ananael-gold/70">
            {creator.traditions.join(' · ')}
          </p>
        )}
      </div>
    </div>
  );
}
```

### Step 3: Verify No PII Leaked

Test that creator object never includes email/natal/location:

```typescript
// Test: Ensure isSafePublic passes
const response = await fetch('/api/talisman/abc123/public');
const data = await response.json();
const creator = data.creator;

// These fields must NOT exist
console.assert(creator.email === undefined);
console.assert(creator.natal === undefined);
console.assert(creator.location === undefined);
console.assert(creator.lastSeenAt === undefined);
```

---

## P4: Unique, URL-Safe Usernames

Usernames should be:
- Unique (can be referenced in URLs)
- URL-safe (alphanumeric + underscore)
- Consistent (not changed without migration)

### Step 1: Add Unique Index to User Schema

**File:** `server/src/models/User.ts`

```typescript
const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,      // ✅ Add unique index
      trim: true,
      minlength: 3,
      maxlength: 40,
      // ✅ Add validation: alphanumeric + underscore only
      match: [/^[a-zA-Z0-9_]+$/, 'Username must be alphanumeric with underscores only'],
    },
    // ... rest of schema
  },
  { timestamps: true }
);
```

### Step 2: Update Register/Update Routes

**File:** `server/src/routes/auth.ts`

```typescript
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  
  // Validate username format
  if (!username || !/^[a-zA-Z0-9_]{3,40}$/.test(username)) {
    return res.status(400).json({
      error: 'Username must be 3-40 alphanumeric characters and underscores only',
    });
  }

  // Check uniqueness
  const existing = await User.findOne({ username: username.toLowerCase() });
  if (existing) {
    return res.status(409).json({ error: 'Username already taken' });
  }

  // Create user
  const user = new User({ username, email, password });
  await user.save();
  // ...
});
```

### Step 3: Testing

```bash
# Test valid usernames
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice_the_wise",
    "email": "alice@example.com",
    "password": "secure123"
  }'
# Should succeed

# Test invalid username (spaces)
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice the wise",
    "email": "bob@example.com",
    "password": "secure123"
  }'
# Should return 400

# Test duplicate
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice_the_wise",
    "email": "charlie@example.com",
    "password": "secure123"
  }'
# Should return 409 (Conflict)
```

---

## P5: Guest Access for Share Links

Core tools work without login. Shared designs should be viewable by guests.

### Step 1: Verify SharePage Works Without Auth

**File:** `client/src/components/SharePage.tsx`

```typescript
// ✅ Make API call without credentials
const response = await fetch(`/api${apiPath}/${id}/public`);
// Note: fetch() does NOT send cookies by default (no credentials: 'include')
```

### Step 2: Verify Public Endpoints Don't Require Auth

**All 6 route files** (talisman.ts, solomonic.ts, ritual.ts, tree.ts, opus.ts, practice.ts):

```typescript
// ❌ WRONG - requires auth
router.get('/:id/public', protect, async (req, res) => { /* ... */ });

// ✅ CORRECT - no protect middleware
router.get('/:id/public', async (req, res) => { /* ... */ });
```

### Step 3: Test Guest Access

```bash
# 1. Create and share a design
# (get design ID)

# 2. Set to unlisted (requires auth)
curl -X PATCH http://localhost:5000/api/talisman/abc123 \
  -H "Content-Type: application/json" \
  -b "auth=your_token" \
  -d '{"visibility":"unlisted"}'

# 3. Access publicly (no auth)
curl -X GET http://localhost:5000/api/talisman/abc123/public
# Should succeed without auth cookie

# 4. Load in browser as guest (logged out)
# Clear cookies, then visit http://localhost:5173/s/talisman/abc123
# Should load successfully
```

---

## Post-Implementation Verification

### Checklist

- [ ] All 6 `GET /:id/public` endpoints implemented
- [ ] Visibility validation in place (403 for private)
- [ ] Creator info loaded with `toPublicUser()` serializer
- [ ] SharePage component loads designs
- [ ] URL type mapping correct (talisman → /api/talisman, etc.)
- [ ] Username unique index in place
- [ ] Username validation (alphanumeric + underscore)
- [ ] Guest access works (no credentials required)
- [ ] All endpoints tested (unit + integration)
- [ ] No PII leaked (verified with `isSafePublic()`)
- [ ] Error handling for private/missing designs
- [ ] Mobile-responsive SharePage display

### Running Tests

```bash
# All tests
cd server && npm run test

# Specific test file
npm run test -- --testPathPattern="talisman"

# Integration test (requires running server)
npm run test:integration

# Check PII isolation
npm run test -- --testNamePattern="PII"
```

---

## Next Steps (Phase 52)

Phase 51 enables unlisted shares. Phase 52 adds:
- [ ] Public registry (list all public designs)
- [ ] Usernames as URLs (`/u/alice_the_wise`)
- [ ] User discovery
- [ ] Favorites / saves on shared designs

---

## Troubleshooting

### Share link returns 404

- Verify design exists: check MongoDB for the ID
- Verify visibility is not 'private': `db.talismandesigns.findOne({_id: ObjectId(...)})`
- Check API endpoint path matches type (talisman vs solomonic, etc.)

### Creator shows as undefined

- Verify `toPublicUser()` is imported and called
- Check User document exists for design.userId
- Verify creator object is included in response JSON

### Guest access returns 401

- Remove `protect` middleware from public endpoint
- Verify endpoint is `/:id/public` not `/:id`
- Check CORS headers allow unauthenticated requests

### PII leaked in response

- Use `toPublicUser(creator)` not raw user document
- Verify serializer doesn't include email/natal/location
- Add `isSafePublic()` check before returning

---

## Related Documentation

- **API Reference:** `docs/API.md`
- **Types Guide:** `docs/TYPES.md`
- **Quick Reference:** `docs/QW-QUICK-REFERENCE.md`
- **Architecture:** `docs/ARCHITECTURE.md`
