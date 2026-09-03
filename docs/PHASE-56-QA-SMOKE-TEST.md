# Phase 56: Practitioner Cards — QA Smoke Test

## Overview
Manual end-to-end smoke test for the profile visibility feature (Phase 56).

## Prerequisites
- Application running locally or deployed
- Test database with cleanup capability
- Two browser windows or incognito/private windows available
- Test user credentials

## Test Scenarios

### Scenario 1: Public Profile Discovery

#### Setup
1. Create a test user: `test_public_user`
2. Set visibility to **public**
3. Note: username, traditions (e.g., "Goetia, Kabbalah"), join date

#### Test Steps (Logged Out)
1. Open incognito/private window
2. Navigate to `/u/test_public_user`
3. **Verify:**
   - ✅ Profile loads successfully
   - ✅ Username displays as "test_public_user"
   - ✅ Traditions display correctly
   - ✅ Join date displays
   - ✅ No email visible
   - ✅ No birth data visible
   - ✅ No location visible

#### Test Steps (Logged In as Different User)
1. Login as different user (e.g., `test_observer`)
2. Navigate to `/u/test_public_user`
3. **Verify:**
   - ✅ Profile loads successfully
   - ✅ Same data as logged-out user
   - ✅ No "edit" or "settings" button visible (not the owner)

#### Test Steps (Owner)
1. Logout and login as `test_public_user`
2. Navigate to `/u/test_public_user`
3. **Verify:**
   - ✅ Profile loads
   - ✅ "Edit Profile" or settings button visible
   - ✅ Can see current visibility state (public)
   - ✅ Can toggle visibility

---

### Scenario 2: Unlisted Profile (Link Sharing)

#### Setup
1. Create a test user: `test_unlisted_user`
2. Set visibility to **unlisted**
3. Copy share link: `/u/test_unlisted_user`

#### Test Steps (Logged Out, with Link)
1. Open incognito window
2. Navigate to direct link `/u/test_unlisted_user`
3. **Verify:**
   - ✅ Profile loads successfully
   - ✅ Same data displays as public profile
   - ✅ No email, birth, location visible

