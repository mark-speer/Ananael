# Ananael

A modular MERN dashboard for esoteric traditions, hermetics, and ceremonial magic.

**Phase 1** ships JWT authentication and a virtual Tarot module (Single / Three-Card / Celtic Cross), packaged for Docker Compose / Portainer on a local Linux VM.

## Stack

| Layer   | Tech                                      |
|---------|-------------------------------------------|
| Client  | React, Vite, TypeScript, Tailwind CSS, Nginx |
| Server  | Express, TypeScript, Mongoose, JWT, bcrypt |
| Data    | MongoDB (`ananael` database)               |

## Quick start (Docker Compose)

From the repository root:

```bash
docker compose up --build
```

Then open **http://localhost** (client on port 80). The API is also reachable at **http://localhost:5000** (health: `/api/health`).

Browser API calls go through Nginx (`/api` → `server:5000`), so you only need port 80 in normal use.

### Portainer

1. Push or copy this repo onto the VM.
2. In Portainer → **Stacks** → **Add stack**.
3. Upload or paste `docker-compose.yml` (set the build context to this repo root), or use **Repository** deploy if the stack lives in git.
4. Optionally set environment variables:
   - `JWT_SECRET` — strong random secret (required for production)
   - `CLIENT_ORIGIN` — browser origin if you hit the API on port 5000 directly (default `http://localhost`)
5. Deploy the stack and wait for `ananael-mongo`, `ananael-server`, and `ananael-client` to become healthy/running.

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

Vite proxies `/api` to `http://localhost:5000`.

## Modules (sidebar)

| Module               | Status       |
|----------------------|--------------|
| Tarot                | Active       |
| Planetary Hours      | Coming Soon  |
| I Ching              | Coming Soon  |
| Gematria             | Coming Soon  |
| Tree of Life         | Coming Soon  |
| Script Translator    | Coming Soon  |
| Ritual Space Planner | Coming Soon  |

## API (Phase 1)

- `POST /api/auth/register` — `{ username, email, password }`
- `POST /api/auth/login` — `{ email, password }`
- `POST /api/tarot/save` — Bearer JWT; `{ spreadType, cardsDrawn, userNotes? }`
- `GET /api/health` — liveness

## License

Private / unlicensed unless otherwise noted.
