# Ananael Roadmap

Phased plan for sidebar modules beyond Phase 1 (JWT auth + Tarot).

**Priority:** calculation tools first → I Ching → Tree of Life + Ritual Space Planner → Solomonic Circles → Magical Journal → Magical OS.

## Status legend

| Status   | Meaning                                              |
|----------|------------------------------------------------------|
| Active   | Full module shipped                                  |
| Shell    | Navigable placeholder; Soon badge still shown        |
| Planned  | Documented for a future phase; not started           |

## Module overview

| Module               | Status  | Phase        |
|----------------------|---------|--------------|
| Tarot                | Active  | 1 (in Divination) |
| Gematria             | Active  | 2a           |
| Celestial Timing     | Active  | 2b+ / 13     |
| Script Translator    | Active  | 2c           |
| I Ching              | Active  | 3 (in Divination) |
| Tree of Life         | Active  | 4a           |
| Ritual Space Planner | Active  | 4b           |
| Solomonic Circles    | Active  | 5–6          |
| Magical Journal      | Active  | 7            |
| Magical OS Dashboard | Active  | 8            |
| Divination portal    | Active  | 9–11         |
| Geomancy             | Active  | 10 (tab)     |
| Runes                | Active  | 11 (tab)     |
| Talisman Atelier     | Active  | 12           |
| Elections            | Active  | 13 (timing)  |
| Enochian             | Active  | 14           |
| Ritual Library       | Active  | 15–16        |

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

### 2b — Celestial Timing (was Planetary Hours) — Shipped / expanded

- Location + date/time inputs (browser geolocation optional)
- Sunrise/sunset–based diurnal/nocturnal hour table, current hour highlight, planetary day ruler
- Pure TS utility (`client/src/lib/planetaryHours.ts`); NOAA solar calculator attribution in file header
- Ephemeris via `astronomy-engine`: Sun–Pluto longitudes, retrogrades, altitude; moon phase from the library
- Western tropical, Hindu sidereal (Lahiri + Moon nakshatra), Chinese sexagenary pillars (year/month/day/hour)
- Module UI: Hours / Planets / Zodiac panels (`CelestialTimingModule`); Magical OS + journal sky tags enriched
- Optional later: `POST /api/planetary/save` for bookmarked charts

**Done when:** accurate hour table for a known lat/lon/date; clear current-hour state; ephemeris + three zodiac systems visible.

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

## Phase 6 — Solomonic Circles (Goetia conjuration) — Shipped

Same sidebar module (`solomonic`); deepens Phase 5 canvas:

- Ars Goetia spirit catalog (static: number, name, rank, seal reference)
- Triangle of Art geometry + placement relative to the circle
- Seal/sigil slot for the selected spirit (labeled frame + `sealRef`)
- Conjuration layout template on spirit select; triangle bearing (N/E/S/W)
- Save schema extended inside `config`: `spiritId`, `showTriangle`, `triangleBearing`, `showSeal`

**Done when:** pick a spirit → circle + Triangle of Art + seal layout; save/reload includes spirit fields.

---

## Phase 7 — Magical Journal — Shipped

Auth-gated unified journal as the shared notes / history layer (not the homepage).

- Entry types: ritual, dream, divination, mood, working, note
- Moon phase + planetary day/hour auto-tags, plus Sun sign / nakshatra / Chinese day pillar (`client/src/lib/moonPhase.ts`, `journalSky.ts`, Celestial Timing location)
- Entity tags searchable via Liber 777 / Goetia vocabulary
- Tarot / I Ching **Save** writes journal divination entries; module history panels retired in favor of Journal deep-links
- Idempotent migration of legacy `TarotReading` / `IChingCast` into `JournalEntry` on journal load
- `POST/GET/PATCH/DELETE /api/journal/entries`, `POST /api/journal/migrate`

