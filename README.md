# Ananael

A modular MERN dashboard for esoteric traditions, hermetics, and ceremonial magic.

**Phase 1** ships JWT authentication and a virtual Tarot module (Single / Three-Card / Celtic Cross), packaged for Docker Compose / Portainer on a local Linux VM. **Phase 2** adds Gematria, Celestial Timing (planetary hours + ephemeris / zodiac), and Script Translator (client-side calculation tools). **Phase 3** adds I Ching casting with King Wen text. **Phase 4a** adds an interactive Tree of Life with Golden Dawn correspondences. **Phase 4b** adds a Ritual Space Planner for altar layouts with PNG/JSON export and saved layouts. **Phase 5** adds Solomonic Circles (Goetia / Heptameron / Generic magician’s circle builder). **Phase 6** deepens Solomonic Circles with Ars Goetia spirit selection, Triangle of Art, and a labeled seal slot. **Phase 7** adds Magical Journal — unified ritual / dream / divination / mood logs with moon and planetary-hour tags (Tarot and I Ching saves land here). **Phase 8** adds Magical OS — the default-home dashboard composing sky conditions, quick tarot, journal workings, and deep-links into every module. **Phases 9–11** consolidate Divination (Tarot, I Ching, Geomancy, Runes). **Phase 12** adds Talisman Atelier (kamea + sigils). **Phase 13** adds electional windows on Celestial Timing. **Phase 14** adds Enochian tablets and Calls. **Phase 15** adds the Ritual Library. **Phase 16** expands the Ritual Library with fuller outlines, public-domain Solomonic excerpts, and additional GD / daily rites. **Phase 17** adds the Magical Almanac (month grid + day counsel on Celestial Timing, with a Magical OS tile). **Phase 18** weaves Hermetic Alchemy hooks (metals, Tria Prima, opus stages, operation of the day) across Almanac, Correspondences, Journal, Ritual Library, and Talisman. **Phase 19** adds Athanor — a dedicated alchemy chamber (Stages / Vessel / Emblem). **Phase 20** syncs docs. **Phase 21** adds Goetia seal artwork. **Phase 22** adds Celestial Timing chart bookmarks. **Phase 23** deepens Athanor with vessel save, opus progress, and richer emblems. **Phase 24** polishes cross-module wiring — Magical OS deep-links into every module, shared SVG export (including Tree of Life), aligned search chrome, and mobile UX fixes. **Phase 25** adds Ritual Runner — guided step-through practice inside the Ritual Library with journal persistence and Magical OS Resume.

## Stack

| Layer   | Tech                                      |
|---------|-------------------------------------------|
| Client  | React, Vite, TypeScript, Tailwind CSS     |
| Server  | Express, TypeScript, Mongoose, JWT, bcrypt |
| Data    | MongoDB (`ananael` database)               |

In production Docker, Express serves the built React app **and** the API on **port 5000**.

## Quick start (Docker Compose)

1. Set `JWT_SECRET` (min 32 chars) in the environment.
2. From the repository root:

```bash
docker compose up --build
```

Then open **http://localhost:5000** — that is the full web app. Health: `/api/health`.

### HTTPS (optional)

Mount certs and set `COOKIE_SECURE=true`, `CLIENT_ORIGIN=https://your-host`, plus `SSL_CERT_PATH` / `SSL_KEY_PATH`. Without cert files, use **`http://`** — `https://` against plain HTTP causes an SSL protocol error.

### Portainer

1. Push this repo to GitHub (or copy it onto the VM).
2. In Portainer → **Stacks** → **Add stack** (Repository deploy from git, or paste `docker-compose.yml` with **build context = repository root**).
3. In the stack **Environment variables** section (required before deploy/pull), set:
   - `JWT_SECRET` — at least 32 characters (e.g. run `openssl rand -hex 32` and paste the value). The API will not start without this.
   - `CLIENT_ORIGIN` — defaults to `https://ananael.tech,https://www.ananael.tech`
   - `COOKIE_SECURE` — defaults to `true` (HTTPS at ananael.tech)
4. Deploy and wait for `ananael-mongo` and `ananael-server` to be **running**.
5. **Pull/rebuild** so the image is rebuilt from the latest commit (Portainer → stack → **Pull and redeploy** / recreate with rebuild).
6. Open **`http://<vm-ip>:5000/`**

You should see the Ananael dashboard, not JSON and not `Cannot GET /`.

### Local development (without Docker)

**Server**

```bash
cd server
cp .env.example .env
# Set MONGO_URI=mongodb://localhost:27017/ananael when Mongo runs locally
npm install
npm run dev
```

**Client**

```bash
cd client
npm install
npm run dev
```

