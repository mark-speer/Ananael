# Database Migration Documentation

Complete guide for running and understanding database migrations for Phase 51 prerequisites.

---

## Overview

The `add-visibility.ts` migration script adds the `visibility` field to all 6 shareable model collections, enabling the Phase 51 sharing feature.

**Status:** Ready to run  
**Required:** Before Phase 51 implementation starts  
**Safe:** Idempotent (safe to run multiple times)

---

## Migration: add-visibility.ts

### Purpose

Adds `visibility` field (default: `'private'`) to all existing documents in 6 shareable collections:

1. `talismandesigns` — Kamea, sigil, sutra designs
2. `solomioniccircles` — Solomonic circle designs
3. `rituallayouts` — Altar and ritual layouts
4. `opusvessels` — Athanor vessels
5. `practicevessels` — Subtle Body and Shamanism practice intentions
6. `treenotes` — Tree of Life study notes

### Why It's Safe

- **Idempotent** — Safe to run multiple times. Documents already having `visibility` are skipped.
- **Non-breaking** — Default `'private'` maintains backward compatibility. All existing documents become private-only until explicitly published.
- **Reversible** — Can remove field if needed (though not recommended).
- **No data loss** — Only adds a field, never modifies existing data.

### File Location

```
server/scripts/migrations/add-visibility.ts
```

---

## Running the Migration

### Development Environment

```bash
# Navigate to server directory
cd server

# Run migration
ts-node scripts/migrations/add-visibility.ts
```

**Expected output:**
```
[Migration] Connecting to MongoDB: mongodb://localhost:27017/ananael
[Migration] Connected to MongoDB
[Migration] Results Summary:
================================

talismandesigns:
  Updated: 5
  Skipped: 0

solomioniccircles:
  Updated: 3
  Skipped: 0

rituallayouts:
  Updated: 2
  Skipped: 0

opusvessels:
  Updated: 1
  Skipped: 0

practicevessels:
  Updated: 0
  Skipped: 0

treenotes:
  Updated: 4
  Skipped: 0

================================
[Migration] Total Updated: 15
[Migration] Total Skipped: 0
[Migration] Total Errors: 0
[Migration] ✓ Migration completed successfully
```

### Production Environment

**Option 1: Via Portainer (Recommended)**

1. Open Portainer dashboard (`https://your-server:9000`)
2. Navigate to Containers → `ananael-server`
3. Click "Exec" to open terminal
4. Run:
   ```bash
   cd /app && npx ts-node scripts/migrations/add-visibility.ts
   ```
5. Verify output shows success

**Option 2: Via SSH**

```bash
# SSH into server
ssh user@your-server

# Run migration in background (survives connection loss)
nohup npx ts-node scripts/migrations/add-visibility.ts > /var/log/ananael-migration.log 2>&1 &

# Monitor progress
tail -f /var/log/ananael-migration.log
```

**Option 3: Via CI/CD Pipeline**

Add to your deployment script:

```bash
#!/bin/bash
# deploy.sh

# ... existing deployment steps ...

# Run migration before starting server
echo "Running visibility migration..."
npx ts-node scripts/migrations/add-visibility.ts

if [ $? -ne 0 ]; then
  echo "Migration failed. Aborting deployment."
  exit 1
fi

# Start/restart server
docker-compose restart ananael-server
```

---

## Verification

### Check Migration Success

**MongoDB CLI:**
```bash
# Connect to MongoDB
mongosh

# Switch to ananael database
use ananael

# Check talismandesigns collection
db.talismandesigns.find({ visibility: { $exists: true } }).count()
# Should match total documents in collection

# Verify sample documents
db.talismandesigns.findOne()
# Should have visibility: "private"
```

**From server logs:**
```bash
# If running in Docker
docker logs ananael-server | grep "Migration completed"

# Check for errors
docker logs ananael-server | grep -i error
```

