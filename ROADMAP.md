# Ananael Roadmap

Phased plan for sidebar modules beyond Phase 1 (JWT auth + Tarot).

**Priority:** calculation tools first → I Ching → Tree of Life + Ritual Space Planner.

## Status legend

| Status   | Meaning                                              |
|----------|------------------------------------------------------|
| Active   | Full module shipped                                  |
| Shell    | Navigable placeholder; Soon badge still shown        |
| Planned  | Documented for a future phase; not started           |

## Module overview

| Module               | Status | Phase        |
|----------------------|--------|--------------|
| Tarot                | Active | 1            |
| Gematria             | Shell  | 2a           |
| Planetary Hours      | Shell  | 2b           |
| Script Translator    | Shell  | 2c           |
| I Ching              | Shell  | 3            |
| Tree of Life         | Shell  | 4a           |
| Ritual Space Planner | Shell  | 4b           |

---

## Phase 1 — Shipped

JWT authentication and Virtual Tarot (Single / Three-Card / Celtic Cross), Docker Compose / Portainer packaging.

---

## Phase 1.5 — Foundation (shells)

Clickable module shells for every Coming Soon item. Each unfinished module keeps a **Soon** badge until its **Done when** criteria below are met. No feature APIs in this phase.

---

## Phase 2 — Calculation & correspondence tools

Ship in this order within the phase.

### 2a — Gematria

- Calculator UI: text input, system select (Hebrew ordinal / reduced / sofit; Greek isopsephy; English simple / Agrippa-style), live total + per-letter breakdown
- Static tables in `client/src/data/gematria*.ts`
- Optional: `POST /api/gematria/save` for authenticated history

**Done when:** Soon badge off; guest use works; signed-in users can save queries.

### 2b — Planetary Hours

- Location + date/time inputs (browser geolocation optional)
- Sunrise/sunset–based diurnal/nocturnal hour table, current hour highlight, planetary day ruler
- Pure TS utility (e.g. `client/src/lib/planetaryHours.ts`); document attribution
- Optional later: `POST /api/planetary/save` for bookmarked charts

**Done when:** accurate table for a known lat/lon/date; clear current-hour state.

### 2c — Script Translator

- Bidirectional transliteration (Latin ↔ Hebrew / Greek / runes as v1 set); copy button
- Script mapping only — not semantic translation
- Mapping tables in `client/src/data/scripts/`; reuse alphabets with Gematria where possible

**Done when:** round-trip transliteration for the v1 script set; Soon badge off.

**Shared:** reuse auth middleware for any save endpoints; prefer client-side calculation for deterministic tools.

---

## Phase 3 — I Ching

- Yarrow / three-coin simulation, hexagram + changing lines, primary & relating hexagram
- King Wen text excerpts (static `client/src/data/iching.ts`)
- Notes + save like Tarot
- `POST /api/iching/save`, `GET /api/iching/history`
- Same pass: backfill `GET /api/tarot/history` for consistent profile history

**Done when:** full cast → interpret → save loop; Soon badge off.

---

## Phase 4 — Visual / spatial modules

### 4a — Tree of Life

- Interactive SVG (10 sephiroth + 22 paths); click for correspondences (Hebrew letter, tarot trump, planet/element)
- GD-leaning defaults; deep-link to Tarot / Gematria where IDs align
- Optional saved study notes per node

### 4b — Ritual Space Planner

- Canvas/grid altar layout: tools (candle, cup, blade, incense, quarters), compass rose
- Export PNG/JSON; templates (LBRP circle, altar cross)
- `POST/GET /api/ritual/layouts` for authenticated persistence

**Done when:** create / edit / save / reload a layout; Soon badge off (last Coming Soon cleared).

---

## Cross-cutting rules

- Flip module `status` from `soon` → `active` in the sidebar only when that module’s **Done when** criteria are met
- Prefer client-side calculation for deterministic tools; Express for auth-bound persistence only
- Preserve existing gold/violet occult visual language
- Keep Docker Compose / single-port SPA serving unchanged
