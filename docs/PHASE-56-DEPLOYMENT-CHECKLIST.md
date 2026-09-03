# Phase 56: Deployment Verification Checklist

## Pre-Deployment Review

### Database Compatibility
- [ ] MongoDB user schema includes `visibility` field
- [ ] Default visibility is `'private'` for backward compatibility
- [ ] Existing users without `visibility` field default to `'private'` on first read
- [ ] No migration script needed (schema-level default works)

### Backend Code Review
- [ ] `server/src/models/User.ts` has `visibility` field with enum validation
- [ ] `server/src/routes/users.ts` checks visibility before returning public profiles
- [ ] `server/src/routes/auth.ts` has PATCH `/api/auth/me/visibility` endpoint
- [ ] Visibility validation rejects invalid values (not private/unlisted/public)
- [ ] Only authenticated users can update visibility
- [ ] Only owner can update their own visibility
- [ ] Private profiles return 403 (not 404) to non-owners

### Frontend Code Review
- [ ] `client/src/components/ProfilePage.tsx` exists and handles all states
- [ ] `client/src/components/PractitionerCard.tsx` exists and is reusable
- [ ] `client/src/App.tsx` has route for `/u/:username`
- [ ] `client/src/context/AuthContext.tsx` has `visibility` field and `refetchUser()` method
- [ ] `client/src/components/AuthForms.tsx` has visibility toggle in settings
- [ ] No console errors when rendering profile page
- [ ] TypeScript compilation passes without errors

### Security Review
- [ ] No email in public profile responses
- [ ] No natal (birth) data in public profile responses
- [ ] No location coordinates in public profile responses
- [ ] No lastSeenAt exact timestamp in public profile responses
- [ ] `toPublicUser()` serializer is called on all public profile endpoints
- [ ] `isSafePublic()` validation passes on all public responses
- [ ] Only owner can update visibility (PATCH requires auth + owner check)

---

## Build & Test

### TypeScript Compilation
```bash
# Server
cd server && npx tsc --noEmit
# Result: ✅ No errors

# Client
cd client && npx tsc --noEmit
# Result: ✅ No errors
```

- [ ] Server TypeScript compiles without errors
- [ ] Client TypeScript compiles without errors

### Unit Tests
```bash
# Profile visibility tests
npm test -- profileVisibility.test.ts

# User serializer tests
npm test -- publicEndpoints.integration.test.ts
```

- [ ] Profile visibility unit tests pass
- [ ] User serializer tests pass (toPublicUser, isSafePublic)
- [ ] No test regressions

### Component Tests
```bash
# Client component tests
npm test -- ProfilePage.test.tsx PractitionerCard.test.tsx
```

- [ ] ProfilePage tests pass (public, unlisted, private, owner views)
- [ ] PractitionerCard tests pass (rendering, interaction, edge cases)

### Regression Testing
```bash
# Full test suite
npm test
```

- [ ] All existing tests still pass
- [ ] No auth flow breakage
- [ ] No journal/design-sharing breakage
- [ ] User model tests pass

---

## Backward Compatibility

### Existing User Data
- [ ] Existing users without `visibility` field still work
- [ ] First API call adds default `visibility: 'private'`
- [ ] No migration job required
- [ ] No downtime needed

### Existing Public Endpoints
- [ ] `GET /api/auth/me` still returns FullUser (unchanged)
- [ ] `GET /api/users/:id` (private endpoint) still works
- [ ] `GET /api/designs/:id` (shareable models) visibility still works

### Existing Frontend
- [ ] Login flow unchanged
- [ ] Register flow unchanged
- [ ] Profile settings page still works
- [ ] No existing routes broken

---

## Deployment Steps

### 1. Build Production Artifacts
```bash
# Build server
cd server && npm run build
# Output: server/dist/

# Build client
cd client && npm run build
# Output: client/dist/
```

- [ ] Server builds successfully
- [ ] Client builds successfully
- [ ] No build warnings

### 2. Docker Image Build
```bash
# Build Docker image
docker build -t ananael:phase-56 .

# Tag for registry
docker tag ananael:phase-56 registry.example.com/ananael:phase-56
```

- [ ] Docker image builds successfully
- [ ] Image size is reasonable (<500MB)
- [ ] No build warnings

### 3. Staging Deployment
```bash
# Deploy to staging
docker-compose -f docker-compose.staging.yml up -d

# Verify health
curl http://staging.example.com/api/auth/user-count
# Expected: {"count": N, "online": M}
```

- [ ] Service starts without errors
- [ ] API responds to basic requests
- [ ] No error logs on startup

### 4. Smoke Test on Staging
1. Create test user: `staging_test_public`
   - Set visibility to `public`
   - Verify `/u/staging_test_public` loads

