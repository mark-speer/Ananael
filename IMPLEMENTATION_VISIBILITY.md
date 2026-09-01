# QW3: Visibility Enum & Index Strategy Implementation

## Overview

This implementation adds a privacy/visibility field to 6 shareable models in the Ananael project, enabling users to control document access levels (private/unlisted/public).

## Implementation Details

### 1. Visibility Enum (`server/src/types/visibility.ts`)

**File:** `server/src/types/visibility.ts`

Defines the visibility levels and related types:

```typescript
export enum Visibility {
  PRIVATE = 'private',
  UNLISTED = 'unlisted',
  PUBLIC = 'public',
}

export type VisibilityString = 'private' | 'unlisted' | 'public';
export const VISIBILITY_VALUES = ['private', 'unlisted', 'public'];
export const DEFAULT_VISIBILITY = 'private';
```

**Key Points:**
- `PRIVATE`: Document is only accessible to the owner
- `UNLISTED`: Document can be accessed via direct link but not publicly browsed
- `PUBLIC`: Document is visible to all users
- Default value is `PRIVATE` for backward compatibility

### 2. Updated Models

All 6 shareable models have been updated with:
- Import of `Visibility` enum and `VisibilityString` type
- Added `visibility: VisibilityString` field to TypeScript interfaces
- Added `visibility` field to Mongoose schemas with:
  - Type: `String`
  - Enum validation: `[Visibility.PRIVATE, Visibility.UNLISTED, Visibility.PUBLIC]`
  - Default: `Visibility.PRIVATE`
  - Index: `true` (single-field index for efficient filtering)

**Updated Models:**
1. `TalismanDesign.ts`
2. `SolomonicCircle.ts`
3. `RitualLayout.ts`
4. `OpusVessel.ts`
5. `PracticeVessel.ts`
6. `TreeNote.ts`

### 3. Database Indexes

**Index Strategy:** Single-field index on visibility for each model

```typescript
visibility: {
  type: String,
  enum: [Visibility.PRIVATE, Visibility.UNLISTED, Visibility.PUBLIC],
  default: Visibility.PRIVATE,
  required: true,
  index: true,  // Creates single-field index
}
```

**Impact:**
- Enables efficient queries for documents by visibility level
- Example: `db.collection.find({ visibility: 'public' })`
- Minimal storage overhead (single index per collection)
- Future: Compound indexes (userId + visibility + createdAt) can be added for complex queries

### 4. Migration Script

**File:** `server/scripts/migrations/add-visibility.ts`

The migration script handles adding the `visibility` field to existing documents:

**Features:**
- Connects to MongoDB using `MONGODB_URI` from environment variables
- Processes all 6 collections
- Sets `visibility: 'private'` on documents without the field
- Tracks results: updated count, skipped count, errors
- Idempotent: Safe to run multiple times
- Comprehensive logging of results

**Usage:**
```bash
cd server
ts-node scripts/migrations/add-visibility.ts
```

**Collections Migrated:**
- `talismandesigns`
- `solomioniccircles`
- `rituallayouts`
- `opusvessels`
- `practicevessels`
- `treenotes`

**Environment:**
- Requires `.env` file with `MONGODB_URI` set
- Connects, runs migration, logs results, and disconnects

**Idempotency:**
- Only updates documents without `visibility` field
- Subsequent runs skip already-migrated documents
- Safe to run in staging/production (when ready in Phase 51)

### 5. Tests

**Unit Tests** (`server/tests/visibility.unit.test.ts`):
- Enum values validation
- Type definitions
- VISIBILITY_VALUES array completeness
- DEFAULT_VISIBILITY setting

**Integration Tests** (`server/tests/visibility.integration.test.ts`):
- Default visibility on model creation
- Setting different visibility levels
- Validation of enum values
- Backward compatibility with old documents
- All 6 models verified

**Migration Tests** (`server/tests/visibility.migration.test.ts`):
- Default value application
- Backward compatibility scenarios
- Migration idempotency logic
- Index verification
- All models have visibility field

### 6. Backward Compatibility

**Strategy:** Default value of `'private'` ensures old documents work seamlessly

**Behavior:**
- New documents: Automatically get `visibility: 'private'` default
- Old documents (without field): Appear private when queried
- Migration script: Adds field to existing documents
- Existing endpoints: Continue working without changes