#### Test Steps (Logged Out, Discovery)
1. Open incognito window
2. Navigate to `/` (home)
3. **Verify:**
   - ✅ No link to `test_unlisted_user` in any discovery surfaces
   - (Note: Phase 56 has no discovery UI yet; verify this doesn't break in Phase 57+)

---

### Scenario 3: Private Profile (Default)

#### Setup
1. Create a test user: `test_private_user`
2. Leave visibility as **private** (default)

#### Test Steps (Logged Out)
1. Open incognito window
2. Navigate to `/u/test_private_user`
3. **Verify:**
   - ✅ Page shows "This profile is private" or 403 message
   - ✅ No profile data leaks (username not shown, traditions not shown)
   - ✅ Clean error message (not a stack trace)

#### Test Steps (Logged In as Different User)
1. Login as different user
2. Navigate to `/u/test_private_user`
3. **Verify:**
   - ✅ Same 403 / private message as logged-out user
   - ✅ No data exposure

#### Test Steps (Owner, Logged In)
1. Logout and login as `test_private_user`
2. Navigate to `/u/test_private_user`
3. **Verify:**
   - ✅ Profile loads fully (not 403)
   - ✅ Owner can edit
   - ✅ Visibility toggle shows "private"

---

### Scenario 4: Visibility Toggle

#### Setup
1. Login as test user with private profile
2. Navigate to user menu / settings

#### Test Steps
1. Find visibility control in settings (radio buttons or dropdown)
2. Select "Public"
3. **Verify:**
   - ✅ Request completes without error
   - ✅ UI shows new state
   - ✅ No page reload required (optimistic update)
4. Open second incognito window
5. Navigate to `/u/[testuser]`
6. **Verify:**
   - ✅ Incognito session sees public profile now
   - ✅ Full data displays (username, traditions, join date)

#### Test Steps (Rollback)
1. Back in logged-in window, set visibility to "Unlisted"
2. **Verify:**
   - ✅ Incognito window navigating to same URL now sees link-only access (or via API, 200 OK)
3. Set visibility back to "Private"
4. **Verify:**
   - ✅ Incognito window navigating to `/u/[testuser]` sees 403 / private message

---

### Scenario 5: API Endpoints

#### Setup
- Terminal or API client (curl, Postman, etc.)
- Test user tokens for auth

#### Test Public Profile GET (No Auth)
```bash
curl https://localhost:5000/api/users/[userId]/public
# Expected: 200 with PublicUser data (username, traditions, createdAt)

curl https://localhost:5000/api/users/by-username/[username]/public
# Expected: 200 with PublicUser data

curl https://localhost:5000/api/users/[privatUserId]/public
# Expected: 403 Forbidden
```

**Verify:**
- ✅ Public/unlisted users return 200
- ✅ Private users return 403
- ✅ Response includes username, traditions, createdAt
- ✅ Response does NOT include email, natal, location

#### Test Visibility PATCH (Auth Required)
```bash
curl -X PATCH https://localhost:5000/api/auth/me/visibility \
  -H "Cookie: auth=[token]" \
  -H "Content-Type: application/json" \
  -d '{"visibility": "public"}'
# Expected: 200 with updated user

curl -X PATCH https://localhost:5000/api/auth/me/visibility \
  -H "Content-Type: application/json" \
  -d '{"visibility": "public"}'
# Expected: 401 Unauthorized (no auth)
```

**Verify:**
- ✅ Authenticated request succeeds
- ✅ Unauthenticated request returns 401
- ✅ Invalid visibility value returns 400
- ✅ User object returned includes new visibility field

---

### Scenario 6: Copy-to-Clipboard

#### Setup
1. Login as test user with public profile
2. Navigate to user menu / settings or profile page

#### Test Steps
1. Look for "Share my profile" link or button
2. Click copy-to-clipboard (if present)
3. **Verify:**
   - ✅ Clipboard contains correct `/u/username` URL
   - ✅ User sees confirmation ("Copied!" toast or similar)
4. Paste in browser address bar
5. **Verify:**
   - ✅ Navigates to own profile successfully

---

## Edge Cases

### Case 1: Case Sensitivity
1. Create user `TestUser`
2. Test URL variations:
   - `/u/testuser` — should match case-insensitively
   - `/u/TESTUSER` — should match
   - `/u/TestUser` — should match
3. **Verify:** All load the same profile

### Case 2: URL-Invalid Characters
1. Attempt to create user with special characters (should fail at registration, not here)
2. Verify usernames enforce 3-40 alphanumeric + underscore

### Case 3: Rapid Visibility Toggles
1. Rapidly toggle visibility (private → public → private → public)
2. Check API for race conditions
3. **Verify:**
   - ✅ Last toggle wins
   - ✅ No corrupted state

### Case 4: Concurrent Requests
1. Open two browser tabs as same user
2. In one tab, change visibility
3. In other tab, refresh profile page
4. **Verify:**
   - ✅ Visibility reflects new state
   - ✅ No stale data

---

## Rollback / Undo

If any test fails:

1. **Profile not loading:**
   - Check browser console for errors
   - Verify server is running and `/api/users/[id]/public` returns data
   - Check Network tab in DevTools for 404 vs 403 vs 500

2. **Visibility toggle broken:**
   - Check AuthContext in React DevTools
   - Verify PATCH `/api/auth/me/visibility` endpoint responds correctly
   - Check server logs for validation errors

3. **PII leakage:**
   - Verify `toPublicUser()` is called before sending response
   - Check `isSafePublic()` validation
   - Search response body for email, natal, location fields

---

## Completion Checklist

- [ ] Public profile visible to all users (logged out, different user, owner)
- [ ] Unlisted profile visible via direct link only
- [ ] Private profile hidden with proper 403 message
- [ ] Visibility toggle works and persists
- [ ] API endpoints enforce visibility correctly
- [ ] No PII leakage in any profile response
- [ ] Copy-to-clipboard works (if implemented)
- [ ] Case-insensitive username lookup works
- [ ] All three visibility states tested
- [ ] No console errors or warnings
- [ ] No TypeScript build errors
- [ ] All regression tests still pass

---

## Sign-Off

**Tester Name:** ___________________________

**Date:** ___________________________

**Result:** ☐ PASS ☐ FAIL

**Notes:**