Open **http://localhost:5173**. Vite proxies `/api` to `http://localhost:5000`.

## Modules (sidebar)

| Module               | Status                        |
|----------------------|-------------------------------|
| Magical OS           | Active (Phase 8 / 24 / 30 natal personalization, default home)|
| Divination           | Active (Phase 9–11: Tarot, I Ching, Geomancy, Runes) |
| Magical Journal      | Active (Phase 7)              |
| Gematria             | Active (Phase 2a)             |
| Celestial Timing     | Active (Phase 2b+ / 13 / 17 / 22 / 26–29 Natal chart) |
| Script Translator    | Active (Phase 2c)             |
| Tree of Life         | Active (Phase 4a / 24 PNG·JSON export) |
| Correspondences      | Active (Phase 18 metals / principles) |
| Athanor              | Active (Phase 19)             |
| Ritual Space Planner | Active (Phase 4b)             |
| Solomonic Circles    | Active (Phase 5–6 / 21 seals) |
| Talisman Atelier     | Active (Phase 12 / 18 metals) |
| Enochian             | Active (Phase 14)             |
| Ritual Library       | Active (Phase 15–16 / 18 Alchemy / 25 Ritual Runner) |

Phased implementation details: see [ROADMAP.md](ROADMAP.md).

## API

- `POST /api/auth/register` — `{ username, email, password }`
- `POST /api/auth/login` — `{ email, password }`
- `GET /api/auth/me` — Bearer JWT; current user (includes `location`, `natal`)
- `PUT /api/auth/location` — Bearer JWT; `{ lat, lon }` saved on the user profile for Celestial Timing / Magical OS / journal sky
- `PUT /api/auth/natal` — Bearer JWT; `{ birthDate, birthTime?, birthPlace?, label? }` natal birth profile for Celestial Timing Natal panel
- `POST /api/tarot/save` — Bearer JWT; saves a Magical Journal divination entry (`spreadType`, `cardsDrawn`, `userNotes?`, `sky?`)
- `GET /api/tarot/history` — Bearer JWT; recent tarot journal entries (compat shape)
- `POST /api/gematria/save` — Bearer JWT; `{ text, system, total, notes? }`
- `POST /api/iching/save` — Bearer JWT; saves a Magical Journal divination entry
- `GET /api/iching/history` — Bearer JWT; recent I Ching journal entries (compat shape)
- `POST /api/journal/entries` — Bearer JWT; create journal entry
- `GET /api/journal/entries` — Bearer JWT; list/search (`type`, `status`, `q`, `tag`, `entity`, `from`, `to`)
- `PATCH /api/journal/entries/:id` / `DELETE /api/journal/entries/:id` — Bearer JWT
- `POST /api/journal/migrate` — Bearer JWT; idempotent legacy Tarot/I Ching → journal copy
- `POST /api/tree/notes` — Bearer JWT; `{ targetType, targetId, userNotes }`
- `GET /api/tree/notes` — Bearer JWT; recent Tree of Life study notes
- `POST /api/ritual/layouts` — Bearer JWT; `{ name, items, showCompass?, notes? }`
- `GET /api/ritual/layouts` — Bearer JWT; recent ritual layouts
- `PUT /api/ritual/layouts/:id` — Bearer JWT; update an owned layout
- `POST /api/solomonic/circles` — Bearer JWT; `{ name, tradition, config, notes? }` (`config` may include Phase 6 `spiritId`, `showTriangle`, `triangleBearing`, `showSeal`)
- `GET /api/solomonic/circles` — Bearer JWT; recent Solomonic circles
- `PUT /api/solomonic/circles/:id` — Bearer JWT; update an owned circle
- `POST /api/geomancy/save` — Bearer JWT; geomancy chart → Magical Journal divination
- `POST /api/runes/save` — Bearer JWT; rune cast → Magical Journal divination
- `POST/GET /api/talisman/designs`, `PUT /api/talisman/designs/:id` — Bearer JWT; talisman designs
- `POST/GET /api/planetary/charts`, `PUT /api/planetary/charts/:id` — Bearer JWT; Celestial Timing chart bookmarks (`config`: lat/lon/datetime/panel/elections)
- `POST/GET /api/opus/vessels`, `PUT /api/opus/vessels/:id` — Bearer JWT; Athanor vessel designs (`config`: intent/materiaMetal/targetStageId)
- `POST/GET /api/enochian/notes` — Bearer JWT; Enochian study notes
- `GET /api/liturgy/rites` — rite catalog (static)
- `GET /api/health` — liveness (`client: true` when the UI was baked into the image)

## License

Private / unlicensed unless otherwise noted.
