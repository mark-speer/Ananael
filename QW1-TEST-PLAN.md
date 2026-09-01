# QW1: React Router v6.4+ Upgrade - Test Plan

**Phase:** QW1 (Quick Win 1)  
**Component:** React Router v6.4+ Integration  
**Test Date:** To be executed after `npm install`  
**Environment:** Local development (http://localhost:5173)

---

## Pre-Test Checklist

- [ ] Node.js and npm installed
- [ ] `cd client && npm install` completed
- [ ] TypeScript compiler run (`npm run build` or `tsc --noEmit`)
- [ ] No build errors reported

---

## Test Cases

### TC-1: Application Starts Without Errors
**Objective:** Verify that the application starts with React Router in place

**Steps:**
1. Run `npm run dev`
2. Wait for Vite to complete build
3. Open http://localhost:5173 in browser

**Expected Result:**
- ✅ Page loads without errors
- ✅ No console errors or warnings
- ✅ Dashboard module visible
- ✅ Sidebar navigation visible

**Actual Result:** ______________________

---

### TC-2: Home Route "/" Works
**Objective:** Verify that the home route renders correctly

**Steps:**
1. Navigate to http://localhost:5173/
2. Verify page content loads

**Expected Result:**
- ✅ Home page loads
- ✅ Sidebar visible
- ✅ Dashboard module active
- ✅ No 404 errors

**Actual Result:** ______________________

---

### TC-3: Share Route "/s/:type/:id" Works - Cold Load
**Objective:** Verify that the share route can be accessed directly (cold-load)

**Steps:**
1. Open http://localhost:5173/s/talisman/test123 in new tab/window
2. Wait for page to load

**Expected Result:**
- ✅ SharePage component renders
- ✅ Displays "Loading talisman:test123…"
- ✅ Styled with Ananael theme (gold/dark)
- ✅ No 404 error

**Actual Result:** ______________________

---

### TC-4: Share Route with Different Types
**Objective:** Verify share route works with different resource types

**Test Cases:**
1. http://localhost:5173/s/circle/abc123
   - Expected: "Loading circle:abc123…" ✅

2. http://localhost:5173/s/ritual/ritual1
   - Expected: "Loading ritual:ritual1…" ✅

3. http://localhost:5173/s/opus/vessel1
   - Expected: "Loading opus:vessel1…" ✅

**Actual Result:** ______________________

---

### TC-5: State-Based Navigation Still Works
**Objective:** Verify that existing sidebar navigation still functions

**Steps:**
1. Click on "Divination" in sidebar
2. Verify Divination module loads
3. Click on "Tarot" tab (if available)
4. Click on another module (e.g., "Journal")
5. Verify module switches correctly

**Expected Result:**
- ✅ Sidebar clicks navigate to correct modules
- ✅ Module content changes accordingly
- ✅ State is preserved (e.g., selected tab remains)
- ✅ No console errors

**Actual Result:** ______________________

---

### TC-6: Deep-Linking with Query Params
**Objective:** Verify that deep-links via query parameters still work

**Steps:**
1. Navigate to http://localhost:5173/?divinationTab=tarot
2. Wait for page to load
3. Verify Divination module with tarot tab active

**Expected Result:**
- ✅ Divination module loads
- ✅ Tarot tab is selected
- ✅ No errors

**Actual Result:** ______________________

---

### TC-7: Browser Back/Forward Navigation
**Objective:** Verify that browser history navigation works

**Steps:**
1. Start at Dashboard
2. Click "Divination" module
3. Press browser back button
4. Verify Dashboard appears
5. Press forward button
6. Verify Divination appears

**Expected Result:**
- ✅ Back button works correctly
- ✅ Forward button works correctly
- ✅ Module state preserved during navigation

**Actual Result:** ______________________

---

### TC-8: Mobile Navigation Drawer
**Objective:** Verify that mobile drawer works with Router

**Steps:**
1. Resize browser to mobile width (< 768px)
2. Click hamburger menu button
3. Click on a module in drawer
4. Verify module loads and drawer closes

**Expected Result:**
- ✅ Drawer opens on button click
- ✅ Module selection in drawer works
- ✅ Drawer closes after selection
- ✅ Mobile navigation works smoothly

**Actual Result:** ______________________

---

### TC-9: TypeScript Compilation
**Objective:** Verify no TypeScript errors

**Steps:**
1. Run `npm run build` (includes `tsc --noEmit`)
2. Check for compilation errors
3. Verify build succeeds

**Expected Result:**
- ✅ No TypeScript errors
- ✅ Build completes successfully
- ✅ Output is production-ready

**Actual Result:** ______________________

---

### TC-10: Production Build
**Objective:** Verify that production build works

**Steps:**
1. Run `npm run build`
2. Check dist/ folder is created
3. Run `npm run preview`
4. Open preview URL
5. Test navigation

**Expected Result:**
- ✅ Build completes without errors
- ✅ dist/ folder contains built app
- ✅ Preview loads correctly
- ✅ Navigation works in preview

**Actual Result:** ______________________

---

### TC-11: No Regressions - Module Loading
**Objective:** Verify all modules still load and function

**Test Each Module:**
- [ ] Dashboard - Loads without error
- [ ] Divination (Tarot) - Loads without error
- [ ] Divination (I Ching) - Loads without error
- [ ] Journal - Loads without error
- [ ] Gematria - Loads without error
- [ ] Planetary - Loads without error
- [ ] Correspondences - Loads without error
- [ ] Atelier (Ritual) - Loads without error
- [ ] Atelier (Talisman) - Loads without error
- [ ] Tree of Life - Loads without error
- [ ] Enochian - Loads without error
- [ ] Liturgy - Loads without error
- [ ] Opus - Loads without error
- [ ] Subtle Body - Loads without error
- [ ] Shamanism - Loads without error
- [ ] Script Translator - Loads without error

**Actual Result:** ______________________

---

### TC-12: Console Errors Check
**Objective:** Verify no console errors or warnings

**Steps:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Navigate through app (modules, routes)
4. Check for any red errors or yellow warnings

**Expected Result:**
- ✅ No console errors (red)
- ✅ No warnings related to routing
- ✅ Only informational logs acceptable

**Actual Result:** ______________________

---

## Test Results Summary

| Test Case | Result | Notes |
|-----------|--------|-------|
| TC-1: App Starts | PASS / FAIL | |
| TC-2: Home Route | PASS / FAIL | |
| TC-3: Share Route Cold Load | PASS / FAIL | |
| TC-4: Share Types | PASS / FAIL | |
| TC-5: State Nav | PASS / FAIL | |
| TC-6: Deep-Linking | PASS / FAIL | |
| TC-7: History Nav | PASS / FAIL | |
| TC-8: Mobile Drawer | PASS / FAIL | |
| TC-9: TS Compilation | PASS / FAIL | |
| TC-10: Production Build | PASS / FAIL | |
| TC-11: Module Loading | PASS / FAIL | |
| TC-12: Console Errors | PASS / FAIL | |

---

## Overall Result

**Status:** ☐ PASSED / ☐ FAILED

**Issues Found:**
- [ ] No issues
- [ ] Minor issues (document below)
- [ ] Blocking issues (document below)

**Issue Details:**
```
(Add issue details here if needed)
```

---

## Sign-Off

**Tester Name:** _____________________  
**Date:** _____________________  
**Approved:** ☐ Yes ☐ No  

**Notes:**

---

## Rollback Decision

If tests fail, recommend:
- [ ] Fix issues and retest
- [ ] Rollback changes
- [ ] Escalate to Phase 2 for deeper investigation
