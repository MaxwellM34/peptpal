# PeptPal

A harm-reduction app for people using peptides — most of which are not FDA-approved. Tracks inventory, doses, cycles, degradation, biomarkers, and surfaces community-weighted consensus so users don't blindly copy trial doses that were run on cohorts 60+ lb heavier than they are.

> **Not medical advice. Informational and harm-reduction only.**

---

## Why PeptPal exists

Peptide forums are full of dangerous defaults. The retatrutide phase 2 cohort averaged **248 lb / BMI 37** — a lean 170 lb user copying the headline "12 mg/wk" is at ~1.45× the trial per-kg exposure, directly in the 20.9% dysesthesia range. Same mismatch for semaglutide, tirzepatide, tesamorelin, and every other flat-dosed compound.

PeptPal's wedge is the **evidence engine**: every dose recommendation carries a trial cohort, a trust-tiered source citation, and is weight-scaled to the user. The app treats these numbers as estimates with explicit uncertainty — supplier purity, reconstitution accuracy, and injection absorption each add variance that typical tracker apps ignore.

---

## Feature matrix

| Area | What's in |
|---|---|
| **Evidence engine** | 17 peptides × 4 personas × trial-cohort metadata. Trust tiers A–F with harmonic-decayed weighting (100 reddit posts can't outweigh one NEJM paper). |
| **Dose scaling** | Weight-normalizes every protocol dose to the user. Flags `dangerous` at ≥1.4× trial per-kg exposure (retatrutide dysesthesia signal). Hard ceilings per peptide. |
| **Community forum** | Pseudonymous dose-log posts (no PII). Weighted-median consensus: bloodwork-attached posts count 5×, batch info 2×, 60+ day logs 2×. Minority-protocol detection (≥15% share, ≥25% divergence). |
| **External consensus** | Curated dose ranges per persona × peptide aggregated from reddit / PubMed / forum archives. Vendor-source excluded. |
| **Inventory** | Batch-level "Receive Shipment" wizard with photos + auto-labeled vials (BPC-157 #1, #2…). Vendor + batch + COA URL + purity; auto-flags counterfeit < 80%. |
| **Degradation model** | Per-peptide first-order decay. Live potency bar + expandable chart per reconstituted vial. Dose compensation math with explicit uncertainty framing. |
| **Guided injection flow** | FIFO vial suggestion (oldest first). Stability gate at <60% potency: reconstitute fresher / compensate / override. Persona-tailored dose suggestion. |
| **Protocol builder** | Multi-peptide stacks with auto-computed BAC water per vial so every injection lands at target volume (default 10 IU). Cross-protocol conflict detection. |
| **PK blood levels** | Exponential decay per peptide with half-life. Overlay chart with optional ±30% variability band. Metrics row (current, peak, half-lives elapsed). |
| **Biomarker tracking** | Panels per category (GH / GLP-1 / healing). IGF-1, HbA1c, lipase, etc. with safe ranges + trendlines. HOMA-IR computed. |
| **Cycling planner** | Desensitization tracking for GH secretagogues. Overdue-break alerts. |
| **Site rotation** | Visual body map, 8 sites with status (ready/resting/avoid). |
| **Blend compatibility** | Syringe vs storage safety matrix. Draw order guidance. |
| **Goal-based protocols** | 8 evidence-backed stacks (injury, body comp, GI, sleep, skin, weight loss, sexual health, anti-aging). |
| **Adverse events** | Per-injection severity sliders (nausea, fatigue, site, mood, other). |
| **Backup / restore** | Passphrase-encrypted JSON export. No server storage. |
| **Onboarding tutorial** | 8-step walkthrough with the PeptPal mascot. Replayable from Settings. |

---

## Stack

| Layer | Tech |
|---|---|
| Mobile | Expo SDK 54, expo-router 6, React Native 0.81, React 19, TypeScript |
| Styling | NativeWind 4 (Tailwind) |
| Local DB | expo-sqlite (v3 schema; incremental migrations) |
| Secure storage | expo-secure-store |
| State | React Query + React local state |
| Forms | React Hook Form + Zod |
| Charts | react-native-svg (LineChart, DegradationChart, BodyMap, SyringeDiagram) |
| Animations | React Native Animated API |
| Backend | FastAPI + Tortoise ORM + PostgreSQL |
| Migrations | Aerich |
| Forum consensus | Python job mirrors TS consensus math; nightly-capable snapshots |
| Monorepo | Turborepo + pnpm workspaces |
| Tests | Vitest (core package) — 114 passing |

---

## Quick Start

```bash
pnpm install
cp .env.example .env
docker compose up -d

# Apply migrations (includes forum tables)
docker compose exec api aerich upgrade
docker compose exec api python -m app.seed.run_seed

# Start the Expo app
pnpm --filter @peptpal/mobile dev
```

---

## iPhone dev — one command

On a Linux/WSL dev box with Docker, cloudflared, and Expo Go:

```bash
pnpm iphone
```

This:
1. Boots postgres + api via `docker compose`
2. Opens public HTTPS tunnels for the API (8000) and Metro (8081) via cloudflared
3. Writes the API URL into `apps/mobile/.env.local`
4. Starts Expo with `EXPO_PACKAGER_PROXY_URL` so the QR resolves from anywhere

**Setup (one-time):**

```bash
curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 \
  -o ~/.local/bin/cloudflared && chmod +x ~/.local/bin/cloudflared
# Install Expo Go on your iPhone from the App Store
```

**Usage:** run `pnpm iphone`, wait for both tunnels (~15–60s depending on network — script shows progress every 5s), open Expo Go, scan the QR with Expo Go's scanner (not iOS Camera). `Ctrl+C` stops everything.

---

## Shipping to friends

| Target | How | Cost |
|---|---|---|
| iOS (demo only) | `pnpm iphone` + Expo Go | Free, you must run the tunnel |
| **Android** | `eas build --platform android --profile preview` → APK link | Free |
| **iOS TestFlight** | `eas build --platform ios --profile preview && eas submit` | $99/yr Apple Dev account |
| iOS Ad-Hoc | `eas build --platform ios --profile preview` (device UDIDs) | $99/yr Apple Dev account |

Deploy the backend first (Fly.io / Railway / Render) and point `EXPO_PUBLIC_API_URL` at the stable URL before building — otherwise the APK reaches the ephemeral cloudflared tunnel.

---

## Monorepo layout

```
peptpal/
├── apps/
│   └── mobile/                         # Expo app (iOS, Android, Web)
│       ├── app/(tabs)/                 # Expo-router screens
│       └── src/
│           ├── db/                     # SQLite helpers per domain
│           ├── api/                    # Backend API client
│           ├── components/             # TwoRowTabBar, PeptPalMascot
│           └── lib/                    # photos, clientId
├── packages/
│   ├── core/                           # Pure TS — shared with backend where possible
│   │   ├── src/
│   │   │   ├── trustTiers.ts           # A–F source hierarchy
│   │   │   ├── doseScaling.ts          # Weight-normalized dose math
│   │   │   ├── consensus.ts            # Weighted-median + minority protocols
│   │   │   ├── biomarkers.ts           # Panels + safe ranges + HOMA-IR
│   │   │   ├── degradation.ts          # First-order decay per peptide
│   │   │   ├── protocolBuilder.ts      # Solve BAC water for target volume
│   │   │   ├── protocolSeeds.ts        # 17-peptide trial metadata
│   │   │   ├── externalProtocolData.ts # Persona × peptide dose ranges
│   │   │   ├── pharmacokinetics.ts     # PK series + blends
│   │   │   └── …
│   │   └── tests/                      # Vitest, 114 passing
│   └── ui/                             # react-native-svg components
│       ├── LineChart.tsx               # PK blood level chart with ±band
│       ├── DegradationChart.tsx        # Vial potency over time
│       ├── SyringeDiagram.tsx          # U-100 scale with unit marks
│       ├── BodyMap.tsx                 # Site rotation map
│       └── DoseScalingCard.tsx
├── backend/
│   ├── app/
│   │   ├── models/                     # Tortoise models: peptide, community, forum
│   │   ├── routers/                    # peptides, community, forum, admin
│   │   ├── services/consensus.py       # Python mirror of TS consensus math
│   │   └── seed/
│   └── migrations/models/              # Aerich migrations (v0 init, v1 forum)
└── scripts/dev-iphone.sh               # One-command iPhone dev launcher
```

---

## Tests

```bash
pnpm --filter @peptpal/core test         # 114 tests
pnpm --filter @peptpal/core test:coverage
```

Type-check mobile:

```bash
cd apps/mobile && npx tsc --noEmit
```

---

## API

**Peptide reference**

| Method | Path | Description |
|---|---|---|
| GET | `/api/peptides` | List published peptides |
| GET | `/api/peptides/{slug}` | Full detail |
| GET | `/api/peptides/search?q=` | Name / alias search |

**Community corrections**

| Method | Path | Description |
|---|---|---|
| POST | `/api/community/submissions` | Suggest a reference-data correction |

**Forum (pseudonymous)**

| Method | Path | Description |
|---|---|---|
| POST | `/api/forum/users` | Register client UUID (no PII) |
| POST | `/api/forum/posts` | Create a structured dose-log post |
| GET | `/api/forum/posts?peptide_slug=&goal=` | List posts for a peptide |
| POST | `/api/forum/posts/{id}/vote` | Up/down vote (value: -1, 0, +1) |
| POST | `/api/forum/posts/{id}/report` | Report a post |
| POST | `/api/forum/posts/{id}/comments` | Comment on a post |
| GET | `/api/forum/consensus?peptide_slug=&weight_kg=` | Weighted-median consensus snapshot |

**Admin** (requires `X-Admin-Token` matching `ADMIN_SECRET_TOKEN`)

| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/submissions` | Review queue |
| PATCH | `/api/admin/submissions/{id}` | Approve / reject |
| POST | `/api/admin/peptides` | Add reference peptide |
| PATCH | `/api/admin/peptides/{id}` | Update reference peptide |

---

## Safety design choices

- **Every dose display carries a source tier.** Vendor marketing gets tier D (weight 0.25). TikTok / Discord gets tier F (excluded from consensus math).
- **Weight-scaling is mandatory.** The "dangerous" flag fires above 1.4× trial per-kg exposure — calibrated to real-world AE signals, not a safety-theater threshold.
- **Degradation math is always qualified as estimation.** Every chart and compensation suggestion states that supplier + absorption variance likely exceeds the correction.
- **PK charts carry a ±30% variability band by default.** Users can't be sold the illusion that "inject 250 mcg → exactly 250 mcg of effect."
- **Forum consensus excludes vendor posts automatically.** Heuristic keyword match flags affiliate content; 5 community reports auto-hides.
- **Hard ceilings per peptide.** Forum posts above the ceiling are rejected. App never displays recommendations above the ceiling regardless of scaling math.
- **First-run disclaimer + tutorial** make the "harm-reduction only, not medical advice" framing unavoidable before use.
- **All personal data stays on-device.** Only forum posts (explicitly opted-in) and community corrections leave the device.

---

## Project history

Built iteratively. Recent phases:

- Site rotation, cycle planner, goal protocols, blend compatibility, syringe U-100 diagram
- Evidence engine (trust tiers, dose scaling, consensus math, biomarker panels, 17 protocol seeds)
- User profile + persona selector + weight-scaled dose UI + biomarker tracker + batch/COA + adverse-event logger
- Community forum: FastAPI backend (models, migrations, weighted-median consensus), mobile forum screens
- Personas + two-row tab bar + external "Wider Internet" community split + 68 seeded persona protocols
- Batch-level inventory wizard with photos + FIFO vial selection + stability gate
- Degradation model + live vial charts + protocol builder + ±variability band + PeptPal tutorial mascot

---

## Contributing

Core engine (`packages/core/`) is pure TypeScript and the single source of truth for safety math. Changes there must include tests. UI packages live in `packages/ui/`. Mobile screens live in `apps/mobile/app/(tabs)/`.
