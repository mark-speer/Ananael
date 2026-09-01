# QW Handoff Checklist for Phase 51 Implementation Lead

**Date Created:** 2026-09-01  
**Prepared For:** Phase 51 implementation team  
**Status:** ✅ All Quick Wins (QW1–QW4) complete and documented

Before starting Phase 51 work, complete this checklist to ensure you understand the infrastructure and can proceed efficiently.

---

## Pre-Implementation Reading (1–2 hours)

### Documentation

- [ ] **Read:** `docs/PHASE-51-IMPLEMENTATION-GUIDE.md` (comprehensive step-by-step)
  - Understand P1–P5 breakdown
  - Know what needs to be implemented
  - Familiar with security checklist items

- [ ] **Read:** `docs/QW-QUICK-REFERENCE.md` (quick lookup)
  - Bookmark for fast reference
  - Know where key files are located
  - Know common import patterns

- [ ] **Read:** `docs/TYPES.md` (type reference)
  - Understand FullUser vs PublicUser
  - Know how to use serializers
  - Understand Visibility enum

- [ ] **Read:** `docs/MIGRATIONS.md` (database)
  - Understand what migration does
  - Know how to run it (dev/prod)
  - Know how to verify success

- [ ] **Skim:** `docs/API.md` (existing endpoints)
  - Already documented (QW4 complete)
  - Reference for auth patterns

---

## Understand the Quick Wins

### QW1: React Router Setup

- [ ] Navigate to `client/src/routes.tsx`
  - Verify routes defined (/, /s/:type/:id)
  - Understand route structure

- [ ] Navigate to `client/src/components/SharePage.tsx`
  - Understand component receives type and id
  - See placeholder implementation

- [ ] Navigate to `client/src/main.tsx`
  - Verify BrowserRouter wraps app
  - Check AuthProvider ordering

- [ ] Test locally:
  ```bash
  npm run dev:client
  curl -s http://localhost:5173/s/talisman/abc123
  # Should load SharePage (blank for now)
  ```

### QW2: JournalEntry Audit

- [ ] Read `docs/audits/JournalEntry-audit-report.md`
  - Understand PII risks identified
  - Know which fields need filtering for shared entries
  - See recommendations for Phase 51

- [ ] Navigate to `server/src/models/JournalEntry.ts`
  - Understand schema structure
  - See sky, entities, payload fields

- [ ] Note: JournalEntry will need visibility field in Phase 52+
  - Currently only 6 shareable models have it
  - Audit already prepared the analysis

### QW3: Visibility Enum + Indexes

- [ ] Navigate to `server/src/types/visibility.ts`
  - Verify Visibility enum exists
  - Understand DEFAULT_VISIBILITY = 'private'

- [ ] Check one model (e.g., `server/src/models/TalismanDesign.ts`)
  ```typescript
  // Should have:
  visibility: {
    type: String,
    enum: ['private', 'unlisted', 'public'],
    default: 'private',
    index: true,
  }
  ```

- [ ] Verify all 6 models have visibility:
  - [ ] TalismanDesign.ts
  - [ ] SolomonicCircle.ts
  - [ ] RitualLayout.ts
  - [ ] OpusVessel.ts
  - [ ] PracticeVessel.ts
  - [ ] TreeNote.ts

- [ ] Review migration script:
  ```bash
  cat server/scripts/migrations/add-visibility.ts
  ```

- [ ] Run migration locally (safe, idempotent):
  ```bash
  cd server && ts-node scripts/migrations/add-visibility.ts
  # Verify: Total Updated: N, Total Errors: 0
  ```

### QW4: PublicUser DTO

- [ ] Navigate to `server/src/types/User.ts`
  - Verify FullUser interface (has email, natal, location)
  - Verify PublicUser interface (no email, natal, location)
  - Verify type guards: isFullUser(), isPublicUser()

- [ ] Navigate to `server/src/lib/userSerializers.ts`
  - Understand toPublicUser() — converts FullUser → PublicUser
  - Understand toPublicUsers() — batch conversion
  - Understand isSafePublic() — runtime validation

- [ ] Check auth routes use serializers:
  ```bash
  grep -n "toPublicUser" server/src/routes/auth.ts
  # Should find usage
  ```

- [ ] Verify tests pass:
  ```bash
  cd server && npm run test -- --testNamePattern="PublicUser"
  # All tests should pass
  ```

---

## Hands-On Setup

### Local Development Environment

- [ ] Clone/pull latest code
  ```bash
  cd Ananael.worktrees/next-phase-implementation-plan
  git status  # Verify on correct branch
  ```

- [ ] Install and build
  ```bash
  npm install  # Root
  cd client && npm install && npm run build  # Optional
  cd ../server && npm install && npm run build
  ```

- [ ] Start local servers
  ```bash
  # Terminal 1: Server
  cd server && npm run dev  # Runs on :5000

  # Terminal 2: Client  
  cd client && npm run dev  # Runs on :5173
  ```

