# Ananael Roadmap

For codebase structure, module wiring, and contributor conventions, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). For bundled third-party plates, see [docs/ART-CREDITS.md](docs/ART-CREDITS.md). For a potential future share/lodge layer (not started), see [docs/SOCIAL-ROADMAP.md](docs/SOCIAL-ROADMAP.md).

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
| Celestial Timing     | Active  | 2b+ / 13 / 17 / 22 / 26–29 |
| Script Translator    | Active  | 2c           |
| I Ching              | Active  | 3 / 40 (in Divination) |
| Tree of Life         | Active  | 4a / 24      |
| Ritual Space Planner | Active  | 4b (in Atelier) |
| Solomonic Circles    | Active  | 5–6 / 21 / 41 (in Atelier) |
| Magical Journal      | Active  | 7            |
| Magical OS Dashboard | Active  | 8 / 24 / 30  |
| Divination portal    | Active  | 9–11         |
| Geomancy             | Active  | 10 / 40 (tab) |
| Runes                | Active  | 11 / 40 (tab) |
| Talismans            | Active  | 12 (in Atelier) |
| Elections            | Active  | 13 (timing)  |
| Enochian             | Active  | 14 / 50      |
| Ritual Library       | Active  | 15–16 / 18 / 25 |
| Magical Almanac      | Active  | 17 (timing + OS) |
| Hermetic Alchemy hooks | Active | 18 (cross-module) |
| Athanor              | Active  | 19 / 23          |
| Docs sync            | Active  | 20           |
| Goetia seal artwork  | Active  | 21 / 41      |
| Timing chart bookmarks | Active  | 22         |
| Athanor deepen       | Active  | 23           |
| Cross-module polish  | Active  | 24           |
| Ritual Runner        | Active  | 25           |
| Eastern Ritual Library | Active | 31         |
| Subtle Body corpus   | Active  | 32           |
| Subtle Body bridge   | Active  | 33           |
| Subtle Body module   | Active  | 34           |
| Eastern OS polish    | Active  | 35           |
| Eastern timing deepen | Active | 36           |
| Eastern liturgy expand | Active | 37          |
| Neidan Athanor bridge | Active | 38          |
| Mantra script tools  | Active  | 39           |
| Divination SVG glyphs | Active | 40           |
| Goetia Mathers plates | Active | 41           |
| Shamanism corpus     | Active  | 45           |
| Shamanism bridge     | Active  | 46           |
| Shamanism module     | Active  | 47           |
| Shamanism OS polish  | Active  | 48           |
| Atelier portal       | Active  | 49           |

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
- Chart bookmarks: see Phase 22 (`POST/GET/PUT /api/planetary/charts`)

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

## Phase 17 — Magical Almanac — Shipped

Month calendar and day counsel through a magical lens, shared between Magical OS and Celestial Timing.

- Client lib `client/src/lib/almanac.ts`: month day summaries, day counsel (day ruler + moon themes), season/lunation markers
- Ephemeris helpers: equinoxes/solstices + quarter lunations via `astronomy-engine`
- Celestial Timing **Almanac** panel: navigable month grid, selected-day counsel, hour hints, deep-links to Hours / Elections / Ritual Library / Journal
- Magical OS Almanac tile + Sky clock Almanac / Elections deep-links (`planetaryPanel: 'almanac'`)

**Done when:** Almanac panel + Magical OS tile; month grid; day counsel; season + lunation markers; deep-link opens Almanac tab.

---

## Phase 18 — Hermetic Alchemy Hooks — Shipped

Shared alchemy layer woven into Almanac, Correspondences, Journal, Ritual Library, and Talisman.

