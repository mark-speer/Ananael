# QW2: JournalEntry Schema Audit for Multi-Version Support

**Goal:** Review JournalEntry schema for data consistency, versioning strategy, and PII leakage before Phase 54 (sync) and social features.

---

## Current State Analysis

### JournalEntry Model Location
`server/src/models/JournalEntry.ts` (Mongoose schema)

**Key fields to audit:**
- `userId` — owner
- `entryType` — enum: ritual, dream, divination, mood, working, note
- `entities[]` — tagged entities (kind + id + label)
- `payload` — module-specific JSON (cards, hexagram lines, ritual run state, etc.)
- `sky` — moon phase, planetary hour, zodiac context
- `links[]` — cross-references to other documents
- `createdAt`, `updatedAt` — timestamps

---

## Audit Checklist

### 1. Schema Structure Review
- [ ] List all fields in JournalEntry
- [ ] Check field types (string, object, array, date)
- [ ] Identify which fields are indexed
- [ ] Check for redundant fields (data stored in multiple places)
- [ ] Review entity types: are all system keys documented?

**Questions:**
- Is `payload` a generic object or typed per entryType?
- Do entities duplicate info already in payload?
- Is `sky` always populated, or can it be null?

### 2. PII Leakage Check
- [ ] Verify `sky` doesn't include user location (should be lat/lon removed for social)
- [ ] Check `payload` never includes:
  - User email
  - Natal birth data (full chart)
  - Private notes or identification
- [ ] Review `entities[]`: do entity.label ever expose private info?
- [ ] Verify `links[]` doesn't reference private user documents

**Action:** If leakage found, mark as blocker for Phase 52 (S1 public shares).

### 3. Versioning & Evolution Strategy
- [ ] Do we have a `version` field on JournalEntry?
- [ ] Can we add new entryTypes without schema migration?
- [ ] Can we add new entity kinds without breaking old entries?
- [ ] Document how to handle backward compatibility

**Decision needed:**
- Option A: Add `version: number` field, bump on schema changes (explicit versioning)
- Option B: Rely on `updatedAt` + nullable fields (implicit versioning)
- Option C: Add `_v` auto-incrementing field (Mongoose default)

### 4. Social Linking Readiness
- [ ] Can we add an `authorId` field (for shared entries from other users)?
- [ ] Does the schema support visibility field (needed for social)?
- [ ] Can we add `linkedToSharedArtifact` field (e.g., talisman share ID)?

**Action:** Document how Phase 51–52 will link journal entries to shared designs.

### 5. N+1 Query Analysis
Review `server/src/routes/journal.ts` for query patterns:

- [ ] `GET /api/journal/entries` — does it fetch all related entities or lazy-load?
- [ ] `GET /api/journal/entries/:id` — check populate() calls
- [ ] `PATCH /api/journal/entries/:id` — verify only changed fields updated
- [ ] Search queries — do they use aggregation pipeline or find()?

**Action:** Document N+1 candidates for Phase 53 optimization.

### 6. Index Coverage
- [ ] Is there an index on `userId` + `createdAt` (common sort)?
- [ ] Is there an index on `entryType` (for filtering)?
- [ ] Is there an index on `entities` (for tag search)?
- [ ] Are compound indexes documented?

**Action:** Add missing indexes if Phase 53 audit finds slow queries.

---

## Audit Report Template

```markdown
## JournalEntry Schema Audit Report

### 1. Field Inventory
| Field | Type | Indexed | Nullable | Notes |
|-------|------|---------|----------|-------|
| userId | ObjectId | ✓ | No | Owner |
| entryType | String (enum) | ✓ | No | ritual / dream / divination / mood / working / note |
| entities | Array | ✗ | Yes | Entity tags [{ kind, id, label }] |
| payload | Object | ✗ | Yes | Module-specific JSON |
| sky | Object | ✗ | Yes | { moonPhase, hourRuler, zodiacSigns } |
| createdAt | Date | ✓ | No | |
| updatedAt | Date | ✓ | No | |
| links | Array | ✗ | Yes | Cross-references [{ docType, docId }] |

### 2. PII Leakage Assessment
- **sky field:** Stores { lat?, lon?, ... } — **RISK:** location exposed in public shares
  - **Mitigation:** Strip location before social export; keep `lat/lon` private
- **payload field:** Varies by entryType; audit each:
  - divination: cards/hexagrams → safe to share
  - dream: freetext notes → **RISK:** PII may be in text
  - ritual: step log + times → safe to share
  - mood: emoji + text → **RISK:** may include private thoughts
  - working: intent + status → **RISK:** intent may be private
  - note: freetext → **RISK:** may include private thoughts
  - **Mitigation:** Add visibility field to JournalEntry; strip private entries from shares

### 3. Versioning Strategy
**Decision:** Use `version: number` field + explicit migration on schema changes
- Current version: 1
- On backward-incompatible change: bump to version 2, add migration script
- Readers must handle all in-range versions

### 4. Social Linking Readiness
- Can add optional `linkedToSharedArtifact: { type, id }` field
- Can add optional `visibility: 'private' | 'unlisted' | 'public'` field
- schema change non-breaking; old entries default to `private`

### 5. Query Optimization Candidates
- `GET /api/journal/entries?entryType=divination` — add compound index (userId, entryType, createdAt)
- `GET /api/journal/entries?entities.kind=chakra` — optimize entity search
- Journal search with text query — benchmark full-text search

### 6. Index Recommendations
- Add: `{ userId: 1, createdAt: -1 }` (list by date)
- Add: `{ userId: 1, entryType: 1, createdAt: -1 }` (filter by type)
- Consider: `{ entities.kind: 1, entities.id: 1 }` (tag search)

### 7. Phase 51 Blockers
- **None identified** — JournalEntry can be extended without breaking existing entries

### 8. Phase 54 (Sync) Considerations
- Need `version` field for conflict detection
- Need `syncedAt` timestamp (separate from `updatedAt`)
- Document server-wins strategy for concurrent journal edits
```

---

## Acceptance Criteria

- ✓ Audit report completed (use template above)
- ✓ All fields documented with type + nullable + index status
- ✓ PII leakage identified + mitigation planned
- ✓ Versioning strategy chosen + documented
- ✓ Social linking readiness assessed
- ✓ N+1 query candidates listed for Phase 53
- ✓ Index recommendations provided
- ✓ No Phase 51–52 blockers identified (or documented as such)

---

## Next Steps
- Share audit report with team (document in code as comment)
- Feed findings to Phase 53 (observability) for N+1 optimization
- Feed visibility/linking recommendations to Phase 51 design