- [ ] Verify both running:
  ```bash
  curl -s http://localhost:5000/api/health | jq '.'
  curl -s http://localhost:5173/  # Should show client
  ```

### Database Setup

- [ ] MongoDB running
  ```bash
  docker ps | grep mongo
  # Should show mongo container
  ```

- [ ] Run migration
  ```bash
  cd server && ts-node scripts/migrations/add-visibility.ts
  ```

- [ ] Verify migration
  ```bash
  # Check MongoDB
  mongosh
  use ananael
  db.talismandesigns.findOne()
  # Should have visibility: 'private'
  ```

---

## Code Navigation Practice

### Exercise 1: Find Serializer Usage

**Task:** Locate where toPublicUser() is being used

```bash
grep -r "toPublicUser" server/src/

# Should find:
# - server/src/lib/userSerializers.ts (definition)
# - server/src/routes/auth.ts (usage in public endpoints)
# - server/src/routes/*.ts (usage in phase 51 public endpoints)
```

### Exercise 2: Add Visibility to a Component

**Task:** Update a component to understand visibility states

```bash
# Open: server/src/components/MyComponent.tsx (if exists)
# Or: server/src/models/YourModel.ts

# Verify:
# - import Visibility from '../types/visibility'
# - Check schema has visibility field
# - Check default: Visibility.PRIVATE
```

### Exercise 3: Test Public Endpoint

**Task:** Call a public endpoint and verify response

```bash
# With server running:

# 1. Create a design (requires auth)
curl -X POST http://localhost:5000/api/talisman \
  -H "Content-Type: application/json" \
  -b "auth=your_token" \
  -d '{"name":"Test","kind":"sigil","config":{}}'
# Get ID from response

# 2. Update visibility (requires auth)
curl -X PATCH http://localhost:5000/api/talisman/ID \
  -H "Content-Type: application/json" \
  -b "auth=your_token" \
  -d '{"visibility":"unlisted"}'

# 3. Access publicly (no auth)
curl -s http://localhost:5000/api/talisman/ID/public | jq '.'
# Should have creator field with PublicUser shape
```

---

## Architecture Understanding

### System Diagram

```
Browser
  ├─ /s/:type/:id (SharePage.tsx loads via React Router)
  │    └─ Calls GET /api/:model/:id/public
  │         ├─ No auth required
  │         ├─ Checks visibility (403 if private)
  │         └─ Returns design + creator (PublicUser)
  │
  └─ /api/auth/me (after login)
       └─ Returns FullUser (has email, natal, location)
```

### Permission Model

```
Owner (authenticated):
  ├─ Can view: own full design (all data)
  ├─ Can edit: own design
  ├─ Can publish: set visibility to unlisted/public
  └─ Can see: creator's public profile only

Guest (unauthenticated):
  ├─ Can view: public + unlisted designs via /public endpoint
  ├─ Cannot: edit or create without login
  └─ Sees: creator's public data only
```

### Data Flow

```
1. CREATE design
   POST /api/talisman { name, kind, config }
   → visibility defaults to 'private'
   → Only owner can view

2. PUBLISH design  
   PATCH /api/talisman/:id { visibility: 'unlisted' }
   → Owner publishes

3. SHARE design
   → Owner shares link: /s/talisman/:id
   → Guest visits link
   → SharePage calls GET /api/talisman/:id/public
   → Public endpoint returns design + creator

4. CREATOR ATTRIBUTION
   → Creator info added to response
   → Uses toPublicUser(creator) serializer
   → No PII leaked (email, natal, location stripped)
```

---

## Understanding Key Concepts

### Visibility Levels

- **private** (default)
  - Only owner sees
  - 403 error if accessed via /public endpoint
  - Use case: Personal designs, drafts

- **unlisted**
  - Anyone with link sees
  - Accessible via /public endpoint
  - Use case: Share with friends without public registry
  - Phase 51 scope

- **public**
  - Future: appears in directory
  - Accessible via /public endpoint
  - Use case: Featured designs, portfolio
  - Phase 52 scope

### User Types

- **FullUser** (internal)
  - Has: email, natal, location, lastSeenAt
  - Used: Auth endpoints only (/auth/me, login, register)
  - Risk: NEVER expose publicly

- **PublicUser** (safe)
  - Has: username, traditions, profileImageUrl, createdAt
  - Used: Share links, creator attribution, public profiles
  - Safe: Type-safe, serializer verified

### The Serializer Pattern

```
FullUser (database)
    ↓
    toPublicUser()    ← Explicit conversion
    ↓
PublicUser (safe)
    ↓
isSafePublic()        ← Optional runtime validation
    ↓
res.json(...)         ← Send to client
```

**Why it matters:** Prevents accidental PII leakage through explicit type safety

---

## Testing Verification

### Run Test Suite

```bash
cd server
npm run test

# Should see:
# - All tests pass
# - User type tests pass
# - Visibility tests pass
# - Serializer tests pass
```

### Specific Test Commands

