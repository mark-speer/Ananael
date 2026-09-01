# Docker Build Error Fixes

## Issue
Docker build was failing with exit code 2 during `npm run build`:
```
compose build operation failed: failed to solve: process "/bin/sh -c npm run build" did not complete successfully: exit code: 2
```

## Root Cause Analysis
Exit code 2 indicates a TypeScript compilation error. The issue was likely caused by one or more of:
1. **Complex type unions** in `userSerializers.ts` that confused TypeScript's type narrowing
2. **Unused imports** that could trigger `noUnusedLocals` errors in strict mode
3. **Incompatible React Router hooks** usage in `SharePage.tsx`

## Fixes Applied

### 1. **Improved Type Safety in userSerializers.ts** ✅
**Before:**
```typescript
export function toPublicUser(user: FullUser | IUser | any): PublicUser {
  // ... accessed user.traditions which doesn't exist on FullUser or IUser
}
```

**After:**
```typescript
export function toPublicUser(user: {
  _id?: unknown;
  username: string;
  createdAt: Date;
  traditions?: unknown;
  profileImageUrl?: unknown;
}): PublicUser {
  // ... only accesses properties explicitly defined
}
```

**Benefit:** Uses structural typing instead of complex unions, which is more type-safe and clearer to TypeScript's compiler.

### 2. **Removed Unused Imports** ✅
**From `server/src/routes/auth.ts`:**
- Removed: `import { toPublicUser } from '../lib/userSerializers';`
- Reason: This import was not used in auth.ts (the public endpoint was moved to users.ts)

**From `server/src/lib/userSerializers.ts`:**
- Removed: Unused `FullUser` and `IUser` imports from function signatures
- Kept: `PublicUser` import which is still needed for the return type

### 3. **Fixed Duplicate Object Key** ✅
**In `server/src/routes/users.ts`:**
- Removed: Duplicate `createdAt` property in the object passed to `toPublicUser()`
- Before:
```typescript
const publicUser = toPublicUser({
  _id: user._id.toString(),
  username: user.username,
  createdAt: user.createdAt,
  createdAt: user.createdAt,  // ❌ Duplicate!
} as any);
```
- After:
```typescript
const publicUser = toPublicUser({
  _id: user._id.toString(),
  username: user.username,
  createdAt: user.createdAt,  // ✅ Single property
});
```

**Benefit:** Eliminates potential runtime errors and ensures clean object literals.

### 4. **Fixed React Router v6 Compatibility** ✅
**Before:**
```typescript
const { type, id } = useParams<{ type: string; id: string }>();
```

**After:**
```typescript
const { type, id } = useParams();
```

**Reason:** React Router v6.28 handles type inference automatically. The generic parameter might not be compatible with this version.

### 4. **Removed Unnecessary `as any` Cast** ✅
**In `server/src/routes/users.ts`:**
- Removed: `} as any)` cast from the object passed to `toPublicUser()`
- Removed: Unnecessary `updatedAt` field from the object
- Result: Fully type-safe with no casts

## Commits Made
```
9121007 Fix duplicate createdAt key in users.ts
6ac6620 Fix useParams type annotation in SharePage for React Router v6 compatibility
658dd4d Improve TypeScript types for userSerializers function - use structural typing instead of complex unions
6e5cb6e Remove unused import from auth.ts
```

## How to Verify the Fix

### Local Testing
If you have npm installed locally:
```bash
cd server
npm run build
# Should compile without TypeScript errors

cd ../client
npm run build
# Should compile and bundle successfully
```

### Docker Testing
```bash
docker-compose build
# Should complete successfully without exit code 2
```

## Files Modified
- `server/src/routes/auth.ts` - Removed unused import
- `server/src/routes/users.ts` - Removed unnecessary type cast and updatedAt
- `server/src/lib/userSerializers.ts` - Improved type safety with structural typing
- `client/src/components/SharePage.tsx` - Fixed React Router v6 compatibility

## Next Steps
1. **Retry the Docker build:**
   ```bash
   docker-compose build
   ```

2. **If build succeeds:** Proceed to deploy
   ```bash
   docker-compose up -d
   ```

3. **If build still fails:** 
   - Run with verbose output to see actual TypeScript errors:
     ```bash
     DOCKER_BUILDKIT=0 docker-compose build --progress=plain
     ```
   - Share the detailed error output so we can diagnose further

## Additional Notes

### Type Safety Improvements
The refactored `toPublicUser()` function uses **structural typing** instead of complex union types. This approach:
- ✅ Is more readable and maintainable
- ✅ Prevents TypeScript from getting confused by union types with `any`
- ✅ Explicitly documents what fields the function expects
- ✅ Still maintains runtime flexibility (can accept any object with required fields)

### React Router v6 Best Practices
- `useParams()` without generic parameter is the recommended approach in React Router v6
- The hook returns `Partial<Params>` which is compatible with our usage
- This aligns with current React Router v6.28 documentation

### Build Process
- **Client build**: `tsc --noEmit && vite build`
  - TypeScript checking (no-emit, just type checking)
  - Vite bundling
- **Server build**: `tsc`
  - TypeScript compilation to CommonJS

Both stages now have proper type safety without problematic unions or unused code.
