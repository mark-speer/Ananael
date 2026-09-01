# QW2: JournalEntry Schema Audit Report

**Date:** 2026-09-01  
**Auditor:** Copilot CLI  
**Status:** ✅ PASS (with recommendations)  
**Scope:** JournalEntry model schema review per 6-point checklist

---

## Executive Summary

The JournalEntry schema is **well-structured, normalized, and ready for Phase 51–52 enhancements**. No critical blockers identified. Versioning strategy recommended for Phase 54 (sync). N+1 query patterns are not present (no unnecessary populate chains).

**Key Findings:**
- ✅ Schema structure consistent, properly typed
- ⚠️ PII leakage risk identified: `sky.lat/lon` and `body/title` may expose private data
- ⚠️ Versioning field missing (needed for Phase 54 conflict resolution)
- ✅ Social linking-ready: can add `visibility` and `linkedToSharedArtifact` fields non-breaking
- ✅ N+1 queries not present; no aggressive populate chains
- ✅ Indexes well-placed for common queries

---

## 1. Field Inventory

| Field | Type | Indexed | Nullable | Constraints | Notes |
|-------|------|---------|----------|-------------|-------|
| `_id` | ObjectId | ✓ | No | Auto-generated | Document primary key |
| `userId` | ObjectId | ✓ | No | ref: 'User', required | Entry owner; composite index with date |
| `entryType` | String | ✓ | No | enum, required | One of: ritual, dream, divination, mood, working, note |
| `occurredAt` | Date | ✓ | No | default: Date.now, required | When the event happened; composite index (userId, entryType) |
| `title` | String | ✗ | Yes | maxlength: 200, default: '' | Entry headline |
| `body` | String | ✗ | Yes | maxlength: 20000, default: '' | Main content; indexed via text search |
| `mood` | Number | ✗ | Yes | min: 1, max: 5, default: null | Emotion scale 1–5 |
| `energy` | Number | ✗ | Yes | min: 1, max: 5, default: null | Energy level 1–5 |
| `status` | String | ✗ | Yes | enum: ['active', 'paused', 'complete'], default: undefined | Only populated for `entryType==='working'` |
| `tags` | Array[String] | ✗ | Yes | default: [], indexed via text | Custom user tags; up to 40 tags per entry |
| `entities` | Array[Object] | ✗ | Yes | default: [], up to 60 per entry | Esoteric system tags: `{ kind, id, label }` |
| `sky` | Object | ✗ | Yes | embedded schema | Astrological context: moonPhase, moonIllum, dayRuler, hourRuler, sunSign, nakshatra, chineseDay, **lat**, **lon** |
| `payload` | Mixed | ✗ | Yes | Schema.Types.Mixed | Module-specific JSON; format varies by entryType |
| `links` | Array[Object] | ✗ | Yes | default: [], embedded | Cross-document references: `{ module, refModel, refId }` |
| `createdAt` | Date | ✗ | No | Auto-populated (timestamps: true) | Entry creation timestamp |
| `updatedAt` | Date | ✗ | No | Auto-populated (timestamps: true) | Last modification timestamp |

### Composite Indexes
- `{ userId: 1, occurredAt: -1 }` — list entries by user, sorted by date (most recent first)
- `{ userId: 1, entryType: 1, occurredAt: -1 }` — filter by user + type + date
- **Text index:** `{ title: 'text', body: 'text', tags: 'text', 'entities.label': 'text' }` — full-text search

---

## 2. PII Leakage Assessment

### Risk Analysis

#### 🔴 **HIGH RISK: `sky.lat` and `sky.lon` (Location Data)**
- **Issue:** User location coordinates stored in journal entries
- **Exposure:** If entries are shared publicly or with other users, location privacy compromised
- **Scope:** Affects Phase 51 (public shares) and Phase 52 (social link-sharing)
- **Current State:** No visibility control; all fields exported as-is
- **Mitigation:**
  - Add `visibility` field to JournalEntry (see Section 4)
  - Strip lat/lon when exporting for public or shared views
  - Keep location data private-only in authored view
  - **Do NOT remove fields** (backward compatibility); filter at application layer

