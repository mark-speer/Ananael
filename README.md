# Ananael

A modular MERN dashboard for esoteric traditions, hermetics, and ceremonial magic.

**Phase 1** ships JWT authentication and a virtual Tarot module (Single / Three-Card / Celtic Cross), packaged for Docker Compose / Portainer on a local Linux VM. **Phase 2** adds Gematria, Planetary Hours, and Script Translator (client-side calculation tools). **Phase 3** adds I Ching casting with King Wen text. **Phase 4a** adds an interactive Tree of Life with Golden Dawn correspondences. **Phase 4b** adds a Ritual Space Planner for altar layouts with PNG/JSON export and saved layouts. **Phase 5** adds Solomonic Circles (Goetia / Heptameron / Generic magician’s circle builder). **Phase 6** deepens Solomonic Circles with Ars Goetia spirit selection, Triangle of Art, and a labeled seal slot. **Phase 7** adds Magical Journal — unified ritual / dream / divination / mood logs with moon and planetary-hour tags (Tarot and I Ching saves land here). **Phase 8** adds Magical OS — the default-home dashboard composing sky conditions, quick tarot, journal workings, and deep-links into every module.

## Stack

| Layer   | Tech                                      |
|---------|-------------------------------------------|
| Client  | React, Vite, TypeScript, Tailwind CSS     |
| Server  | Express, TypeScript, Mongoose, JWT, bcrypt |
| Data    | MongoDB (`ananael` database)               |

In production Docker, Express serves the built React app **and** the API on one port (`5000`).

## Quick start (Docker Compose)

From the repository root:

```bash
docker compose up --build
```

Then open **http://localhost:5000** — that is the full web app. Health: `/api/health`.

### Portainer

1. Push this repo to GitHub (or copy it onto the VM).
2. In Portainer → **Stacks** → **Add stack** (Repository deploy from git, or paste `docker-compose.yml` with **build context = repository root**).
3. Optionally set environment variables:
   - `JWT_SECRET` — strong random secret (required for production)
   - `CLIENT_ORIGIN` — defaults to `*` (same-origin UI+API on `:5000` is typical)
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
| Magical OS           | Active (Phase 8, default home)|
| Tarot                | Active                        |
| Magical Journal      | Active (Phase 7)              |
| Gematria             | Active (Phase 2a)             |
| Planetary Hours      | Active (Phase 2b)             |
| Script Translator    | Active (Phase 2c)             |
| I Ching              | Active (Phase 3)              |
| Tree of Life         | Active (Phase 4a)             |
| Correspondences      | Active                        |
| Ritual Space Planner | Active (Phase 4b)             |
| Solomonic Circles    | Active (Phase 5–6)            |

Phased implementation details: see [ROADMAP.md](ROADMAP.md).

## API

- `POST /api/auth/register` — `{ username, email, password }`
- `POST /api/auth/login` — `{ email, password }`
- `GET /api/auth/me` — Bearer JWT; current user (includes `location`)
- `PUT /api/auth/location` — Bearer JWT; `{ lat, lon }` saved on the user profile for planetary hours / Magical OS / journal sky
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
- `GET /api/health` — liveness (`client: true` when the UI was baked into the image)

## License

Private / unlicensed unless otherwise noted.
