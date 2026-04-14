# PeptPal

A cross-platform harm-reduction app for tracking peptide use.
> **All reference data is informational only — not medical advice.**

---

## Stack

| Layer | Tech |
|---|---|
| Mobile | Expo SDK 52, expo-router, React Native, TypeScript |
| Styling | NativeWind 4 (Tailwind CSS) |
| Local DB | expo-sqlite (SQLite) |
| Secure storage | expo-secure-store |
| State | Zustand + React Query |
| Forms | React Hook Form + Zod |
| Backend | FastAPI + Tortoise ORM + PostgreSQL |
| Migrations | Aerich |
| Monorepo | Turborepo + pnpm workspaces |

---

## Quick Start

### 1. Clone and install

```bash
pnpm install
```

### 2. Start the backend

```bash
cp .env.example .env
docker-compose up -d
```

### 3. Run migrations + seed

```bash
docker-compose exec api aerich init -t app.config.TORTOISE_ORM
docker-compose exec api aerich upgrade
docker-compose exec api python -m app.seed.run_seed
```

### 4. Start the Expo app

```bash
pnpm --filter @peptpal/mobile dev
```

---

## Testing on your iPhone (one command)

From a Linux/WSL dev machine with Docker, cloudflared, and Expo Go installed:

```bash
pnpm iphone
```

This single command:
1. Boots postgres + api via `docker compose`
2. Opens a public HTTPS tunnel for the API (port 8000) via cloudflared
3. Opens a public HTTPS tunnel for Metro (port 8081) via cloudflared
4. Writes the API URL into `apps/mobile/.env.local`
5. Starts Expo with `EXPO_PACKAGER_PROXY_URL` set to the Metro tunnel so the QR resolves from anywhere

**Usage**

1. Install **Expo Go** on your iPhone.
2. Run `pnpm iphone`.
3. Wait for the QR to appear (both tunnels must print their URLs first — takes ~10s).
4. Open Expo Go → tap "Scan QR code" → point at the QR in your terminal.
5. App loads over the tunnel. Works on cellular or any Wi-Fi.
6. `Ctrl+C` stops Metro and tears down both tunnels automatically.

**Prereqs** (one-time):

```bash
# cloudflared (free, no account)
curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 \
  -o ~/.local/bin/cloudflared && chmod +x ~/.local/bin/cloudflared

# Expo Go from the App Store on your iPhone
```

**Troubleshooting**

- Tunnel URLs change every run — that's fine, the script writes the current API URL into `.env.local` each time.
- If the API tunnel doesn't come up in 30s, check `docker compose logs api`.
- Tunnel logs are kept at `.dev-iphone/*.log` for the current run.
- Scan the QR with **Expo Go's own scanner** — the iOS Camera app won't open `exp://` URLs.

---

## Monorepo Structure

```
peptpal/
├── apps/
│   └── mobile/          # Expo app (iOS, Android, Web)
├── packages/
│   ├── core/            # Shared TypeScript: calculators, types, validators
│   ├── ui/              # Shared NativeWind component library
│   └── config/          # Shared ESLint, tsconfig, Tailwind config
├── backend/             # FastAPI + PostgreSQL
└── docker-compose.yml
```

---

## Running Tests

```bash
# Core package tests (Vitest)
pnpm --filter @peptpal/core test

# With coverage
pnpm --filter @peptpal/core test:coverage
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/peptides` | List all published peptides |
| GET | `/api/peptides/{slug}` | Full peptide detail |
| GET | `/api/peptides/search?q=` | Search by name / alias |
| POST | `/api/community/submissions` | Submit a correction |
| GET | `/api/admin/submissions` | List pending submissions (admin) |
| PATCH | `/api/admin/submissions/{id}` | Approve / reject submission (admin) |
| POST | `/api/admin/peptides` | Create peptide (admin) |
| PATCH | `/api/admin/peptides/{id}` | Update peptide (admin) |

Admin endpoints require `X-Admin-Token` header matching `ADMIN_SECRET_TOKEN`.

---

## Features

- **Peptide Library** — 18 reference peptides with dosing, protocols, side effects, storage
- **Reconstitution Calculator** — BAC water calculator, by concentration or by dose/volume
- **Injection Log** — dose safety check with un-dismissable override modal
- **Symptom Tracker** — linked to injections, with pattern detection
- **Inventory** — vial tracking, expiry suggestions, auto-decrement on logging
- **Schedule & Reminders** — local push notifications via expo-notifications
- **Dashboard** — today's schedule, active inventory, recent logs
- **Backup / Restore** — AES-derived encrypted JSON export/import (passphrase-protected)
- **Community Submission** — in-app form to suggest reference data corrections

---

## Legal

- First-launch disclaimer modal (stored in expo-secure-store, shown once)
- Overdose warning modal requires explicit checkbox acknowledgment
- No telemetry, analytics, or tracking of any kind
- All personal data stays on-device
