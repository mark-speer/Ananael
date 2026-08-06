# Ananael

A modular MERN dashboard for esoteric traditions, hermetics, and ceremonial magic.

**Phase 1** ships JWT authentication and a virtual Tarot module (Single / Three-Card / Celtic Cross), packaged for Docker Compose / Portainer on a local Linux VM.

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

| Module               | Status                          |
|----------------------|---------------------------------|
| Tarot                | Active                          |
| Planetary Hours      | Shell (Phase 2b) — Coming Soon  |
| Script Translator    | Shell (Phase 2c) — Coming Soon  |
| I Ching              | Shell (Phase 3) — Coming Soon   |
| Tree of Life         | Shell (Phase 4a) — Coming Soon  |
| Ritual Space Planner | Shell (Phase 4b) — Coming Soon  |

Phased implementation details: see [ROADMAP.md](ROADMAP.md).

## API (Phase 1)

- `POST /api/auth/register` — `{ username, email, password }`
- `POST /api/auth/login` — `{ email, password }`
- `POST /api/tarot/save` — Bearer JWT; `{ spreadType, cardsDrawn, userNotes? }`
- `GET /api/health` — liveness (`client: true` when the UI was baked into the image)

## License

Private / unlicensed unless otherwise noted.