- Client data/lib `client/src/data/alchemy.ts` + `client/src/lib/alchemy.ts`: planet↔metal, Tria Prima, opus stages, `operationForDay`, Scale of Nature helpers
- Mercury principle available under Solomonic center glyph Principles group
- Almanac `DayCounsel` adds operation / stage / axiom; Magical OS + Celestial Timing show **Operation**
- Correspondences: `metal` facet + principle/stage detail hints
- Journal entity kinds: `metal`, `principle`, `opusStage` with suggestions
- Ritual Library: Alchemy tradition (vessel, Tria Prima, solve et coagula, metal of the day) + server catalog sync
- Talisman Atelier: classical metal labels beside planetary kamea selector

**Done when:** shared alchemy lib; almanac operation line on OS + Almanac panel; metal facet; journal metal/principle/stage suggestions; Alchemy liturgy tradition; Talisman metal labels.

---

## Phase 19 — Athanor / Opus — Shipped

Dedicated hermetic alchemy chamber consuming the Phase 18 alchemy layer.

- Sidebar module `opus` labeled **Athanor**; App deep-links (`opusPane`, `stageId`, `metal`)
- Client UI `client/src/components/AlchemyModule.tsx`: **Stages** (opus map + Scale of Nature), **Vessel** (intent/materia/stage planner → Journal / Talisman / Correspondences / Almanac), **Emblem** (Emerald Tablet, Hermetica outlines, stage emblems)
- Magical OS Athanor tile with today’s stage / metal / principle + Vessel / Emblem shortcuts
- Splash feature card for Athanor

**Done when:** sidebar Active; three panes; Magical OS tile; Vessel → Journal/Talisman/Correspondences deep-links; Emblem study content.

---

## Phase 20 — Docs & roadmap sync — Shipped

Bring README / ROADMAP in line with shipped Phases 18–19 and document Phases 20–23.

- README intro through Phase 19; Modules table includes Athanor and alchemy-aware Correspondences / Talisman / Ritual Library
- ROADMAP module overview + Phase 20–23 sections
- Splash copy verified for Athanor (Phase 19)

**Done when:** README matches shipped modules through Athanor; ROADMAP documents Phases 20–23.

---

## Phase 21 — Goetia seal artwork — Shipped

Replace the monospace `sealRef` label in Solomonic Circles with seal graphics.

- Assets at `client/public/assets/Images/Goetia/{sealRef}.svg`, keyed by `arsGoetia.ts` `sealRef`
- Simplified public-domain–style line-art SVGs for all 72 spirits (`lib/goetiaSealArt.ts` + generate script); missing file falls back to labeled frame
- `SolomonicCircleModule` seal slot renders artwork; PNG export inlines seal images
- No schema change — `spiritId` / `showSeal` already persist

**Done when:** Seal On shows artwork (not `sealRef` text); PNG/JSON export and save/reload work; graceful fallback if an asset is absent.

---

## Phase 22 — Celestial Timing chart bookmarks — Shipped

Auth-gated save/reload for timing charts.

- Model `PlanetaryChart` + `POST/GET /api/planetary/charts`, `PUT /api/planetary/charts/:id`
- `config`: `{ lat, lon, datetime, panel?, elections?, almanacCursor? }`
- Celestial Timing UI: Save / recent list / load (signed-in); restore location + datetime + panel + election filters
- Profile location (`PUT /api/auth/location`) unchanged for Magical OS / journal sky

**Done when:** signed-in user can bookmark a chart and reload it; guest use unchanged.

---

## Phase 23 — Deepen Athanor — Shipped

Vessel persistence, opus progress from journal, richer Emblem corpus.

- `OpusVessel` model + `POST/GET/PUT /api/opus/vessels` with `config: { intent, materiaMetal, targetStageId }`
- Vessel pane: Save / reload; keep Log working → journal
- Stages pane: active journal `working` entries tagged `opus` / `opusStage`
- Expanded Emerald Tablet / Hermetica / stage emblem static content
- Magical OS Athanor tile reflects saved vessels or active opus workings

**Done when:** signed-in vessel save/reload; Stages shows active opus workings; Emblem content expanded; Magical OS reflects progress.

---

## Phase 24 — Cross-module polish — Shipped

