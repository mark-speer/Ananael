# Ananael Roadmap

Phased plan for sidebar modules beyond Phase 1 (JWT auth + Tarot).

**Priority:** calculation tools first → I Ching → Tree of Life + Ritual Space Planner → Solomonic Circles.

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
| Gematria             | Active | 2a           |
| Planetary Hours      | Active | 2b           |
| Script Translator    | Active | 2c           |
| I Ching              | Active | 3            |
| Tree of Life         | Active | 4a           |
| Ritual Space Planner | Active | 4b           |
| Solomonic Circles    | Active | 5            |

---

## Phase 1 — Shipped

JWT authentication and Virtual Tarot (Single / Three-Card / Celtic Cross), Docker Compose / Portainer packaging.

---

## Phase 1.5 — Foundation (shells) — Shipped

Clickable module shells for every Coming Soon item. Each unfinished module keeps a **Soon** badge until its **Done when** criteria below are met. Mobile module switch included. No feature APIs in this phase.

---

## Phase 2 — Calculation & correspondence tools — Shipped

Ship in this order within the phase.

### 2a — Gematria — Shipped

- Calculator UI: text input, system select (Hebrew ordinal / reduced / sofit; Greek isopsephy; English simple / Agrippa-style), live total + per-letter breakdown
- Static tables in `client/src/data/gematria/`
- `POST /api/gematria/save` for authenticated history

**Done when:** Soon badge off; guest use works; signed-in users can save queries.

### 2b — Planetary Hours — Shipped

- Location + date/time inputs (browser geolocation optional)
- Sunrise/sunset–based diurnal/nocturnal hour table, current hour highlight, planetary day ruler
- Pure TS utility (`client/src/lib/planetaryHours.ts`); NOAA solar calculator attribution in file header
- Optional later: `POST /api/planetary/save` for bookmarked charts

**Done when:** accurate table for a known lat/lon/date; clear current-hour state.

### 2c — Script Translator — Shipped

- Bidirectional transliteration (Latin ↔ Hebrew / Greek / runes as v1 set); copy button
- Script mapping only — not semantic translation
- Mapping tables in `client/src/data/scripts/`; reuse alphabets with Gematria where possible

**Done when:** round-trip transliteration for the v1 script set; Soon badge off.

**Shared:** reuse auth middleware for any save endpoints; prefer client-side calculation for deterministic tools.

---

## Phase 3 — I Ching — Shipped

- Yarrow / three-coin simulation, hexagram + changing lines, primary & relating hexagram
- King Wen text excerpts (static `client/src/data/iching.ts`)
- Notes + save like Tarot
- `POST /api/iching/save`, `GET /api/iching/history`
- Same pass: backfill `GET /api/tarot/history` for consistent profile history
- Recent history panels in I Ching and Tarot when signed in

**Done when:** full cast → interpret → save loop; Soon badge off.

---

## Phase 4 — Visual / spatial modules — Shipped

### 4a — Tree of Life — Shipped

- Interactive SVG (10 sephiroth + 22 paths); click for correspondences (Hebrew letter, tarot trump, planet/element)
- GD-leaning defaults; deep-link to Tarot / Gematria where IDs align
- Optional saved study notes per node (`POST/GET /api/tree/notes`)

**Done when:** interactive glyph with clickable sephiroth/paths; Soon badge off; signed-in notes save/reload.

### 4b — Ritual Space Planner — Shipped

- Canvas/grid altar layout: tools (candle, cup, blade, incense, quarters), compass rose
- Export PNG/JSON; templates (LBRP circle, altar cross)
- `POST/GET /api/ritual/layouts` for authenticated persistence; `PUT /api/ritual/layouts/:id` for edit/reload

**Done when:** create / edit / save / reload a layout; Soon badge off (last Coming Soon cleared).

---

## Phase 5 — Solomonic Circles (magician’s circle) — Shipped

Parametric SVG circle builder (same UX family as Ritual Space: preview, PNG/JSON export, auth save).

- Tradition selector: **Goetia**, **Heptameron** (weekday name banks), **Generic** (blank editable rings)
- Concentric rings with curved text, compass, optional hexagram/pentagram, inner square
- All ring text user-editable after preset load; Goetia Latin ↔ Hebrew name toggle
- `POST/GET /api/solomonic/circles`, `PUT /api/solomonic/circles/:id`

**Done when:** tradition presets load and edit; SVG with ring text + directions; PNG/JSON export; signed-in save/edit/reload.

---

## Phase 6 — Solomonic Circles (Goetia conjuration) — Planned

Same sidebar module (`solomonic`); deepen Phase 5 canvas:

- Ars Goetia spirit catalog (static: number, name, rank, seal reference)
- Triangle of Art geometry + placement relative to the circle
- Seal/sigil slot for the selected spirit
- Conjuration layout templates; optional deeper Heptameron day/hour coupling
- Extend save schema with `spiritId`, triangle, and seal fields

**Done when:** pick a spirit → circle + Triangle of Art + seal layout; save/reload includes spirit fields.

---

## Cross-cutting rules

- Flip module `status` from `soon` → `active` in the sidebar only when that module’s **Done when** criteria are met
- Prefer client-side calculation for deterministic tools; Express for auth-bound persistence only
- Preserve existing gold/violet occult visual language
- Keep Docker Compose / single-port SPA serving unchanged
