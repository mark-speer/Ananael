# Ananael Option A: Social First — Executive Summary

**Project Status:** Planning phase complete. Ready for implementation (Week 1–2: Quick Wins; Week 3: Phase 51 begins).

---

## Vision

Enable practitioners to **share their sacred designs** (talismans, circles, rituals, altars, trees, vessels) via secure, privacy-preserving links. Scale to multi-device sync and offline-first capabilities.

**Path:** Social Prerequisites (infrastructure) → Share Links UI → Observability → Cross-device sync → Offline journal

---

## What Gets Built (Phases 51–55)

### Phase 51: Social Prerequisites (Weeks 1–3)
**Outcome:** Backend infrastructure ready for sharing, no UI yet.

- Add `visibility` field (private/unlisted/public) to 6 shareable models
- Setup URL routing for `/s/:type/:id` share links
- Implement public user DTO (username only; no PII leaks)
- Add unique, URL-safe usernames
- Preserve guest-mode access to public shares

**Dependencies:** QW1 (React Router), QW3 (visibility enum), QW4 (public user DTO)

### Phase 52: Shareable Designs UI (Weeks 4–5)
**Outcome:** Share buttons live; practitioners can share any design.

- Add **Share** button to Talisman, Solomonic Circles, Ritual Space, Tree Note
- Generate QR codes + copy-link modal
- Render public view (read-only, responsive)
- Deep-link back to editor for logged-in visitors

**Success metric:** ≥50% of users toggle at least one design to shared; ≥10 public artifacts

### Phase 53: Observability (Weeks 5–6, parallel)
**Outcome:** Baseline metrics before scaling.

- Slow-route logging + usage stats
- Schema audit (N+1 queries, indexes)
- Error tracking setup

**Success metric:** Top-3 slow routes identified; all endpoints tracked

### Phase 54: Cloud Sync & Multi-Device (Weeks 7–9)
**Outcome:** Save on desktop, load on mobile seamlessly.

- Sync profile + preferences on login
- Conflict resolution (server-wins for journal, client-confirm for designs)
- Sync status indicator in header
- Test end-to-end: desktop → mobile → desktop

**Success metric:** &lt;1s sync time; seamless journal access from any device

### Phase 55: PWA & Offline-First (Weeks 10–12)
**Outcome:** Offline journal survives app restart; auto-syncs when reconnected.

- Service Worker + IndexedDB for local journal drafts
- Offline divination/ritual tracking (already client-side; add local storage)
- Auto-sync on reconnect (batched, handles conflicts)
- Offline sync status badge
- PWA audit pass

**Success metric:** Offline journal survives restart; syncs within 5 min of reconnect

---

## Timeline & Effort

| Phase | Duration | Effort | Blocker |
|-------|----------|--------|---------|
| Quick Wins (QW1–QW4) | 1–2 weeks | Low | None |
| Phase 51 (P1–P5) | 2–3 weeks | Medium | QW1, QW3, QW4 |
| Phase 52 (UI) | 1–2 weeks | Medium | Phase 51 P1–P2 |
| Phase 53 (Observability) | 1 week | Low | None (parallel to 52) |
| Phase 54 (Sync) | 2–3 weeks | Medium | Phase 53 |
| Phase 55 (Offline) | 2–3 weeks | Medium | Phase 54 |

**Total:** ~10–14 weeks sequential; ~7–9 weeks if parallel phases run together.

---

## Key Architectural Decisions

### 1. Privacy by Default
All designs start **private** (owner only). Users opt-in to share via toggle button.

### 2. Artifact-Oriented (Not Feed)
Share links for designs only. No general social feed, comments, followers, or reputation in MVP.

- Deferred: S3+ phases (comments, follows, opt-in shared journal)

### 3. No Real-Time Sockets
Batch sync, no Redis needed. Fits current single-Express architecture.

### 4. Guest-Friendly
Guests can view public/unlisted shares without login. Logging in enables editing.

### 5. PII-Safe
Public profiles expose **only** username (+ future traditions/avatar). Never email, birth data, or location.

---

## Documentation Delivered