**Timeline:**
- **Phase 50 (Current):** Code changes only, no migration on production
- **Phase 51:** Migration script runs on production databases
- Until migration: Queries for specific visibility levels only find new/migrated docs

## Usage Examples

### Creating Documents with Visibility

```typescript
// Private by default
const design = new TalismanDesign({
  userId: userId,
  name: 'My Secret Design',
  kind: 'kamea',
  config: {},
  // visibility defaults to 'private'
});

// Explicitly set visibility
const publicDesign = new TalismanDesign({
  userId: userId,
  name: 'My Public Design',
  kind: 'kamea',
  config: {},
  visibility: Visibility.PUBLIC,
});

const unlistedDesign = new TalismanDesign({
  userId: userId,
  name: 'My Unlisted Design',
  kind: 'kamea',
  config: {},
  visibility: Visibility.UNLISTED,
});
```

### Querying by Visibility

```typescript
// Find all public designs
const publicDesigns = await TalismanDesign.find({ visibility: Visibility.PUBLIC });

// Find user's private designs
const privateDesigns = await TalismanDesign.find({
  userId,
  visibility: Visibility.PRIVATE,
});

// Count documents by visibility
const counts = await Promise.all([
  TalismanDesign.countDocuments({ visibility: Visibility.PRIVATE }),
  TalismanDesign.countDocuments({ visibility: Visibility.UNLISTED }),
  TalismanDesign.countDocuments({ visibility: Visibility.PUBLIC }),
]);
```

## Index Strategy Rationale

**Current Approach (MVP):**
- Single-field index on `visibility` for each model
- Supports basic filtering: `find({ visibility: 'public' })`
- Low overhead, high clarity

**Future Enhancements (Post-MVP):**
Compound indexes for complex queries:
- `{ userId: 1, visibility: 1, createdAt: -1 }` for user's public designs sorted by date
- `{ visibility: 1, createdAt: -1 }` for public timeline queries
- Added only when performance testing identifies need

## TypeScript Compilation

All changes pass TypeScript strict mode:
```bash
cd server
npm run build
```

Expected result: No errors, clean compilation.

## File Manifest

**New Files:**
- `server/src/types/visibility.ts` - Visibility enum and types
- `server/scripts/migrations/add-visibility.ts` - Migration script
- `server/tests/visibility.unit.test.ts` - Unit tests
- `server/tests/visibility.integration.test.ts` - Integration tests
- `server/tests/visibility.migration.test.ts` - Migration logic tests

**Modified Files:**
- `server/src/models/TalismanDesign.ts`
- `server/src/models/SolomonicCircle.ts`
- `server/src/models/RitualLayout.ts`
- `server/src/models/OpusVessel.ts`
- `server/src/models/PracticeVessel.ts`
- `server/src/models/TreeNote.ts`

## Success Criteria - Implementation Status

- [x] Visibility enum defined and exported
- [x] All 6 models updated with visibility field
- [x] Single-field indexes created on visibility
- [x] Migration script written and tested
- [x] Unit tests pass (defaults, validation)
- [x] Integration tests pass (model behavior, backward compat)
- [x] TypeScript compilation clean
- [ ] Migration run on staging (Phase 51)
- [ ] Migration run on production (Phase 51)
- [ ] Integration endpoints tested (Phase 51)

## Next Steps (Phase 51)

1. Run migration script on staging database
2. Verify all documents have visibility field
3. Test queries filtering by visibility
4. Run integration tests on staging
5. Deploy changes to production
6. Run migration script on production
7. Monitor for any issues

## Troubleshooting

**Migration doesn't connect to MongoDB:**
- Verify `MONGODB_URI` in `.env` file
- Check MongoDB is running and accessible
- Verify network connectivity to database

**TypeScript compilation errors:**
- Ensure all imports are correct
- Check `tsconfig.json` paths are configured
- Verify `server/src/types/visibility.ts` exists

**Documents don't have visibility field after migration:**
- Ensure migration script completed without errors
- Check script output logs for errors
- Verify collection names match actual database collections

## Related Documentation

- Ananael Project Architecture: See project README
- MongoDB Schema Design: See individual model files
- API Endpoint Documentation: (To be added in Phase 51)