#### 🟠 **MEDIUM RISK: `body` and `title` (Freetext Content)**
- **Issue:** User's personal thoughts in body field may contain PII
  - Dream entries: subconscious content, private relationships
  - Mood entries: emotional state that could identify person
  - Working entries: personal magical intent
  - Note entries: arbitrary sensitive information
- **Exposure:** If entries are shared, private thoughts exposed
- **Mitigation:**
  - Add `visibility` field; default to `private` for backward compatibility
  - Respect visibility when exporting via public endpoints
  - Recommend users review content before sharing

#### 🟡 **LOW RISK: `entities[]`, `tags`, `mood`, `energy`**
- **Issue:** System entity tags (e.g., `kind: 'chakra'`, `label: 'heart chakra'`) are generally safe
- **Exposure:** Mood/energy scales (1–5) are aggregatable but not directly PII
- **Status:** Safe to share; no additional controls needed
- **Note:** `payload` depends on entryType; review per type (see below)

#### 🟠 **MEDIUM RISK: `payload` (Depends on entryType)**
- **ritual entries:** Step logs, times, materials — generally safe to share
- **dream entries:** Narrative or symbols — potentially sensitive; **treat as private**
- **divination entries:** Card/hexagram spreads, interpretations — safe to share
- **mood entries:** Emoji/rating + optional notes — may contain PII if notes added
- **working entries:** Intent + status — **may be private**; require visibility control
- **note entries:** Arbitrary freetext — **assume private**
- **Recommendation:** Don't assume payload is safe; trust visibility field

---

### PII Mitigation Plan (for Phase 51–52)

1. **Add `visibility` field to JournalEntry:**
   ```typescript
   visibility: {
     type: String,
     enum: ['private', 'unlisted', 'public'],
     default: 'private',
     index: true,  // for quick filtering
   }
   ```

2. **Update API responses:**
   - `/api/journal/entries` (owned by user) — return all fields, all visibility levels
   - `/api/journal/entries/:id/share` (public endpoint) — filter based on visibility
   - Exclude `sky.lat` and `sky.lon` from public/shared exports

3. **Batch audit payload for high-risk entryTypes** (dream, mood, working, note) — ensure no secrets

---

## 3. Versioning Strategy

### Current State
- ❌ **No `version` field on JournalEntry**
- Mongoose provides automatic `__v` field, but not exposed via schema interface
- Conflict resolution strategy undefined for Phase 54 (sync)

### Recommendation: **Option A — Explicit Versioning**

**Rationale:** Explicit versioning is clearer for multi-device sync, easier to audit, and aligns with Phase 54 conflict-resolution needs.

**Implementation:**
```typescript
version: {
  type: Number,
  default: 1,
  required: true,
}
```

**Versioning Policy:**
- **Version 1 (current):** 
  - Fields: userId, entryType, occurredAt, title, body, mood, energy, status, tags, entities, sky, payload, links
  - entryTypes: ritual, dream, divination, mood, working, note
  - entityKinds: 25 kinds (sephirah → direction → other)
  - Payload format: varies per module; no fixed schema

- **Version 2 (when needed):** 
  - Example: "Rename entryType to type" or "Split sky into skyV2"
  - Migration required for old documents
  - Server accepts both v1 and v2; converts on read/write

**Backward Compatibility:**
- Writers should increment version only on backward-incompatible schema change
- Readers must handle all versions in range [1, currentVersion]
- Example migration handler:
  ```typescript
  if (entry.version === 1) {
    entry.visibility = entry.visibility ?? 'private';  // backfill
  }
  ```

**Action Items:**
1. Add `version: 1` to JournalEntry schema (Phase 54)
2. Document all entryType + payload structures per version (Phase 54)
3. Create migration scripts for version bumps (Phase 54)
4. Implement version-aware read/write handlers (Phase 54)

---

## 4. Social Linking Readiness

### Current Gaps
- ❌ No `visibility` field (needed for public/unlisted/private distinction)
- ❌ No link to shared artifacts (e.g., shared Talisman design)
- ❌ No author field (all entries assumed self-authored)

### Recommendations