2. Create test user: `staging_test_private`
   - Set visibility to `private` (default)
   - Verify `/u/staging_test_private` returns 403

3. Test visibility toggle
   - Login as test user
   - Toggle visibility multiple times
   - Verify changes persist

- [ ] Public profile visible to guests
- [ ] Private profile hidden from guests
- [ ] Visibility toggle works
- [ ] No console errors

### 5. Production Deployment
```bash
# Deploy to production
docker-compose -f docker-compose.yml up -d

# Verify health
curl https://ananael.example.com/api/auth/user-count
```

- [ ] Service starts without errors
- [ ] API responds normally
- [ ] No error logs on startup

### 6. Post-Deployment Verification

#### API Endpoints
```bash
# Public profile (should work)
curl https://ananael.example.com/api/users/by-username/public_user/public
# Expected: 200 OK with PublicUser data

# Private profile (should be hidden)
curl https://ananael.example.com/api/users/by-username/private_user/public
# Expected: 403 Forbidden

# Visibility update (should require auth)
curl -X PATCH https://ananael.example.com/api/auth/me/visibility \
  -H "Content-Type: application/json" \
  -d '{"visibility": "public"}'
# Expected: 401 Unauthorized (no cookie)
```

- [ ] Public profile endpoint works
- [ ] Private profile endpoint returns 403
- [ ] Visibility PATCH requires authentication
- [ ] All visibility states (private/unlisted/public) work

#### User-Facing Testing
1. Login to production
2. Navigate to account settings
3. Find visibility toggle
4. Change from private → public
5. Verify can see own profile at `/u/username`
6. Incognito: Visit `/u/username` and confirm public profile visible
7. Change back to private
8. Incognito: Visit `/u/username` and confirm 403 message shows

- [ ] Visibility toggle appears in settings
- [ ] Toggle changes persist across sessions
- [ ] Public profiles accessible to guests
- [ ] Private profiles hidden from guests
- [ ] No JavaScript errors on profile page
- [ ] Page loads quickly (<2s)

#### PII Audit
1. View public profile page
2. Open browser DevTools → Network tab
3. Check all API responses
4. Search response bodies for: email, natal, location, birthDate, coordinates

- [ ] No email in responses
- [ ] No natal data in responses
- [ ] No location in responses
- [ ] No sensitive fields leaked

---

## Monitoring & Alerts

### Logs to Monitor
- [ ] No increased error rate in server logs
- [ ] No "visibility" validation errors
- [ ] No "toPublicUser" conversion failures
- [ ] No 403/404 flood (would indicate misconfiguration)

### Metrics to Track
- [ ] API response time for public profiles (should be <100ms)
- [ ] Database query count (visibility index helping?)
- [ ] User engagement with profiles (new feature usage)

### Alerts to Set Up
- [ ] Alert if error rate > 0.1% (600+ requests/min baseline)
- [ ] Alert if public profile response time > 500ms
- [ ] Alert if PII fields appear in logs/responses

---

## Rollback Plan

If critical issues occur:

### Quick Rollback (< 5 min)
```bash
# Revert to previous Docker image
docker-compose down
docker-compose -f docker-compose.yml up -d (with old image tag)

# Verify health
curl https://ananael.example.com/api/auth/user-count
```

**Rollback Triggers:**
- [ ] API returns PII in public profiles
- [ ] Users cannot log in
- [ ] Visibility toggle breaks authentication
- [ ] Server crashes on startup
- [ ] > 1% error rate for 5 minutes

### Data Considerations
- [ ] No new migrations, so no data needs rolling back
- [ ] User `visibility` field stays in MongoDB (safe)
- [ ] Existing users still have default behavior
- [ ] No schema rollback needed

### Communication
- [ ] Post-incident: document what went wrong
- [ ] Notify users if any downtime occurred
- [ ] Update deployment runbook with lessons learned

---

## Sign-Off

| Role | Name | Date | Sign-Off |
|------|------|------|----------|
| Development | | | ☐ Pass ☐ Fail |
| QA | | | ☐ Pass ☐ Fail |
| DevOps | | | ☐ Pass ☐ Fail |
| Product | | | ☐ Pass ☐ Fail |

---

## Post-Deployment

### Monitor for 24 Hours
- [ ] No increased error rates
- [ ] No PII leaks in production
- [ ] User feedback positive
- [ ] No rollback needed

### Collect Metrics
- [ ] Adoption rate (% of users with public profiles)
- [ ] Feature usage (profile views, visibility changes)
- [ ] API performance (response times, throughput)

### Document Lessons Learned
- [ ] What went well?
- [ ] What was challenging?
- [ ] What would we do differently next time?