```bash
# Type safety tests
npm run test -- --testPathPattern="User.test"

# Visibility tests
npm run test -- --testNamePattern="visibility"

# Serializer tests
npm run test -- --testNamePattern="toPublicUser"

# Integration tests (requires running server)
npm run test:integration
```

---

## Questions to Ask Before Starting

Before beginning Phase 51, you should be able to answer these:

### Architecture Questions

- [ ] Q: Why is visibility field required?
  - A: To control access (private/unlisted/public)

- [ ] Q: What happens if someone accesses a private design via /public?
  - A: Returns 403 Forbidden

- [ ] Q: Why use two user types (FullUser vs PublicUser)?
  - A: Type safety prevents PII leakage at compile time

- [ ] Q: Can the /public endpoint require authentication?
  - A: No — public endpoints must be guest-accessible

### Implementation Questions

- [ ] Q: Where does SharePage component live?
  - A: client/src/components/SharePage.tsx

- [ ] Q: Which models get public endpoints in Phase 51?
  - A: All 6 (talisman, solomonic, ritual, tree, opus, practice)

- [ ] Q: Do I need to modify JournalEntry for Phase 51?
  - A: No, only the 6 shareable models. JournalEntry is Phase 52.

- [ ] Q: When should the migration be run?
  - A: Before Phase 51 implementation (ideally right now)

### Testing Questions

- [ ] Q: How do I verify a public endpoint doesn't leak PII?
  - A: Call GET /api/:model/:id/public and check response has no email/natal/location

- [ ] Q: How do I test public endpoints without auth?
  - A: Use curl without -b auth cookie flag

---

## Permissions & Access

### What You'll Need Access To

- [ ] GitHub repo (read/write)
- [ ] MongoDB (read/write for dev)
- [ ] Local development environment
- [ ] CI/CD pipeline (if deploying)
- [ ] Portainer (if accessing production container)

### Escalation Path

If you need help:
1. Check docs/PHASE-51-IMPLEMENTATION-GUIDE.md
2. Check docs/QW-QUICK-REFERENCE.md
3. Review related source files (paths in Quick Ref)
4. Ask in #engineering channel
5. Escalate to architecture team if design questions

---

## Go-Live Checklist (After Implementation)

Once Phase 51 is complete, verify:

- [ ] All 6 public endpoints implemented and tested
- [ ] SharePage component fully functional
- [ ] No PII leaked (verified with isSafePublic())
- [ ] Visibility defaults to private (backward compatible)
- [ ] Guest access works (no auth required for /public)
- [ ] Error handling works (403 for private designs)
- [ ] Creator attribution shows correctly
- [ ] Tests pass (unit + integration)
- [ ] API documentation updated
- [ ] TypeScript compilation passes (no errors)

---

## Recommended Reading Order

**Day 1 (Understanding):**
1. PHASE-51-IMPLEMENTATION-GUIDE.md
2. QW-QUICK-REFERENCE.md
3. TYPES.md

**Day 2 (Setup):**
1. Clone repo and run setup
2. Run local servers
3. Run migration
4. Run tests

**Day 3 (Deep Dive):**
1. Review source code (files listed in Quick Ref)
2. Do "Code Navigation Practice" exercises
3. Ask clarifying questions

**Day 4 (Ready to Code):**
1. Start P1 of PHASE-51-IMPLEMENTATION-GUIDE.md
2. Reference docs as needed
3. Implement public endpoints

---

## Success Criteria

You're ready to start Phase 51 when:

- ✅ You understand why visibility field is needed
- ✅ You know which 6 models need public endpoints
- ✅ You can explain FullUser vs PublicUser
- ✅ You've run migration successfully
- ✅ You've called a public endpoint and seen PublicUser in response
- ✅ You can navigate to key source files without help
- ✅ You understand the SharePage component's role
- ✅ You know how to test for PII leakage
- ✅ You have questions queued up (or answered)

---

## Quick Links

| Document | Purpose |
|----------|---------|
| `docs/PHASE-51-IMPLEMENTATION-GUIDE.md` | Step-by-step implementation |
| `docs/TYPES.md` | Type reference and usage |
| `docs/QW-QUICK-REFERENCE.md` | Fast lookup (bookmark this) |
| `docs/MIGRATIONS.md` | Database setup |
| `docs/API.md` | API reference (existing) |
| `docs/ARCHITECTURE.md` | System architecture |

---

## Contact & Support

- **Questions about QWs:** Refer to docs first, then ask in #engineering
- **Design decisions:** Escalate to @architecture-team
- **Blocked on setup:** Contact @devops or #infrastructure
- **Found a bug in QW code:** Report with:
  - Exact file path
  - What you expected
  - What actually happened
  - Steps to reproduce

---

## Sign-Off

**Implementation Lead:** _____________________________ Date: _______

**Reviewed By:** _____________________________ Date: _______

All items above are complete and Phase 51 team is ready to proceed.

---

**Last Updated:** 2026-09-01  
**QW Status:** ✅ QW1–QW4 Complete  
**Next Phase:** 🚀 Phase 51 Ready to Launch
