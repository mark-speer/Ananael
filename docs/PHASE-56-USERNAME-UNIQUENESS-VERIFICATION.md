# Phase 56: Username Uniqueness Verification

## Overview
Verification that username uniqueness constraint is properly enforced at the database level and throughout the application.

## Database Constraint Verification

### MongoDB Index Check

```bash
# Connect to MongoDB
mongo mongodb://localhost:27017/ananael

# List all indexes on users collection
db.users.getIndexes()

# Expected output should include:
# {
#   "key": { "username": 1 },
#   "name": "username_1",
#   "unique": true
# }
```

**Verification Checklist:**
- [ ] Username field has unique index
- [ ] Index type is ascending (1)
- [ ] Sparse option is false (applies to all documents)
- [ ] Index name is clearly identifiable

### Schema Verification

Check `server/src/models/User.ts`:

```typescript
username: {
  type: String,
  required: true,
  unique: true,          // ← Must be true
  lowercase: true,       // ← For case-insensitive matching
  trim: true,
  index: true,
  minlength: 3,
  maxlength: 40,
  match: /^[a-zA-Z0-9_]{3,40}$/,  // ← URL-safe format
}
```

- [ ] `unique: true` is set
- [ ] `lowercase: true` enforces case-insensitive matching
- [ ] `trim: true` removes whitespace
- [ ] `minlength: 3` prevents short names
- [ ] `maxlength: 40` prevents long names
- [ ] `match` regex enforces alphanumeric + underscore only

---

## Registration Flow Testing

### Test 1: First User Registration (Baseline)

**Setup:**
- Fresh test database
- No users exist

**Test:**
```bash
POST /api/auth/register
{
  "username": "test_user_1",
  "email": "test1@example.com",
  "password": "securepass123"
}
```

**Expected:**
- Status: 201 Created
- User created successfully
- Username stored in lowercase

**Verification:**
- [ ] User created with `username: "test_user_1"`
- [ ] Username stored in database
- [ ] Registration succeeds

---

### Test 2: Duplicate Username (Exact Match)

**Setup:**
- User "test_user_1" already exists

**Test:**
```bash
POST /api/auth/register
{
  "username": "test_user_1",
  "email": "test2@example.com",
  "password": "securepass123"
}
```

**Expected:**
- Status: 409 Conflict
- Error message: "Username already taken" or "E11000 duplicate key error"
- No new user created

**Verification:**
- [ ] Duplicate username rejected
- [ ] 409 status code returned
- [ ] Clear error message provided
- [ ] No duplicate user in database

---

### Test 3: Case-Insensitive Duplicate

**Setup:**
- User "test_user_2" already exists (stored as lowercase)

**Test:**
```bash
POST /api/auth/register
{
  "username": "TEST_USER_2",
  "email": "test3@example.com",
  "password": "securepass123"
}
```

**Expected:**
- Status: 409 Conflict
- Error message indicates duplicate
- Enforces case-insensitive uniqueness

**Verification:**
- [ ] Uppercase variant rejected
- [ ] 409 status code returned
- [ ] Case-insensitive matching works
- [ ] No mixed-case duplicate

---

### Test 4: Similar But Different Usernames

**Setup:**
- User "alice_99" exists

**Tests:**
```bash
# Slightly different
POST /api/auth/register
{
  "username": "alice_98",  # Different ending
  "email": "test4@example.com",
  "password": "securepass123"
}
# Expected: 201 Created (unique)

POST /api/auth/register
{
  "username": "alice99",   # No underscore
  "email": "test5@example.com",
  "password": "securepass123"
}
# Expected: 201 Created (unique - different format)

POST /api/auth/register
{
  "username": "alice_99_alt",  # Suffix added
  "email": "test6@example.com",
  "password": "securepass123"
}
# Expected: 201 Created (unique)
```

**Verification:**
- [ ] alice_98 created (different number)
- [ ] alice99 created (different format, no underscore)
- [ ] alice_99_alt created (with suffix)
- [ ] Similar names allowed if genuinely different