Finish Magical OS deep-links, unify search/export patterns, and fix mobile UX gaps.

- Magical OS: study tools (Gematria / Translator / Tree); sky metrics → Hours / Planets / Zodiac; full Divination tabs; Athanor with day’s `stageId` / `metal`; Correspondences mini-search + prefill; active working → `entryId`; Ritual Space opens with LBRP template
- Shared `client/src/lib/svgExport.ts`; Ritual / Solomonic / Talisman / Tree export PNG + JSON with consistent labels
- Journal + Ritual Library search chrome aligned with Correspondences (incl. tradition chips)
- Mobile module `<select>` grouped with shorter labels; Enochian tablet scrolls/scales on narrow phones
- Removed unused `ModuleShell`

**Done when:** Magical OS opens every sidebar module with meaningful opts; shared export helper + Tree PNG/JSON; search chrome aligned; mobile select grouped; Enochian usable at ~360px width.

---

## Phase 25 — Ritual Runner — Shipped

Guided practice mode inside Ritual Library (no new sidebar module).

- **Start run** on any rite: focused step checklist, progress bar, live planetary day/hour strip (highlights when hour matches `suggestedPlanet`)
- Signed-in: `POST` journal `working` with `payload.system: 'ritual-runner'`; step/pause/complete via `PATCH`; Complete writes step log + notes + `skyEnd`
- Guests: in-memory run only (no localStorage resume)
- Magical OS: runner workings show **Resume** → Ritual Library run mode (`riteId` + `runEntryId`)
- Keep one-shot **Log working** for offline practice dumps
- Client: `client/src/lib/ritualRunner.ts`, `RitualRunnerPanel.tsx`

**Done when:** Start → step → Complete for guest and signed-in; Magical OS Resume restores mid-rite; sky strip + suggested-planet match; browse + Log working unchanged.

---

## Phase 26 — Natal birth profile + panel foundation — Shipped

Birth data persistence and Celestial Timing **Natal** panel (no separate birthday calculator).

- `User.natal` + `PUT /api/auth/natal`; AuthContext + guest `localStorage` (`natalProfile.ts`)
- Timing panel `natal`: birth date/time/place form; summary (tropical Sun/Moon, Chinese year/pillars, hermetic ruler + 777 stones, modern month birthstones, Lahiri/nakshatra)
- Correspondences deep-link from sun sign / positions
- Unknown time → local noon with banner; houses/wheel gated on time + place

**Done when:** Natal tab; save birth profile (guest + account); summary fields visible.

---

## Phase 27 — Natal planets + major aspects — Shipped

- Positions Sun–Pluto at birth moment (`natalChart.ts` / ephemeris)
- Major aspects (☌ ⚹ □ △ ☍) with orbs 8° lights / 6° others
- Natal panel Positions + Aspects tables

**Done when:** positions + aspects for any birth date (noon if time unknown).

---

## Phase 28 — Ascendant + Whole Sign houses — Shipped

- Ascendant from GAST + latitude (`ascendantLongitude`)
- Whole Sign houses (house 1 = Asc sign); planet-in-house column
- CTA when time/place missing (no fake Asc)

**Done when:** Asc + 12 houses with complete birth data.

---

## Phase 29 — Natal chart wheel — Shipped

- SVG wheel: signs, house numbers, planet glyphs, aspect lines (`NatalChartWheel.tsx`)
- Export PNG / JSON via `svgExport`
- Defines **full natal** for Magical OS / Almanac personalization gate

**Done when:** wheel renders for full birth data; export works.

---

## Phase 30 — Almanac + Magical OS natal personalization — Shipped

Personalization only when a full natal exists (date + time + place + houses/wheel).

- Almanac: birthday / resonance day highlights; day counsel **Natal affinity** line
- Magical OS: Natal chart tile + affinity on Almanac tile; soft election hint; deep-link `planetaryPanel: 'natal'`
- Date-only profiles do not trigger personalization

