# Phase 56: Regression Testing Guide

## Overview
Comprehensive regression testing to ensure Phase 56 changes don't break existing features.

## Test Environment Setup

```bash
# Install dependencies
npm install

# Run tests in watch mode
npm test

# Run specific test file
npm test -- filename.test.ts

# Run with coverage
npm test -- --coverage
```

---

## Core Auth Flow Regression Tests

### POST /api/auth/register
**What could break:** User model changes affecting registration

Test Cases:
```bash
# Valid registration
POST /api/auth/register
{
  "username": "new_user_99",
  "email": "new@example.com",
  "password": "securepass123"
}
# Expected: 201 Created, FullUser returned, visibility defaults to 'private'
```

- [ ] Registration succeeds
- [ ] New user has `visibility: 'private'` by default
- [ ] Email is unique (duplicates rejected)
- [ ] Username is unique
- [ ] Password is hashed (not returned)

### POST /api/auth/login
**What could break:** Auth middleware, token generation

Test Cases:
```bash
# Valid login
POST /api/auth/login
{
  "email": "test@example.com",
  "password": "securepass123"
}
# Expected: 200 OK, FullUser returned, auth cookie set
```

- [ ] Login succeeds
- [ ] FullUser returned (includes email, natal, location)
- [ ] HttpOnly cookie set
- [ ] Cookie includes valid JWT

### GET /api/auth/me
**What could break:** Auth middleware, serialization

Test Cases:
```bash
# Authenticated request
GET /api/auth/me
Cookie: auth=[token]
# Expected: 200 OK, FullUser with visibility field
```

- [ ] Returns FullUser (not PublicUser)
- [ ] Includes email
- [ ] Includes natal data
- [ ] Includes location
- [ ] Includes visibility field
- [ ] Requires authentication

### POST /api/auth/logout
**What could break:** Session cleanup

Test Cases:
```bash
# Logout
POST /api/auth/logout
Cookie: auth=[token]
# Expected: 204 No Content, cookie cleared
```

- [ ] Logout succeeds
- [ ] Auth cookie cleared
- [ ] Subsequent GET /api/auth/me returns 401

---

## User Profile Endpoints (Existing)

### GET /api/users/:userId (Private Endpoint)
**What could break:** Access control, serialization

Test Cases:
```bash
# Owner viewing own user
GET /api/users/[userId]
Cookie: auth=[ownerToken]
# Expected: 200 OK, FullUser

# Non-owner attempting access
GET /api/users/[userId]
Cookie: auth=[otherUserToken]
# Expected: 401 Unauthorized or 403 Forbidden
```

- [ ] Owner can fetch own user
- [ ] Non-owner cannot fetch other users
- [ ] Unauthenticated users cannot fetch
- [ ] Returns full user data

### PUT /api/auth/location
**What could break:** User model extension

Test Cases:
```bash
# Update location
PUT /api/auth/location
{
  "lat": 51.5074,
  "lon": -0.1278
}
# Expected: 200 OK, FullUser with updated location
```

- [ ] Location updates succeed
- [ ] Visibility field preserved
- [ ] Other user fields unaffected
- [ ] Validation enforces valid lat/lon

### PUT /api/auth/natal
**What could break:** User model extension

Test Cases:
```bash
# Update natal data
PUT /api/auth/natal
{
  "birthDate": "1990-05-15",
  "birthTime": "14:30",
  "birthPlace": { "lat": 40.7128, "lon": -74.006 }
}
# Expected: 200 OK, FullUser with updated natal
```

- [ ] Natal updates succeed
- [ ] Visibility field preserved
- [ ] Other user fields unaffected

### POST /api/auth/presence
**What could break:** User model fields (lastSeenAt)

Test Cases:
```bash
# Update presence
POST /api/auth/presence
# Expected: 204 No Content, lastSeenAt updated
```

- [ ] Presence updates succeed
- [ ] lastSeenAt changes
- [ ] Visibility field preserved

---

## Shareable Model Endpoints (Phase 51 Foundation)

### GET /api/designs/:id (Private)
**What could break:** Access control with new visibility field

Test Cases:
```bash
# Owner viewing own design
GET /api/designs/[designId]
Cookie: auth=[ownerToken]
# Expected: 200 OK, full design

# Non-owner attempting access
GET /api/designs/[designId]
Cookie: auth=[otherUserToken]
# Expected: 401 Unauthorized
```

- [ ] Owner can fetch own design
- [ ] Non-owner cannot fetch
- [ ] visibility field present on design
- [ ] Returns full design data

### GET /api/designs/:id/public
**What could break:** Visibility enforcement, serialization

Test Cases:
```bash
# Public design
GET /api/designs/[publicDesignId]/public
# Expected: 200 OK, public response

# Private design
GET /api/designs/[privateDesignId]/public
# Expected: 403 Forbidden
```

- [ ] Public designs return 200
- [ ] Unlisted designs return 200
- [ ] Private designs return 403
- [ ] Creator serialized as PublicUser
- [ ] No PII in creator data

### POST /api/designs/:id/visibility (New in Phase 51)
**What could break:** Visibility update logic

Test Cases:
```bash
# Update design visibility
PATCH /api/designs/[designId]/visibility
{ "visibility": "public" }
# Expected: 200 OK, updated design
```

- [ ] Owner can update visibility
- [ ] Non-owner cannot update
- [ ] Unauthenticated users cannot update
- [ ] Invalid values rejected

---

## Journal Endpoints

### POST /api/journal/entries
**What could break:** Journal entry schema, user linking

Test Cases:
```bash
# Create journal entry
POST /api/journal/entries
{
  "type": "tarot",
  "spreadType": "Celtic Cross",
  "cardsDrawn": [...],
  "userNotes": "...",
  "status": "complete"
}
# Expected: 201 Created, entry returned with userId
```

