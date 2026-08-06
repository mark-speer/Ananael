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

Then open **http://localhost:8080** (React UI via Nginx). The API listens on **http://localhost:5000** (health: `/api/health`) — that port is JSON only, not the website.

Browser API calls go through Nginx (`/api` → `server:5000`), so day-to-day use is port **8080** only.

### Portainer

1. Push this repo to GitHub (or copy it onto the VM).
2. In Portainer → **Stacks** → **Add stack** (Repository deploy from git, or paste `docker-compose.yml` with build context = repo root).
3. Optionally set environment variables:
   - `JWT_SECRET` — strong random secret (required for production)
   - `CLIENT_ORIGIN` — e.g. `http://<vm-ip>:8080` if anything talks to the API on port 5000 from the browser (default `http://localhost:8080`)
4. Deploy and wait for `ananael-mongo`, `ananael-server`, and `ananael-client` to be running.
5. Open **`http://<vm-ip>:8080/`** — not `:5000` and not `:5173`.

If `ananael-client` fails to start, check that host port **8080** is free (or change the left side of `8080:80` in `docker-compose.yml`).

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
