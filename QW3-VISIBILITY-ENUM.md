# QW3: Draft Visibility Enum & Index Strategy

**Goal:** Define consistent privacy model across all shareable documents. Create enum, migration strategy, and sample implementation.

---

## Privacy Model

```typescript
// Global visibility enum (shared across all models)
export enum Visibility {
  PRIVATE = 'private',      // Owner only (default)
  UNLISTED = 'unlisted',    // Link-only (anyone with URL can view, not indexed)
  PUBLIC = 'public',        // Public (searchable, listed in galleries)
}

type VisibilityString = 'private' | 'unlisted' | 'public';
```

---

## Models to Update (Phase 51, P1)

1. **TalismanDesign** (server/src/models/)
   - `visibility: VisibilityString` (default: 'private')

2. **SolomonicCircle** (server/src/models/)
   - `visibility: VisibilityString` (default: 'private')

3. **RitualLayout** (server/src/models/)
   - `visibility: VisibilityString` (default: 'private')

4. **OpusVessel** (server/src/models/)
   - `visibility: VisibilityString` (default: 'private')

5. **PracticeVessel** (server/src/models/)
   - `visibility: VisibilityString` (default: 'private')

6. **TreeNote** (server/src/models/)
   - `visibility: VisibilityString` (default: 'private')
   - Note: Currently client-side only; needs server model for social

---

## Index Strategy

### Single-Field Index (Recommended for MVP)
```javascript
// In each model
db.collection.createIndex({ visibility: 1 });

// Optional: compound index for list queries
db.collection.createIndex({ userId: 1, visibility: 1, createdAt: -1 });
```

**Rationale:** Simple, covers 80% of queries:
- `find({ userId, visibility: 'public' })`
- `find({ userId, visibility: 'unlisted', _id: id })`
- Sorted by createdAt for pagination

### Multi-Field Index (Phase 54+)
```javascript
// For public gallery queries
db.talismandesigns.createIndex({ visibility: 1, createdAt: -1 });
db.talismandesigns.createIndex({ visibility: 1, category: 1, createdAt: -1 });
```

---

## MongoDB Migration Script

**File:** `server/scripts/add-visibility-field.ts`

```typescript
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MODELS = [
  'TalismanDesign',
  'SolomonicCircle',
  'RitualLayout',
  'OpusVessel',
  'PracticeVessel',
  'TreeNote', // if server-persisted
];

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log('Connected to MongoDB');

    for (const modelName of MODELS) {
      const model = mongoose.model(modelName);
      
      // Backfill all existing documents to 'private'
      const result = await model.updateMany(
        { visibility: { $exists: false } },
        { $set: { visibility: 'private' } }
      );

      console.log(`${modelName}: updated ${result.modifiedCount} documents`);
    }

    console.log('Migration complete');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
```

**Usage:**
```bash
cd server
npx ts-node scripts/add-visibility-field.ts
```

---

## Sample Model Update (TalismanDesign)

**Before:**
```typescript
// server/src/models/TalismanDesign.ts
const talismanDesignSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: String,
  description: String,
  mode: { type: String, enum: ['kamea', 'sigil', 'sutra'], required: true },
  config: Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

talismanDesignSchema.index({ userId: 1, createdAt: -1 });
```

**After:**
```typescript
// server/src/models/TalismanDesign.ts
export enum Visibility {
  PRIVATE = 'private',
  UNLISTED = 'unlisted',
  PUBLIC = 'public',
}

const talismanDesignSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: String,
  description: String,
  mode: { type: String, enum: ['kamea', 'sigil', 'sutra'], required: true },
  config: Schema.Types.Mixed,
  visibility: {
    type: String,
    enum: Object.values(Visibility),
    default: Visibility.PRIVATE,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Indexes
talismanDesignSchema.index({ userId: 1, createdAt: -1 });
talismanDesignSchema.index({ visibility: 1 }); // For public queries
```

---

## API Endpoint Changes (Phase 51, P2)

### Owner-Only Routes (Existing)
```typescript
// GET /api/talisman/designs (my designs)
// Only returns docs where userId === req.userId
router.get('/designs', protect, async (req, res) => {
  const designs = await TalismanDesign.find({ userId: req.userId });
  res.json(designs);
});

// PUT /api/talisman/designs/:id (update my design)
router.put('/designs/:id', protect, async (req, res) => {
  const design = await TalismanDesign.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    req.body,
    { new: true }
  );
  res.json(design);
});
```

### Public Routes (New)
```typescript
// GET /api/talisman/designs/:id/public (view public/unlisted)
// No auth required
router.get('/designs/:id/public', async (req, res) => {
  const design = await TalismanDesign.findOne({
    _id: req.params.id,
    visibility: { $in: ['public', 'unlisted'] },
  });
  if (!design) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.json(design);
});

// PUT /api/talisman/designs/:id (update my design, can change visibility)
router.put('/designs/:id', protect, async (req, res) => {
  // Allow owner to update visibility field
  const design = await TalismanDesign.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { $set: req.body },
    { new: true }
  );
  res.json(design);
});
```

---

## Testing Checklist

- [ ] Existing private designs remain private (backward compat)
- [ ] Owner can read own designs (any visibility)
- [ ] Guest/non-owner can read only public/unlisted designs
- [ ] Visibility field shows in response
- [ ] Visibility update persists (toggle private → unlisted)
- [ ] Public route returns 404 for private designs
- [ ] Migration backfills correctly (all old docs → private)
- [ ] Indexes created successfully
- [ ] Performance: public list query &lt;50ms on 1000+ docs

---

## Acceptance Criteria

- ✓ Visibility enum defined (client + server)
- ✓ All 6 shareable models have visibility field (schema update)
- ✓ Migration script created + tested
- ✓ Indexes defined + created
- ✓ API endpoints documented (owner-only + public)
- ✓ Backward compatibility verified
- ✓ Tests pass (private/unlisted/public queries work)
- ✓ Performance baseline established

---

## Next Steps
- Phase 51, P1: Apply to all 6 models
- Phase 51, P2: Add public read routes
- Phase 52: Add visibility toggle UI (share button)
