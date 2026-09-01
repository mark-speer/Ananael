# Ananael Social Roadmap

Potential future phases for an opt-in social / lodge layer. **Not started. Not committed to the main product plan.**

The shipped product is a **private practitioner OS**. Social work must stay small, opt-in, and artifact-oriented — not a general social network.

For current modules and done-when criteria, see [ROADMAP.md](../ROADMAP.md). For codebase structure, see [ARCHITECTURE.md](ARCHITECTURE.md).

---

## Status legend

| Status    | Meaning                                              |
|-----------|------------------------------------------------------|
| Planned   | Documented for a future phase; not started           |
| Deferred  | Feasible later; explicitly out of early social scope |
| Rejected  | Poor fit for this product / stack                    |

All phases below are **Planned** unless marked otherwise.

---

## Product stance

Ananael already has a thin social *signal*, not a social graph:

- Magical OS shows `{online} / {count} practitioners online`
- Presence via `User.lastSeenAt`, `POST /api/auth/presence`, `GET /api/auth/user-count`
- Usernames exist, but are **not unique** (only email is unique)
- Every persisted document is owner-scoped (`userId: req.userId`)
- PNG/JSON export is the current share path (file download, not a URL)
- `publicUser()` returns email, location, and natal data — **never reuse this shape for other people**

Treat social as **shared artifacts and lodges**, not Facebook-for-magicians.

**Open by default is a mistake.** Journal entries, natal profiles, and lat/lon are private practitioner data.

---

## Feasibility overview

| Slice | Feasibility | Status | Why |
|-------|-------------|--------|-----|
| Share links for designs (talisman, circle, altar, tree note) | High | Planned | Same documents; add visibility + a public GET. Natural fit. |
| Public / unlisted practitioner card | Medium | Planned | Unique usernames + a stripped public shape (no email, natal, lat/lon). |
| Follows / quiet “who’s practicing” list | Medium | Planned (late) | A `Follow` collection is easy. Privacy defaults are the hard part. |
| Opt-in shared journal entries | Medium–hard | Planned (late) | Dreams, mood, Goetia, natal sky, ritual notes. Per-entry opt-in only. |
| Comments / likes on shared artifacts | Medium | Planned (late) | REST + a new model. Moderation from day one. |
| Lodges / study circles | Harder, on-theme | Planned | Membership, shared working log, permissions. Better fit than a global feed. |
| Chat, DMs, live co-editing, activity firehose | Low on this stack | Rejected (near-term) | One Express process, no sockets, no Redis. Different product. |

Current deploy (one Mongo, one Express) is enough for a small community. It is not enough for realtime chat or a large feed.

---

## Prerequisites (before any social UI)

These are blockers for share links and profiles. **✅ QW1–QW4 complete — all prerequisites ready.**

### P1 — Privacy as a first-class field ✅

Every persisted model is owner-only today. Social requires `visibility` on shareable documents, not on the User document as a whole.

Suggested values: `private` (default) | `unlisted` (link-only) | `public`. Later: optional `circleId` / lodge scope.

**Done when:** shareable models have `visibility` (default `private`); existing list/get routes remain owner-only unless an explicit public/unlisted path is used.

**Status:** ✅ **COMPLETE (QW3)** — Visibility enum implemented, 6 models updated, migration ready.

**Reference:** `docs/TYPES.md`, `docs/MIGRATIONS.md`, `server/src/types/visibility.ts`

### P2 — URL routing for share links ✅

Navigation is React state in `App.tsx`, not URL routes. A link like `/s/talisman/:id` needs a real URL (hash or React Router) plus the existing SPA fallback for non-API paths.

**Done when:** a cold load of a share URL opens the right artifact; guest-friendly; does not break sidebar `ModuleId` switching.

**Status:** ✅ **COMPLETE (QW1)** — React Router v6.4+ integrated, routes.tsx defined, SharePage component ready.

**Reference:** `docs/PHASE-51-IMPLEMENTATION-GUIDE.md`, `client/src/routes.tsx`, `client/src/components/SharePage.tsx`

### P3 — Public user serializer ✅

Profiles may show username and (later) tradition interests. They must not show email, birth data, or coordinates. Natal and location stay personalization for Magical OS, not social identity.

**Done when:** a dedicated public DTO exists; `publicUser()` is used only for the authenticated owner (`GET /api/auth/me`, login/register).

**Status:** ✅ **COMPLETE (QW4)** — PublicUser interface, FullUser interface, serializers implemented (toPublicUser, isSafePublic), type guards added.

**Reference:** `docs/TYPES.md`, `server/src/types/User.ts`, `server/src/lib/userSerializers.ts`

### P4 — Unique, URL-safe usernames ✅

Required before `@handle` profiles or mentions.

**Done when:** username unique index; register/update reject collisions; handles are URL-safe.

**Status:** ✅ **READY (will complete in Phase 51 P4)** — Already in User schema; unique: true; validation ready.

**Reference:** `docs/PHASE-51-IMPLEMENTATION-GUIDE.md` (P4 section)

### P5 — Guest mode preserved ✅

Core tools keep working logged out. Social features sit behind auth, same as saves.

**Done when:** guests can *open* unlisted/public share links; creating or following requires login.