#### A. Add `visibility` Field
```typescript
visibility: {
  type: String,
  enum: ['private', 'unlisted', 'public'],
  default: 'private',
  index: true,
}
```
- **private:** Owner only
- **unlisted:** Shared via link; not discoverable
- **public:** Listed in global feed
- Non-breaking addition; defaults to private for existing entries

#### B. Add Optional `linkedToSharedArtifact` Field
```typescript
linkedToSharedArtifact: {
  artifactType: String,  // e.g., 'TalismanDesign', 'PracticeVessel'
  artifactId: ObjectId,
  linkedAt: Date,
}
```
- Tracks journal entry linked to shared design (Phase 51)
- Example: Entry documents ritual performed with shared talisman
- Non-breaking; optional for all entries

#### C. Add Optional `authorId` Field (for future shared entries)
```typescript
authorId: {
  type: ObjectId,
  ref: 'User',
  default: null,
}
```
- For future feature: shared entries authored by other users
- Currently, all entries self-authored (authorId implied = userId)
- Non-breaking; prepare for Phase 52

### Schema Change: Non-Breaking
All three additions are optional fields with defaults; can be deployed without migration.

**Timeline:**
- Phase 51: Add `visibility` + `linkedToSharedArtifact`
- Phase 52: Add `authorId`; implement shared entry endpoints

---

## 5. N+1 Query Analysis

### Current Query Patterns

#### Query 1: `GET /api/journal/entries` (List)
**Code:** `server/src/routes/journal.ts:170`
```typescript
let query = JournalEntry.find(filter).sort({ occurredAt: -1 }).limit(limit);
if (q && q.trim()) {
  query = query.select({ score: { $meta: 'textScore' } }).sort({ ... });
}
const entries = await query.lean();
```
- ✅ Uses `.lean()` (no hydration to full Mongoose docs)
- ✅ No populate chains
- ✅ Single query; no loop-based sub-queries
- ✅ Text search optimized via text index
- **Status:** No N+1 issue

#### Query 2: `GET /api/journal/entries/:id` (Single)
**Code:** `server/src/routes/journal.ts:271`
```typescript
const entry = await JournalEntry.findOne({
  _id: req.params.id,
  userId: req.userId,
}).lean();
```
- ✅ No populate
- ✅ Lean query
- **Status:** No N+1 issue

#### Query 3: `PATCH /api/journal/entries/:id` (Update)
**Code:** `server/src/routes/journal.ts:293`
```typescript
const entry = await JournalEntry.findOne({
  _id: req.params.id,
  userId: req.userId,
});
// ... modify fields ...
await entry.save();
```
- ✅ Single document fetch + save
- ✅ Validates ownership before save
- **Status:** No N+1 issue

#### Query 4: `DELETE /api/journal/entries/:id`
**Code:** `server/src/routes/journal.ts:373`
```typescript
const result = await JournalEntry.deleteOne({
  _id: req.params.id,
  userId: req.userId,
});
```
- ✅ Atomic delete
- **Status:** No N+1 issue

### Potential N+1 Candidates (if future features added)

1. **Linking to `links[]` array (refId population):**
   - If a handler needs to load referenced documents (e.g., to validate or display):
     ```typescript
     for (const link of entry.links) {
       const doc = await mongoose.model(link.refModel).findById(link.refId);  // N+1 !!!
     }
     ```
   - **Prevention:** Use aggregation pipeline with `$lookup` for batch population

2. **Populating `userId` with User details:**
   - Current: userId is just ObjectId; no `.populate('userId')`
   - If needed (e.g., public feed showing author name):
     ```typescript
     const entries = await JournalEntry.find({ visibility: 'public' })
       .populate('userId', 'username email')
       .limit(50);  // Single query, no N+1
     ```
   - **Status:** Safe if using `.populate()`; ensure limit + index

---

### N+1 Optimization Recommendations