**Done when:** full-natal users see personalized Almanac + OS tile; others unchanged.

---

## Phase 31 — Eastern Ritual Library — Shipped

- Six Yoga/Taoist rites in `client/src/data/liturgy.ts`
- Traditions `Yoga` and `Taoist` in `LITURGY_TRADITION_ORDER`
- Server catalog mirror in `server/src/routes/liturgy.ts`

**Done when:** All rites browsable, runnable, and resumable from Magical OS active workings.

---

## Phase 32 — Subtle Body Data Corpus — Shipped

- `client/src/data/chakras.ts`, `meridians.ts`, `subtleBodyMaps.ts`
- Journal entity kinds: `chakra`, `meridian`, `dantian`

**Done when:** Data exports compile; journal schema accepts new entity kinds.

---

## Phase 33 — Correspondence Bridge — Shipped

- `chakra` and `meridian` facets in Correspondences encyclopedia
- I Ching trigram ↔ meridian bridges; Tree comparative chakra panel

**Done when:** Subtle-body search and cross-links work across modules.

---

## Phase 34 — Subtle Body Module — Shipped

- `SubtleBodyModule.tsx` — atlas, meridians, maps, neidan study
- Sidebar `subtleBody`; Ritual Runner hold timers (`durationSec`)

**Done when:** Module navigable; rite launchable from atlas.

---

## Phase 35 — Eastern Cross-Module Polish — Shipped

- Magical OS Subtle Body tile; almanac `subtleBodyTheme` counsel
- Splash features updated

**Done when:** Timing → Subtle Body → Run rite path is live on Magical OS.

---

## Phase 36 — Eastern Timing Deepening — Shipped

- `client/src/data/nakshatraChakras.ts` — 27-entry nakshatra ↔ chakra study map
- `client/src/lib/subtleBodyCounsel.ts` — counsel, natal affinity, contextual rite suggestion
- Celestial Timing Hours panel: meridian peak column + banner
- Elections: `practice` filter (`meridian-peak`, `yin-moon`)
- Almanac / Magical OS: nakshatra + Chinese pillar hints; natal subtle-body affinity

**Done when:** Hours table shows meridian peaks; full-natal users see subtle-body affinity; OS suggests contextual Eastern rite.

---

## Phase 37 — Eastern Liturgy Expansion — Shipped

- Six new rites: Buddhist (anapanasati, metta), kapalabhati, wu-qin-xi, six-healing-sounds, middle-pillar-east bridge
- `Buddhist` tradition in `LITURGY_TRADITION_ORDER`
- `relatedChakras` / `relatedMeridians` on all Eastern rites; `durationSec` on movement/hold steps

**Done when:** ≥11 Eastern-family rites; hold timers on ≥4 rites; server catalog synced.

---

## Phase 38 — Neidan ↔ Athanor Bridge — Shipped

- `NEIDAN_OPUS_MAP` in `subtleBodyMaps.ts`; cross-links in Subtle Body neidan pane + Athanor Stages
- `dantian` Correspondences facet
- `PracticeVessel` model + `POST/GET/PUT /api/practice/vessels`
- Subtle Body **Practice** pane: save/reload vessel, log working

**Done when:** Neidan↔opus visible in both modules; dantian searchable; signed-in vessel save/reload works.

---

## Phase 39 — Mantra & Script Tools — Shipped

- Sanskrit (IAST ↔ Devanagari) in Script Translator; bija deep-links from chakras
- ROADMAP + splash + ARCHITECTURE docs for Phases 36–39

**Done when:** Sanskrit round-trip for bija strings; chakra panels link to translator; docs updated.

---

## Phase 40 — Divination SVG glyphs — Shipped

Replace CSS/Unicode glyphs for I Ching, Geomancy, and Runes with shared themeable SVG generators (same pattern as Goetia seal art).