---

### Test 5: Whitespace Handling

**Test:**
```bash
POST /api/auth/register
{
  "username": "  alice_100  ",  # Leading/trailing spaces
  "email": "test7@example.com",
  "password": "securepass123"
}
# Expected: 201 Created with username "alice_100" (trimmed)
```

**Verification:**
- [ ] Leading/trailing spaces trimmed
- [ ] Username stored without spaces
- [ ] Multiple whitespace collapsed

---

### Test 6: Invalid Character Rejection

**Tests:**
```bash
POST /api/auth/register
{
  "username": "alice@99",  # @ not allowed
  "email": "test8@example.com",
  "password": "securepass123"
}
# Expected: 400 Bad Request - invalid format

POST /api/auth/register
{
  "username": "alice 99",  # Space in middle
  "email": "test9@example.com",
  "password": "securepass123"
}
# Expected: 400 Bad Request - invalid format

POST /api/auth/register
{
  "username": "alice-99",  # Hyphen not allowed
  "email": "test10@example.com",
  "password": "securepass123"
}
# Expected: 400 Bad Request - invalid format
```

**Verification:**
- [ ] @ symbol rejected
- [ ] Spaces rejected
- [ ] Hyphens rejected
- [ ] Only alphanumeric + underscore accepted

---

## Profile URL Testing

### Test 7: Profile URL Uniqueness

**Setup:**
- User "alice_99" exists with `visibility: "public"`
- User "ALICE_99" attempted registration (should fail)

**Test:**
```bash
# Guest accessing profile
GET /api/users/by-username/alice_99/public
# Expected: 200 OK (user found)

GET /api/users/by-username/ALICE_99/public
# Expected: 200 OK (case-insensitive lookup finds same user)

GET /api/users/by-username/Alice_99/public
# Expected: 200 OK (case-insensitive lookup finds same user)
```

**Frontend URL Routing:**
```bash
# All should load the same profile page
/u/alice_99
/u/ALICE_99
/u/Alice_99
/u/ALIce_99

# Expected: All resolve to same user profile
```

**Verification:**
- [ ] Profile accessible by exact username
- [ ] Profile accessible by uppercase variant
- [ ] Profile accessible by lowercase variant
- [ ] All variants return same profile data
- [ ] URL encoding works correctly

---

## Concurrent Registration Testing

### Test 8: Race Condition Prevention

**Setup:**
- Fresh test database
- Prepare two simultaneous registration requests

**Test:**
```bash
# Simulate two concurrent registrations with same username
Parallel request 1:
  POST /api/auth/register
  { "username": "race_test", ... }

Parallel request 2:
  POST /api/auth/register
  { "username": "race_test", ... }

# Expected: One succeeds (201), one fails (409)
# NOT both succeed
```

**Verification:**
- [ ] Only one registration succeeds
- [ ] Duplicate rejected even under concurrency
- [ ] No race condition window
- [ ] Database enforces constraint

---

## Update/Rename Testing

### Test 9: Username Cannot Be Changed

**Assumption:** Username is immutable (no PATCH endpoint exists)

**Test:**
```bash
# Attempt to change username (should 404 or be unsupported)
PATCH /api/auth/me
{ "username": "new_username" }
# Expected: 400 Bad Request or field ignored
```

**Verification:**
- [ ] No endpoint to change username
- [ ] Attempts to change username rejected
- [ ] User.username remains immutable

---

## Import/Migration Testing

### Test 10: Bulk User Import

If migrating users from legacy system:

**Test:**
```bash
# Import 100 test users from CSV
# File: test_users.csv
# Username,Email
# alice_1,alice1@example.com
# bob_1,bob1@example.com
# charlie_1,charlie1@example.com
# ...

# Run import script
npm run migrate:users test_users.csv

# Check results
db.users.find().count()  # Should be 100
db.users.find({ username: "alice_1" }).count()  # Should be 1
```