**For Phase 53 (Observability):**
1. Monitor query time for `/api/journal/entries` with large datasets (1000+ entries)
2. Benchmark text search performance; consider full-text search index tuning
3. If `linkedToSharedArtifact.artifactId` (Phase 51) requires artifact details:
   - Use aggregation `$lookup` instead of loop-based populate
   - Example:
     ```typescript
     db.journalentries.aggregate([
       { $match: { userId: userId, visibility: { $ne: 'private' } } },
       { $lookup: { from: 'talismans', localField: 'linkedToSharedArtifact.artifactId', foreignField: '_id', as: 'artifact' } },
       { $sort: { occurredAt: -1 } },
       { $limit: 50 }
     ])
     ```

---

## 6. Index Recommendations

### Current Indexes
✅ **Existing (Good Coverage)**
- `{ userId: 1 }` — owner filter
- `{ entryType: 1 }` — type filter
- `{ occurredAt: 1 }` — date sort
- `{ userId: 1, occurredAt: -1 }` — list by user + date (composite)
- `{ userId: 1, entryType: 1, occurredAt: -1 }` — filter by user + type + date (composite)
- **Text:** `{ title: 'text', body: 'text', tags: 'text', 'entities.label': 'text' }` — full-text search

### Recommended Additions (Phase 53 / Phase 54)

#### Phase 51 (Visibility Control)
```typescript
// Index visibility for filtering public/shared entries
JournalEntrySchema.index({ visibility: 1, occurredAt: -1 });
JournalEntrySchema.index({ userId: 1, visibility: 1, occurredAt: -1 });
```
- **Use case:** `GET /api/journal/entries/public?page=1` (global public feed)
- **Use case:** User's shared entries: `{ userId, visibility: 'public' }`

#### Phase 53 (Query Optimization)
```typescript
// Search within user's own entries by tag + date
JournalEntrySchema.index({ userId: 1, tags: 1, occurredAt: -1 });

// Search entities by kind (e.g., all chakra entries)
JournalEntrySchema.index({ userId: 1, 'entities.kind': 1, occurredAt: -1 });
```
- **Use case:** `/api/journal/entries?tag=ritual&entryType=working` (filter + sort)
- **Use case:** `/api/journal/entries?entity=chakra` (entity kind filter)

#### Optional (Low Priority)
```typescript
// Mood/energy trends by date
JournalEntrySchema.index({ userId: 1, mood: 1, occurredAt: -1 });
JournalEntrySchema.index({ userId: 1, energy: 1, occurredAt: -1 });
```
- **Use case:** Analytics dashboard: mood trends over time
- **Deferrable to Phase 53+ if needed**

---

## 7. Blocking Issues & Mitigation

### ✅ No Phase 51–52 Blockers Identified

| Concern | Status | Mitigation |
|---------|--------|-----------|
| PII leakage (location) | ⚠️ Risk | Add visibility field; strip lat/lon on public export |
| PII leakage (freetext) | ⚠️ Risk | Add visibility field; default private for all entries |
| Versioning for Phase 54 | ⚠️ Missing | Add version field; document policy |
| Social linking | ✅ Ready | Can add `linkedToSharedArtifact` + `visibility` non-breaking |
| N+1 queries | ✅ None detected | Monitor Phase 53; use aggregation if linking needed |
| Indexes | ✅ Adequate | Current indexes sufficient; Phase 53 can add visibility + entity indexes |

**Action:** None required to unblock Phase 51–52. Recommended actions are for future phases.

---

## 8. Schema Consistency Check

### Type Safety
✅ All field types correctly typed in TypeScript interface (`IJournalEntry`)  
✅ Enum types enumerated (ENTRY_TYPES, ENTITY_KINDS)  
✅ Nested schemas properly defined (JournalEntitySchema, JournalSkySchema, JournalLinkSchema)  

### Naming Conventions
✅ camelCase for all fields  
✅ Consistent prefixes: all Journal* types prefixed with "Journal"  
✅ Entity kinds lowercase with no separators (e.g., `hebrewLetter`, not `hebrew_letter`)  

### Constraints Validation
✅ Mood/energy min/max (1–5) enforced  
✅ Title/body maxlength enforced (200, 20000)  
✅ Enum validation on entryType and entity.kind  
✅ Required fields marked (userId, entryType, occurredAt)  

### Cross-Model References
✅ userId ref to User model is valid  
✅ No circular references  
✅ links[] array allows any refModel (string); runtime validation needed for refModel name  

---