**From Node.js:**
```typescript
import mongoose from 'mongoose';
import TalismanDesign from './models/TalismanDesign';

await mongoose.connect('mongodb://localhost:27017/ananael');

// Count documents with visibility
const withVisibility = await TalismanDesign.countDocuments({ 
  visibility: { $exists: true } 
});

const total = await TalismanDesign.countDocuments({});

console.log(`${withVisibility}/${total} documents have visibility field`);
// Should show 100% (withVisibility === total)

await mongoose.disconnect();
```

---

## Index Strategy

### Current Implementation (MVP)

Single-field indexes on `visibility` for fast filtering:

```typescript
visibility: {
  type: String,
  enum: ['private', 'unlisted', 'public'],
  default: 'private',
  required: true,
  index: true,  // ✅ Single-field index
}
```

**Query performance:**
- `Model.find({ visibility: 'public' })` — Very fast (indexed)
- `Model.find({ visibility: 'public', userId: 123 })` — Uses userId index, then filters visibility

### Planned Compound Indexes (Phase 52+)

For better performance on common queries:

```typescript
// Compound index for public shares by user
talismandesigns.createIndex({ userId: 1, visibility: 1 });

// Compound index for listing public designs
talismandesigns.createIndex({ visibility: 1, createdAt: -1 });
```

### Verify Indexes Exist

**MongoDB CLI:**
```javascript
// List all indexes
db.talismandesigns.getIndexes()

// Should include:
// { "key": { "_id": 1 } }                    // Default
// { "key": { "userId": 1 } }                 // Owner lookup
// { "key": { "visibility": 1 } }             // Public filter
// { "key": { "createdAt": -1 } }             // Date sort (if exists)
```

**Node.js:**
```typescript
const indexes = await TalismanDesign.collection.getIndexes();
console.log(indexes);
// Should include visibility: 1
```

### Monitor Index Usage

After Phase 51 launch, monitor index efficiency:

```javascript
// MongoDB: Explain query plan
db.talismandesigns.find({ visibility: 'public' }).explain('executionStats')

// Should show COLLSCAN count = 0 (index being used)
```

---

## Rollback Plan

### If Something Goes Wrong

**Option 1: Re-run Migration**

Since it's idempotent, simply re-run:

```bash
cd server && ts-node scripts/migrations/add-visibility.ts
```

**Option 2: Reset Field to Default**

If visibility field becomes corrupted:

```bash
# MongoDB CLI
db.talismandesigns.updateMany(
  { },  // all documents
  { $set: { visibility: 'private' } }
);
```

**Option 3: Remove Field (Not Recommended)**

Only if rolling back entirely:

```bash
# MongoDB CLI
db.talismandesigns.updateMany(
  { },
  { $unset: { visibility: '' } }
);
```

**Verification after rollback:**
```bash
cd server && npm run test
# All tests should pass
```

---

## Collection Details

### talismandesigns

- **Total fields before:** userId, date, name, kind, config, notes, timestamps
- **New field:** visibility (default: 'private')
- **Documents affected:** All talismans in database
- **API impact:** Existing talismans become private-only until explicitly published

**Example:**
```json
{
  "_id": ObjectId("660f123456789abcdef01234"),
  "userId": ObjectId("660f111111111111111111111"),
  "date": ISODate("2024-01-15T10:30:00Z"),
  "name": "Mercury Sigil",
  "kind": "sigil",
  "config": { /* sigil data */ },
  "notes": "For communication",
  "visibility": "private",
  "createdAt": ISODate("2024-01-15T10:30:00Z"),
  "updatedAt": ISODate("2024-01-15T10:30:00Z")
}
```

### solomioniccircles

- **Total fields before:** userId, date, name, tradition, config, notes, timestamps
- **New field:** visibility (default: 'private')
- **Supported traditions:** goetia, heptameron, generic

### rituallayouts

- **Total fields before:** userId, date, name, config, notes, timestamps
- **New field:** visibility (default: 'private')
- **Use case:** Altar and ritual space layouts

### opusvessels

- **Total fields before:** userId, date, name, stageId, config, notes, timestamps
- **New field:** visibility (default: 'private')
- **Use case:** Athanor/alchemical vessel designs
- **Stages:** Various alchemical transformation stages