**Verification:**
- [ ] All unique usernames imported
- [ ] No duplicates created
- [ ] Error on duplicate username
- [ ] Import logs successful/failed count

---

## Database Query Verification

### Test 11: Query Performance with Index

```bash
# MongoDB shell
mongo mongodb://localhost:27017/ananael

# Check query plan
db.users.find({ username: "alice_99" }).explain("executionStats")

# Expected:
# - executionStages.stage: "COLLSCAN" should NOT appear
# - executionStages.stage: "IXSCAN" should appear (index scan)
# - executionStats.executionStages.inputStage.stage: "IXSCAN"
```

**Verification:**
- [ ] Index is used (not collection scan)
- [ ] Query is efficient (< 1ms for exact match)
- [ ] No full table scans

---

## Case Sensitivity Testing

### Test 12: Username Lookup Consistency

**Setup:**
- User "Sarah_88" registered and stored as lowercase

**Tests:**
```bash
# All these should return the same user

GET /api/users/by-username/sarah_88/public      # lowercase
GET /api/users/by-username/SARAH_88/public      # uppercase
GET /api/users/by-username/Sarah_88/public      # mixed case
GET /api/users/by-username/SaRaH_88/public      # random case

# All expected to return 200 OK with same user data
```

**Database verification:**
```bash
db.users.findOne({ username: "sarah_88" })      # exact match
db.users.findOne({ username: /^sarah_88$/i })  # case-insensitive regex
# Both should return same document
```

**Verification:**
- [ ] API lookup is case-insensitive
- [ ] Database stored as lowercase
- [ ] Regex queries use case-insensitive flag
- [ ] URL routes case-insensitive

---

## Error Message Verification

### Test 13: Clear Duplicate Error

**Test:**
```bash
POST /api/auth/register
{
  "username": "existing_user",
  "email": "new@example.com",
  "password": "securepass123"
}
```

**Expected Response:**
```json
{
  "error": "Username already taken",
  "code": "USERNAME_DUPLICATE"
}
```

OR

```json
{
  "error": "E11000 duplicate key error",
  "field": "username"
}
```

**Verification:**
- [ ] Error message is clear
- [ ] Mentions username specifically
- [ ] User understands they need to try different username
- [ ] No stack trace in production

---

## Verification Checklist

### Schema Level
- [ ] `username` field has `unique: true`
- [ ] `username` field has `lowercase: true`
- [ ] `username` field has proper regex validation
- [ ] `username` field has min/max length

### Registration Level
- [ ] Duplicates rejected with 409
- [ ] Case-insensitive matching enforced
- [ ] Error message is clear
- [ ] No race conditions

### Profile Access Level
- [ ] Profile URLs use username lookup
- [ ] Lookup is case-insensitive
- [ ] Only one profile per username
- [ ] No profile shadowing

### Database Level
- [ ] Unique index exists
- [ ] Index is used in queries
- [ ] Query performance good (< 1ms)
- [ ] Concurrent writes handled correctly

### Import/Migration Level
- [ ] Duplicate usernames rejected
- [ ] Bulk operations handle uniqueness
- [ ] Import logs clearly identify duplicates
- [ ] Partial import doesn't corrupt data

---

## Sign-Off

| Check | Result | Notes |
|-------|--------|-------|
| Schema unique constraint | ☐ PASS ☐ FAIL | |
| Registration duplicate rejection | ☐ PASS ☐ FAIL | |
| Case-insensitive enforcement | ☐ PASS ☐ FAIL | |
| Profile URL uniqueness | ☐ PASS ☐ FAIL | |
| Concurrent registration | ☐ PASS ☐ FAIL | |
| Query performance | ☐ PASS ☐ FAIL | |
| Error messages | ☐ PASS ☐ FAIL | |

**Overall Result:** ☐ PASS ☐ FAIL

**Tester:** ___________________________
**Date:** ___________________________
**Notes:**