## 9. Phase 54 (Sync) Considerations

### For Conflict Detection & Resolution

**Conflict Scenario:**
- User A edits entry on Device 1 at 10:00 UTC
- User A edits same entry on Device 2 at 10:05 UTC (offline at time of first edit)
- Sync: which version wins?

**Current State:**
- ❌ No explicit version field
- ❌ No syncedAt timestamp
- ❌ No conflict strategy defined

**Phase 54 Requirements:**
1. Add `version: number` field (default 1)
2. Add `syncedAt: Date` field (timestamp of last successful sync)
3. Implement conflict resolution:
   - **Option A (Server Wins):** Latest `updatedAt` wins; client merge is discarded
   - **Option B (Client Wins):** Latest edit device wins; earlier changes discarded
   - **Option C (Three-Way Merge):** Use base version + diff to resolve conflicts
4. Document strategy in schema comments

**Recommendation:** Server Wins (simplest; aligns with Phase 54 design)

```typescript
version: {
  type: Number,
  default: 1,
  required: true,
}
syncedAt: {
  type: Date,
  default: null,  // null = never synced
}
```

---

## 10. Summary & Recommendations

| Checklist Item | Status | Recommendation |
|---|---|---|
| **1. Schema Structure** | ✅ PASS | Well-formed; no changes needed |
| **2. PII Leakage** | ⚠️ PASS w/ action | Add visibility field + export filters (Phase 51) |
| **3. Versioning** | ⚠️ PASS w/ action | Add version field (Phase 54) |
| **4. Social Linking** | ✅ PASS | Schema ready; add fields non-breaking (Phase 51–52) |
| **5. N+1 Queries** | ✅ PASS | No issues; monitor in Phase 53 |
| **6. Indexes** | ✅ PASS | Adequate; add visibility indexes Phase 51+ |

### Immediate Actions (No Blockers)
- ✅ Phase 51–52 can proceed without schema changes

### Recommended Actions (Do in Phase 51)
1. Add `visibility` field + indexes
2. Add `linkedToSharedArtifact` field
3. Implement export filters (strip PII)

### Recommended Actions (Do in Phase 54)
1. Add `version` and `syncedAt` fields
2. Implement conflict-resolution logic
3. Document versioning policy

### Recommended Actions (Do in Phase 53)
1. Monitor query performance for large datasets
2. Add visibility + entity indexes
3. Benchmark text search
4. Plan aggregation pipeline for linking (if needed)

---

## Appendix: Export Filter Example (Phase 51)

**Hide PII in public/shared views:**
```typescript
function sanitizeForPublic(entry: IJournalEntry, viewerUserId?: string): any {
  const isOwner = viewerUserId === entry.userId.toString();
  
  // Owner sees all fields
  if (isOwner) return entry;
  
  // Others see only what visibility allows
  if (entry.visibility === 'private') return null;
  
  return {
    _id: entry._id,
    entryType: entry.entryType,
    occurredAt: entry.occurredAt,
    title: entry.title,
    body: entry.body,
    mood: entry.mood,
    energy: entry.energy,
    tags: entry.tags,
    entities: entry.entities,
    // Strip location: sky without lat/lon
    sky: entry.sky ? {
      moonPhase: entry.sky.moonPhase,
      moonIllum: entry.sky.moonIllum,
      dayRuler: entry.sky.dayRuler,
      hourRuler: entry.sky.hourRuler,
      sunSign: entry.sky.sunSign,
      nakshatra: entry.sky.nakshatra,
      chineseDay: entry.sky.chineseDay,
      // lat, lon EXCLUDED
    } : null,
    payload: entry.payload,
    links: entry.links,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}
```

---

## Audit Sign-Off

| | |
|---|---|
| **Audit Date** | 2026-09-01 |
| **Auditor** | Copilot CLI |
| **Model Location** | server/src/models/JournalEntry.ts |
| **Schema Version Reviewed** | Version 1 (no version field yet) |
| **Blockers for Phase 51–52** | None ✅ |
| **Blockers for Phase 54** | None (version field recommended) ✅ |
| **Status** | AUDIT COMPLETE — Ready for implementation ✅ |