**Done when:** signed-in CRUD + search; new divinatory saves appear in journal; legacy readings migrated; moon/hour tags when location available; journal is not the default module.

---

## Phase 8 — Magical Operating System — Shipped

Unified dashboard centerpiece (default home) composing:

- Current planetary hour
- Moon and astrological conditions
- Quick tarot draw
- Open Magical Journal
- Correspondences access
- Ritual builder entry
- Track ongoing workings (`working` entries with status)

Modules remain individually navigable; the dashboard interconnects them and shares correspondence context automatically.

**Done when:** dashboard is the default home; each tile deep-links into live modules; active workings surface from journal.

---

## Phase 9 — Divination portal — Shipped

Single sidebar **Divination** module with tabs wrapping Tarot and I Ching (legacy `tarot` / `iching` ModuleIds redirect). Magical OS / Tree / Correspondences deep-link via `divinationTab`.

**Done when:** Tarot and I Ching cast/save work from tabs; deep-links open the correct tab.

---

## Phase 10 — Geomancy — Shipped

Geomancy tab: random/manual mothers, full chart (daughters, nephews, witnesses, judge, reconciler), `POST /api/geomancy/save` → journal `payload.system: 'geomancy'`.

**Done when:** cast → interpret → signed-in save in Journal divination filter.

---

## Phase 11 — Rune casting — Shipped

Elder Futhark tab: single / Norns / five-rune cross; `POST /api/runes/save` → journal `payload.system: 'runes'`.

**Done when:** cast → meanings → save; Divination tabs are Tarot | I Ching | Geomancy | Runes.

---

## Phase 12 — Talisman Atelier — Shipped

Planetary kamea + planetary/chaos sigils; PNG/JSON export; `POST/GET/PUT /api/talisman/designs`.

**Done when:** build kamea and both sigil modes; export; signed-in save/reload.

---

## Phase 13 — Electional calendar — Shipped

Celestial Timing **Elections** panel: day/hour/moon/retrograde filters over the next seven days; Magical OS / Ritual Library deep-link via `planetaryPanel: 'elections'`.

**Done when:** filters yield explainable upcoming windows for lat/lon.

---

## Phase 14 — Enochian — Shipped

Elemental tablet samples + Calls reader; notes via `POST/GET /api/enochian/notes`; deep-links to Gematria / Correspondences / Translator.

**Done when:** browse tablets + Calls; notes save when signed in.

---

## Phase 15 — Ritual Library — Shipped

Searchable liturgy corpus; suggested Elections deep-link; “Log working” → journal `working` entry; links to Ritual Space / Solomonic where relevant.

**Done when:** browse/search rites; signed-in log working; Magical OS deep-link present.

---

## Phase 16 — Ritual Library expansion — Shipped

Deepen the Phase 15 corpus and broaden traditions:

- Schema: `purpose`, `notes`, `sources`; `ritualTemplate` aligned to Ritual Space `TemplateId` (`lbrp` | `altarCross` | `blank`)
- Expanded outlines for LBRP, Middle Pillar, LHRP; Solomonic forms with public-domain–style excerpts (Heptameron orison / angel of the day / circle consecration; Goetia conjuration, constraint, license)
- Added GD: SIRP, Rose Cross, Opening by Watchtower (condensed); daily/general: Liber Resh–style solar adorations, tool consecration
- UI: tradition-grouped list; purpose / notes / sources in detail pane; Ritual Space deep-link applies matching template
- `GET /api/liturgy/rites` catalog synced to the full id set

**Done when:** ~14 searchable rites with expanded steps; notes/sources visible; template deep-link works; docs/catalog updated.

---

## Cross-cutting rules

- Flip module `status` from `soon` → `active` in the sidebar only when that module’s **Done when** criteria are met
- Prefer client-side calculation for deterministic tools; Express for auth-bound persistence only
- Preserve existing gold/violet occult visual language
- Keep Docker Compose / single-port SPA serving unchanged