- [ ] Entries created successfully
- [ ] userId correctly linked
- [ ] User fields don't interfere
- [ ] All entry types work (tarot, iching, etc.)

### GET /api/journal/entries
**What could break:** Query logic with user model changes

Test Cases:
```bash
# List entries with filters
GET /api/journal/entries?type=tarot&from=2024-01-01
# Expected: 200 OK, filtered list
```

- [ ] Listing succeeds
- [ ] Filters work (type, status, date range)
- [ ] Only user's entries returned
- [ ] Pagination works

### PATCH /api/journal/entries/:id
**What could break:** Update validation, serialization

Test Cases:
```bash
# Update entry
PATCH /api/journal/entries/[entryId]
{ "status": "archived" }
# Expected: 200 OK, updated entry
```

- [ ] Updates succeed
- [ ] Only owner can update
- [ ] userId unchanged
- [ ] Other entry fields preserved

---

## TypeScript Type Safety

### Type Definitions
- [ ] `User` includes `visibility` field
- [ ] `FullUser` includes `visibility` field
- [ ] `PublicUser` does NOT have email, natal, location fields
- [ ] All API responses match declared types

### Serialization
```typescript
// Should compile
const publicUser: PublicUser = toPublicUser(fullUser);

// Should NOT compile
const publicUser: PublicUser = { ...fullUser };

// Should NOT compile (email not in PublicUser)
const email = publicUser.email;
```

- [ ] toPublicUser() function works correctly
- [ ] isSafePublic() validates responses
- [ ] TypeScript compilation has zero errors

---

## Data Integrity

### Backward Compatibility
- [ ] Existing users without `visibility` field still work
- [ ] Old designs/journals still accessible
- [ ] No data migration needed

### Field Validation
```bash
# Invalid visibility value should reject
PATCH /api/auth/me/visibility
{ "visibility": "invalid" }
# Expected: 400 Bad Request
```

- [ ] Only valid enum values accepted
- [ ] Database rejects invalid values
- [ ] Clear error messages on failure

---

## Performance Regression

### Query Performance
- [ ] `/api/auth/me` response time < 50ms
- [ ] Public profile GET < 100ms (no N+1 queries)
- [ ] Design list with visibility filter < 200ms
- [ ] Journal list with filters < 300ms

### Database Indexes
- [ ] `User.visibility` has index
- [ ] Query plans show index usage
- [ ] No full collection scans for visibility queries

---

## Security Regression

### PII Isolation
```bash
# Public endpoints should never leak:
GET /api/users/[userId]/public
# Must NOT contain: email, password, natal, location, lastSeenAt
```

- [ ] Email never in public responses
- [ ] Natal never in public responses
- [ ] Location never in public responses
- [ ] lastSeenAt never in public responses
- [ ] Password never in any response

### Access Control
```bash
# Should require auth
PATCH /api/auth/me/visibility
# Expected: 401 if no cookie

# Should enforce ownership
PATCH /api/users/[otherId]/visibility
# Expected: 403 (no such endpoint anyway)
```

- [ ] Auth-required endpoints enforce auth
- [ ] Ownership checks work
- [ ] No privilege escalation

### SQL/NoSQL Injection
- [ ] String inputs validated and escaped
- [ ] MongoDB queries use proper escaping
- [ ] No raw query concatenation

---

## Error Handling

### Error Codes
```bash
# Should return appropriate status codes
GET /api/users/[invalid]/public       # 400 Bad Request
GET /api/users/[notfound]/public      # 404 Not Found
GET /api/users/[private]/public       # 403 Forbidden
PATCH /api/auth/me/visibility         # 401 if no auth

# Invalid input
PATCH /api/auth/me/visibility
{ "visibility": "invalid" }
# Expected: 400 Bad Request with message
```

- [ ] 4xx errors return appropriate status
- [ ] Error messages are helpful but not leaky
- [ ] No stack traces in production

### Graceful Degradation
- [ ] Missing optional fields don't crash
- [ ] Null/undefined values handled
- [ ] Database connection errors return 500 with message

---

## Load Testing

### Concurrent Requests
```bash
# Simulate 100 concurrent profile views
ab -n 100 -c 10 http://localhost:5000/api/users/[userId]/public
```

- [ ] Handles concurrent visibility checks
- [ ] No race conditions in updates
- [ ] Response times stable under load
- [ ] No crashes on high concurrency

---

## Test Execution Checklist

### Unit Tests
```bash
npm test -- --testPathPattern="test.ts$"
```
- [ ] All tests pass
- [ ] No skipped tests
- [ ] Code coverage > 80%

### Integration Tests
```bash
npm test -- --testPathPattern="integration"
```
- [ ] All integration tests pass
- [ ] Database state clean between tests
- [ ] No flaky tests

### Full Suite
```bash
npm test
```
- [ ] All tests pass
- [ ] No regressions
- [ ] Build succeeds
- [ ] TypeScript compilation passes

---

## Sign-Off

| Test Category | Status | Notes |
|---------------|--------|-------|
| Auth Flow | ☐ PASS ☐ FAIL | |
| Profiles | ☐ PASS ☐ FAIL | |
| Designs/Artifacts | ☐ PASS ☐ FAIL | |
| Journal | ☐ PASS ☐ FAIL | |
| TypeScript | ☐ PASS ☐ FAIL | |
| Security | ☐ PASS ☐ FAIL | |
| Performance | ☐ PASS ☐ FAIL | |
| Load | ☐ PASS ☐ FAIL | |

**Overall Result:** ☐ PASS ☐ FAIL

**Tester:** ___________________________
**Date:** ___________________________