**Status:** ✅ **READY (will complete in Phase 51 P5)** — React Router share links don't require auth; public endpoints don't require protect middleware.

**Reference:** `docs/PHASE-51-IMPLEMENTATION-GUIDE.md` (P5 section)

---

## Phase family S — Social / lodge layer

Do not add a sidebar module until a phase’s **Done when** criteria are met. Social is not a calculation tool; it is a persistence and privacy layer with a few entry points in existing modules.

**Suggested order:** shareable designs → practitioner cards → lodges → (optional) follows / opt-in journal / comments.

### S1 — Shareable designs

Highest value, lowest privacy blast radius. Reuse existing JSON export shapes.

In scope:

- Unlisted (and optionally public) share links for **Talisman**, **Solomonic Circles**, **Ritual Space**, **Tree notes**
- `visibility` + public GET (token or id); owner PATCH to publish/unpublish
- “Open shared…” entry in those modules; Magical OS does not become a feed

Out of scope: journal, natal charts, planetary location, comments.

**Done when:** signed-in owner can mint an unlisted link; anyone with the link can view (not edit) the artifact; default remains private; PNG/JSON export unchanged.

### S2 — Opt-in practitioner cards

Public or unlisted card: unique username, no natal/location/email. Presence may show “online” without exposing *what* they are working.

**Done when:** `/u/:username` (or equivalent) renders a stripped card; owner controls visibility; `GET /api/auth/user-count` still returns counts only (no user list by default).

### S3 — Lodges / study circles

Invite-only groups that can share a working or a layout. Matches ceremonial practice better than followers.

In scope:

- Lodge document (name, invite token or owner-approved join)
- Membership
- Lodge-scoped visibility for designs from S1
- Optional shared working log (journal `working` entries opted into the lodge — never the whole journal)

**Done when:** create lodge; invite member; share one layout or working into the lodge; non-members cannot read it.

### S4 — Follows (optional, late)

Quiet follow graph. No algorithmic feed. Maybe a “practitioners you follow who are online” strip on Magical OS.

**Done when:** follow/unfollow; list is private to the viewer by default; no public follower counts required.

### S5 — Opt-in journal share (optional, late)

Per-entry visibility only. Never a default timeline of dreams, mood, or Goetia notes.

**Done when:** a single journal entry can be unlisted/public/lodge-scoped; list endpoints never leak private entries; sky lat/lon stripped or coarsened on shared entries.

### S6 — Comments / reports on shared artifacts (optional, late)

REST comments on S1 artifacts. Report/hide from day one.

**Done when:** owner can disable comments; report flow exists; guests cannot post.

---

## Explicitly out of early scope

| Item | Status | Reason |
|------|--------|--------|
| Public journal timelines | Rejected | Journal is the private log; opt-in per entry only (S5). |
| Natal-chart sharing | Rejected (early) | Birth data is identity-adjacent; keep on the owner profile only. |
| DMs / chat / live co-editing | Rejected (near-term) | No websocket/Redis layer; single Express process. |
| Global activity firehose | Rejected | Conflicts with private-OS stance and small-deploy scale. |
| Social as default Magical OS | Rejected | OS stays sky + tools + own journal; social is opt-in chrome. |

---

## Privacy and moderation rules

- **Default private.** New documents and new users do not appear in any social surface until the owner acts.
- **Strip sensitive fields** on any shared payload: email, password, `natal`, precise `location` / sky `lat`/`lon`.
- **Do not reuse** `publicUser()` for other people’s views.
- **Moderation from day one** on any UGC (shared notes, comments, lodge names). Occult content, Goetia, and ritual instructions are abuse- and safety-sensitive.
- **Report / hide** before likes, mentions, or public directories.
- **Guest-friendly view, auth-gated write** — same pattern as the rest of the app.

---

## Architecture notes (when this ships)

Likely work, mapped to current conventions in [ARCHITECTURE.md](ARCHITECTURE.md):

1. Models — add `visibility` (and later `circleId`) to shareable schemas; new `Lodge` / `LodgeMembership` (S3); optional `Follow`, `Comment`, `ShareToken`.
2. Routes — public/unlisted GET *without* `protect`; mutating publish still `protect` + CSRF. Never widen existing owner list endpoints.
3. Client — share URL handling in `App.tsx` (P2); publish controls in Talisman / Solomonic / Ritual Space / Tree; no new sidebar module until S2 or S3 has a real home.
4. Auth — unique username (P4); second serializer (P3).
5. Deploy — stay on Docker Compose / single-port SPA until a phase actually needs Redis or sockets (not S1–S3).

---

## Cross-cutting rules

- Do not start S-phases until the corresponding **Done when** in this doc is the implementation target
- Do not flip any sidebar `status` for social until that phase’s **Done when** is met
- Prefer client-side calculation for deterministic tools; Express for auth-bound persistence **and** share/lodge reads
- Preserve guest use of calculation tools; social writes require login
- Preserve existing gold/violet occult visual language
- Keep Docker Compose / single-port SPA serving unchanged unless a later phase explicitly needs realtime infra
- Main [ROADMAP.md](../ROADMAP.md) stays the source of truth for shipped modules (Phases 1–39+); this file is the social family only