- `client/src/lib/glyphs/` — `geomancyGlyph`, `ichingGlyph`, `runeGlyph` (+ theme constants); inner markup + full SVG document helpers
- `client/src/components/glyphs/` — `GlyphFrame`, `GeomancyFigureSvg`, `HexagramSvg`, `RuneSvg`
- Modules wired: Geomancy figure cards, I Ching hexagram panels, Runes cast cards (reverse via SVG transform)
- Unicode rune characters remain in `data/runes.ts` for Script Translator
- Inline React SVG only (no `public/` assets)

**Done when:** all three non-tarot Divination systems render via SVG; cast/save UX unchanged; glyphs readable at ~360px; docs updated.

---

## Phase 41 — Mathers 1904 Goetia plates — Shipped

Replace generated seal stand-ins with gold-tinted Mathers plates where Commons quality is usable. Generated SVGs remain fallback.

- Commons map in `client/src/data/goetiaSealPlates.ts`; ingest `client/scripts/ingest-goetia-plates.py`
- Originals under `client/public/assets/Images/Goetia/mathers-1904/`; live `{sealRef}.png` gold-on-transparent
- Dual variants use `seal01`; 29 Astaroth and 69 Decarabia use PD alternates (no numbered file in that series)
- `goetiaSealAssetPath` prefers PNG; SVG fallback on 404; labeled frame if both missing
- PNG export inlines raster or SVG via `inlineExternalImages` (correct MIME)
- Credits: [docs/ART-CREDITS.md](docs/ART-CREDITS.md)

**Done when:** Seal On shows Mathers plates (gold-on-dark) for covered spirits; PNG/JSON export and save/reload work; 72 spirits accounted for in the coverage report; generated SVG fallback remains.

---

## Later art phases (Planned)

Not started. Prefer PD / CC0 plates or generated SVG; keep Ananael gold/violet language. Sequence after Phase 41:

### Phase 42 — Athanor Emblem plates — Planned

[EmblemPane](client/src/components/AlchemyModule.tsx) is text cards (`STAGE_EMBLEMS` in [alchemy.ts](client/src/data/alchemy.ts)). Curate PD *Atalanta Fugiens* / Mutus Liber plates onto the four `OpusStageId`s (`nigredo` / `albedo` / `citrinitas` / `rubedo`) and optionally the eight thematic emblems. Keep titles/gloss; add plate thumbs. Sources: Science History Institute PD Mark + Commons. Same gold-tint / credits pattern as Phase 41.

**Done when:** each opus stage (and optionally each thematic emblem) shows a credited plate; text cards remain; no schema change required.

### Phase 43 — Subtle Body / Tree atlas — Planned

Chakra pane already has a simple spine SVG; meridians are a list; Tree is interactive geometry in [TreeOfLifeModule.tsx](client/src/components/TreeOfLifeModule.tsx). Enrich diagrams (generated SVG or CC0 Commons) without breaking click/export. Prefer generate-to-theme over mismatched plate scans.

**Done when:** chakra/meridian/Tree study views use themed atlas diagrams; Tree PNG/JSON export still works.

### Phase 44 — Splash / Magical OS atmosphere — Planned

Both are CSS gradients + tiles today ([SplashPage.tsx](client/src/components/SplashPage.tsx), [DashboardModule.tsx](client/src/components/DashboardModule.tsx)). Sparing engraving crops only; brand hierarchy (Cinzel/gold/violet) stays primary. No new hero-image cards.

**Done when:** splash and Magical OS have light atmosphere art without replacing the tile launcher or brand chrome.

Suggested PD hunt for 42/44: *Atalanta Fugiens* emblems, Mutus Liber plates, spare alchemical engravings — same Commons/PD rule as 41.

---

## Phase 45 — Shamanism Data Corpus — Shipped

Static study corpora for a comparative three-worlds chamber. Not a generic indigenous kit; sources labeled on each record. No closed ceremonies or plant-medicine how-to.

