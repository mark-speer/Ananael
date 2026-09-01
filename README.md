# Ananael

A modular MERN dashboard for esoteric traditions, hermetics, and ceremonial magic. Fourteen sidebar modules cover divination, celestial timing, correspondences, ritual practice, and more — mostly client-side calculation tools with Express/MongoDB for auth and user data.

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — codebase structure, module inventory, conventions, API reference
- [Roadmap](ROADMAP.md) — phased feature plan and done-when criteria
- [Art credits](docs/ART-CREDITS.md) — bundled public-domain plates (Goetia, Tarot)
- [Social roadmap](docs/SOCIAL-ROADMAP.md) — potential future share/lodge layer (not started)

### Quick Wins (QW1–QW4) Documentation

All Quick Wins are complete. For Phase 51+ implementation:

- [Phase 51 Implementation Guide](docs/PHASE-51-IMPLEMENTATION-GUIDE.md) — step-by-step sharing feature setup
- [TypeScript Types Guide](docs/TYPES.md) — FullUser, PublicUser, Visibility types
- [Database Migrations](docs/MIGRATIONS.md) — running the add-visibility migration
- [Quick Reference](docs/QW-QUICK-REFERENCE.md) — fast lookup for files, imports, endpoints
- [Handoff Checklist](docs/QW-HANDOFF-CHECKLIST.md) — pre-implementation verification for Phase 51 team

**Quick Summary:**
- ✅ QW1: React Router setup (`/s/:type/:id` share links)
- ✅ QW2: JournalEntry audit (PII assessment)
- ✅ QW3: Visibility enum + indexes (privacy model)
- ✅ QW4: PublicUser DTO (safe user data serialization)

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

## License

Private / unlicensed unless otherwise noted.