### Planning Docs
- **plan.md** — Full Option A roadmap (50+ sections, 28 todos, risk table)
- **QUICK-WINS-SUMMARY.md** — QW1–QW4 overview + timeline

### Implementation Guides (Ready to Code)
- **QW1-ROUTER-UPGRADE.md** — React Router v6.4+ migration (3-phase strategy)
- **QW2-JOURNAL-AUDIT.md** — Schema review checklist + audit template
- **QW3-VISIBILITY-ENUM.md** — Privacy model + migration script + sample model
- **QW4-PUBLIC-DTO.md** — User serializer + PII isolation tests

### Tracked Todos (SQL)
- 28 todos across phases + quick wins
- Dependency graph (Phase 52 blocks on Phase 51, etc.)
- Ready for Copilot task planning

---

## Success Criteria (End of Phase 55)

| Phase | Success Metric |
|-------|---|
| 51–52 | ≥50% of users share at least one design; ≥10 public artifacts |
| 53 | All endpoints logged; top-3 slow routes identified |
| 54 | &lt;1s sync time; seamless multi-device journal access |
| 55 | Offline journal survives app restart; PWA audit passes |

---

## Non-Goals (For Now)

- ❌ Comments, likes, or followers (S3+)
- ❌ Public gallery or trending algorithms (S2+)
- ❌ Real-time chat or sockets (separate product)
- ❌ Monetization or premium features
- ❌ User reputation or karma systems
- ❌ Activity feed or notifications

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| **Scope creep** (features expand beyond S1) | High | High | Define "artifact-only"; defer S3+; review PRs strictly |
| **Data consistency bugs** (sync conflicts) | Medium | High | Phase 54 spike on IndexedDB; integration tests before launch |
| **Performance regression** | Medium | Medium | Phase 53 observability baseline; perf tests in CI |
| **URL routing breaks SPA** | Low | Medium | Cold-load tests on share URLs before launch |
| **PII leakage** in social features | Low | High | Unit tests verify no email/natal/location in responses |

---

## Handoff Instructions

1. **Share this doc** with the team (option-a-summary.md)
2. **Kick off Week 1:**
   - Begin QW1 (React Router upgrade) — should be parallel to Phase 51 P1 prep
   - Assign QW2 audit (JournalEntry review)
   - Prepare Phase 51 P1 work (visibility field) — templates in QW3
3. **Sync weekly** on:
   - QW1 progress (route definition + SharePage skeleton)
   - QW3 migration script testing
   - Phase 51 P1 schema updates
4. **Defer decisions** (not blocking):
   - Traditions taxonomy (can add later in S1)
   - User avatar design (can defer to Phase 52)
   - Public gallery UI (defer to S2)

---

## Questions for the Team

Before starting:

1. ✅ Are we committing to Option A (social first)? **APPROVED**
2. ❓ Should usernames be auto-generated or user-entered? (default: user-entered with auto-fallback)
3. ❓ Traditions taxonomy: hierarchical (e.g., "Western Hermetic > GD") or flat? (defer to Phase 52)
4. ❓ QR code library preference: qrcode.js, qr-code-styling, or custom SVG? (defer to Phase 52 UI)
5. ❓ Offline IndexedDB limit: 500 entries per type or more? (recommend: 500 for storage efficiency)

---

## Next Steps

**This Week:**
- [ ] Team reviews and approves plan
- [ ] QW1 assigned (React Router upgrade begins)
- [ ] QW2 auditor assigned (JournalEntry review)

**Week 1–2:**
- [ ] QW1: React Router installed + routes defined
- [ ] QW2: Audit report completed
- [ ] QW3: Visibility enum + migration script ready
- [ ] QW4: Public user DTO drafted + unit tests written

**Week 3:**
- [ ] Phase 51 P1: Visibility field added to 6 models
- [ ] Phase 51 P2: Public read routes working
- [ ] Phase 51 P3–P5: User DTO + usernames + guest audit
- [ ] Phase 52 begins: Share buttons drafted

---

**Status: READY FOR IMPLEMENTATION** ✓

All documentation complete. No blockers. Assign team members and begin Week 1.