- `client/src/data/shamanism/worlds.ts` — Lower / Middle / Upper with keywords, typical work, sources, comparative sephirah / chakra / dantian ids
- `client/src/data/shamanism/directions.ts` — four-quarter, six-direction, and seven-direction (center) presets
- `client/src/data/shamanism/allies.ts` — small comparative catalog (`animal` | `plant` | `spirit` | `ancestor`)
- `client/src/data/shamanism/lots.ts` — generic cleromancy lots (not a named living bone tradition)
- Journal entity kinds: `world`, `ally`, `direction`

**Done when:** Data exports compile; journal schema accepts the new entity kinds.

---

## Phase 46 — Shamanism Correspondence Bridge — Shipped

- Facets `world`, `ally`, `direction` in Correspondences encyclopedia
- Comparative axis mundi ↔ Middle Pillar / dantian strip on Tree of Life and Subtle Body Maps
- `client/src/lib/shamanism.ts` — search helpers

**Done when:** Correspondences search/filter finds shamanic keys; Tree/Subtle Body show the comparative strip.

---

## Phase 47 — Shamanism Module — Shipped

Sidebar module `shamanism` labeled **Shamanism**. Full chamber (Soon badge off).

- `ShamanismModule.tsx` panes: Worlds, Directions, Allies, Journey, Cast, Practice
- Worlds: clickable SVG axis mundi; Journey deep-link with world preselected
- Directions: tradition selector loads a labeled wheel
- Allies: searchable catalog; personal allies on the practice vessel
- Journey: intention + world + optional ally; step checklist; client-side drum; Complete → journal `working` with `payload.system: 'shamanic-journey'`; guests in-memory only
- Cast: lots (single / three-position) + pendulum log; `POST /api/shamanism/save` → journal `divination`
- Practice: reuse `PracticeVessel` with `config.system: 'shamanism'`; Subtle Body filters these out
- Glyphs: `worldTreeGlyph`, `directionWheelGlyph`, `lotGlyph` (Phase 40 pattern)

**Done when:** all six panes work; guest journey + cast; signed-in journey persist/resume and cast/vessel save; module Active.

---

## Phase 48 — Shamanism Cross-Module Polish — Shipped

- Magical OS tile: suggested world from sky, Resume journey, deep-links `shamanismPane`
- Almanac counsel line + Elections `practice` filter `journey-night`
- Ritual Library tradition `Shamanic`: quarters opening, journey protocol, grounding (generic study outlines)
- Splash + ARCHITECTURE inventory

**Done when:** Timing → Shamanism → Journal path is live on Magical OS; rites browsable; docs match shipped 45–48.

---

## Phase 49 — Atelier portal — Shipped

Single sidebar **Atelier** module with tabs wrapping Ritual Space, Solomonic Circles, and Talismans (legacy `ritual` / `solomonic` / `talisman` ModuleIds redirect). Magical OS / Ritual Library / Athanor deep-link via `atelierTab` plus existing `ritualTemplate` / `gematriaPrefill`. Inner Talismans modes remain Squares / Sigils / Sutras.

**Done when:** all three canvases work from Atelier tabs; deep-links open the correct tab; persistence APIs unchanged.

---

## Phase 50 — Enochian natal overlay — Shipped

Client-side Heptarchia + Watchtower overlay on the natal chart, plus an Enochian Hierarchy study tab. No new natal API fields. Governors remain geographic study tables (no lat/lon match). Distinct from the 777 hermetic ruler.

- `client/src/data/enochianHierarchy.ts` — seven Heptarchia courts, four Watchtower Kings + Tablet of Union + Seniors (study), 30 Aethyrs / 91 Governors with Parts-of-the-Earth labels
- `client/src/lib/enochianNatal.ts` — weekday court, Sun/ruler/rising courts, Sun/rising Watchtowers; attached as `chart.enochian`
- Natal panel: Enochian natal section + Heptarchia positions column; names deep-link `enochianTab: 'hierarchy'`
- Enochian module: Hierarchy tab (Heptarchia / Watchtowers / Aethyrs); notes `targetType: 'hierarchy'`
- Magical OS natal tile: Heptarchia day-King · Watchtower King + Hierarchy deep-link