### practicevessels

- **Total fields before:** userId, date, name, config, notes, timestamps
- **New field:** visibility (default: 'private')
- **Config types:** shamanism or subtle-body practice data

### treenotes

- **Total fields before:** userId, date, nodeId, content, timestamps
- **New field:** visibility (default: 'private')
- **Use case:** Tree of Life study notes
- **NodeId format:** Sephirah names (e.g., 'malkuth', 'kether')

---

## Migration Script Walkthrough

### Overview

```typescript
async function runMigration(): Promise<void> {
  // 1. Connect to MongoDB
  // 2. For each collection:
  //    - Count documents without visibility
  //    - Update those documents to have visibility: 'private'
  //    - Log results
  // 3. Disconnect and report
}
```

### Key Functions

**runMigration()** — Main entry point
- Connects to MongoDB
- Iterates through COLLECTIONS array
- Collects results and logs summary
- Exits with 0 (success) or 1 (error)

**migrateCollection()** — Per-collection logic
- Counts documents without visibility
- Updates them to default visibility
- Returns MigrationResult with update/skip counts

### Error Handling

```typescript
// If any collection fails:
if (totalErrors > 0) {
  console.log('[Migration] ⚠️  Migration completed with errors');
  process.exit(1);  // Exit with error code
}

// Per-collection errors captured and logged
result.errors.push(`Failed to migrate ${collectionName}: ${errorMsg}`);
```

---

## Performance Considerations

### Expected Runtime

For a typical Ananael instance:

| Documents | Estimated Time |
|-----------|-----------------|
| < 100 | < 1 second |
| 100–1000 | 1–5 seconds |
| 1000–10000 | 5–30 seconds |
| > 10000 | 30s–2m |

**Factors:**
- MongoDB connection latency
- Index creation overhead
- Collection size
- Disk I/O speed

### During Migration

- App can remain running (read-only safe)
- Avoid writes to the 6 collections during migration
- No locks on database (MongoDB supports concurrent ops)

---

## Troubleshooting

### Connection timeout

**Error:** `[Migration] Error: connect ETIMEDOUT`

**Solution:**
```bash
# Verify MongoDB is running
docker ps | grep mongo

# Check connection string
echo $MONGODB_URI

# Test connectivity
mongosh "$MONGODB_URI"
```

### Collections not found

**Error:** `[Migration] Error: command failed: ns does not exist`

**Solution:**
This is OK — collections are created on first write. Migration will skip them.

### Update errors in one collection

**Error:** `[Migration] Errors: 1` for one collection

**Solution:**
Check that collection:
```bash
mongosh
use ananael
db.collectionName.stats()
db.collectionName.findOne()
```

Run migration again (idempotent).

### Index not created

**Verify:** MongoDB automatically creates indexes when schema is loaded.

**Manual creation:**
```bash
mongosh
use ananael
db.talismandesigns.createIndex({ "visibility": 1 })
```

---

## Post-Migration Steps

### 1. Verify Data Integrity

```bash
cd server && npm run test
# All tests should pass

npm run test -- --testNamePattern="visibility"
# Visibility-specific tests should pass
```

### 2. Update API Documentation

Ensure docs reference `visibility` field:
- ✅ docs/API.md — mentions visibility in shareable models
- ✅ docs/TYPES.md — documents Visibility enum
- ✅ docs/PHASE-51-IMPLEMENTATION-GUIDE.md — references field

### 3. Communicate with Team

Let the Phase 51 team know:
- Migration completed successfully
- All documents now have visibility field
- Default is 'private' (backward compatible)
- Ready to implement public endpoints

### 4. Update Production Deployment

If running on production:
- Add migration to CI/CD pipeline (before server start)
- Update deployment documentation
- Add migration command to runbook

---

## Related Documentation

- **API Reference:** `docs/API.md`
- **Architecture:** `docs/ARCHITECTURE.md`
- **Phase 51 Guide:** `docs/PHASE-51-IMPLEMENTATION-GUIDE.md`
- **Types Guide:** `docs/TYPES.md`