**Done when:** natal overlay appears with a birth date; Hierarchy tab browses all three corpora; deep-links from natal names open the matching hierarchy pane; Governors note shows when birth place is set.

---

## Phase 53 — Observability — Shipped

Server request observability baseline for production diagnosis:

- Correlation IDs via the `x-request-id` response header
- Structured JSON request completion logs with method, route template, status, and duration
- Slow-request logging controlled by `OBSERVABILITY_SLOW_MS` (default 500 ms)
- In-memory top-three slow-route summaries included in `GET /api/health`

Request logs intentionally exclude bodies, cookies, query values, and other practitioner data. Metrics reset when the server restarts; durable telemetry remains a future deployment concern.

**Done when:** every request is logged with a correlation ID and duration; slow requests are distinguishable; health exposes a useful top-three route baseline; existing API behavior remains intact.

---

## Phase 54 — Sync and conflict resolution — Shipped

Add journal-entry synchronization metadata and optimistic concurrency. Each entry
has a `version` (starting at 1) and nullable `syncedAt`. Journal edits must include
the version they were based on; successful edits increment the version and stamp
the sync time. A stale edit receives HTTP 409 with the current server entry, so
the server-wins policy is explicit and clients can reload before retrying.

**Done when:** version metadata is persisted and returned by journal APIs; stale
updates cannot overwrite newer edits; successful updates advance version and
`syncedAt`; migration-created entries retain safe defaults; policy is documented.

---

## Phase 55 — Offline-first journal + installable PWA — Shipped

Bounded batch sync API plus a local-first client so the Magical Journal (and the
divination/ritual tracking that logs into it) keeps working with no connection.

- `POST /api/journal/sync` — authenticated, bounded (≤25 ops/request) batch
  endpoint for queued create/update/delete journal mutations. Every operation
  carries a client-minted `clientOpId`; replayed batches are idempotent-safe
  (a previously applied id returns its cached outcome instead of re-applying).
  Conflicts are always server-wins and reported inline per-operation — one bad
  op never aborts the rest of the batch.
- Installable PWA: `manifest.webmanifest` + a same-origin `sw.js` (network-first
  navigations, cache-first hashed assets, `/api/*` left untouched) served by
  Express alongside the existing single-port SPA — no Docker/Compose changes.
- Typed IndexedDB layer (`client/src/lib/indexedDb.ts`) backing a local-first
  journal repository (`client/src/lib/journalRepo.ts`): optimistic
  create/update/delete, an outbox that coalesces multiple offline edits into
  one net operation per entry, and reconnect + periodic background sync.
- `JournalModule`, `RitualRunnerPanel`, `ShamanismModule`, `LiturgyModule`,
  `AlchemyModule`, and the Dashboard's active-workings list all read/write
  through the repo instead of calling the journal API directly — ritual and
  divination progress tracking now survives a dropped connection, and a
  visible sync-status badge (online/offline, pending count, last synced,
  conflicts) sits in the journal header.

**Done when:** journal CRUD works fully offline and reconciles automatically on
reconnect; sync conflicts always resolve server-wins with the practitioner able
to see it happened; the app is installable and its shell loads offline; existing
UX and Docker Compose / single-port serving are unchanged.

---

## Cross-cutting rules

- Flip module `status` from `soon` → `active` in the sidebar only when that module’s **Done when** criteria are met
- Prefer client-side calculation for deterministic tools; Express for auth-bound persistence only
- Preserve existing gold/violet occult visual language
- Keep Docker Compose / single-port SPA serving unchanged
- Social / lodge work is documented separately in [docs/SOCIAL-ROADMAP.md](docs/SOCIAL-ROADMAP.md) (not started; not part of Phases 1–50)
