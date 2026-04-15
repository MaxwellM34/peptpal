#!/usr/bin/env bash
# One-command launcher for iPhone dev via Expo Go.
# Starts: docker backend, API cloudflared tunnel, Metro cloudflared tunnel, Metro.
# Ctrl+C cleans up all children.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MOBILE_DIR="$REPO_ROOT/apps/mobile"
ENV_FILE="$MOBILE_DIR/.env.local"
CLOUDFLARED="${CLOUDFLARED:-$HOME/.local/bin/cloudflared}"
LOG_DIR="$REPO_ROOT/.dev-iphone"
API_LOG="$LOG_DIR/api-tunnel.log"
METRO_LOG="$LOG_DIR/metro-tunnel.log"

mkdir -p "$LOG_DIR"

cleanup() {
  echo ""
  echo "→ shutting down tunnels…"
  [[ -n "${API_PID:-}" ]] && kill "$API_PID" 2>/dev/null || true
  [[ -n "${METRO_TUN_PID:-}" ]] && kill "$METRO_TUN_PID" 2>/dev/null || true
  wait 2>/dev/null || true
  echo "→ done."
}
trap cleanup EXIT INT TERM

if [[ ! -x "$CLOUDFLARED" ]]; then
  echo "cloudflared not found at $CLOUDFLARED"
  echo "install: curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o $CLOUDFLARED && chmod +x $CLOUDFLARED"
  exit 1
fi

echo "→ starting docker backend (postgres + api)…"
(cd "$REPO_ROOT" && docker compose up -d postgres api >/dev/null)

echo "→ waiting for API to respond…"
for i in $(seq 1 30); do
  if curl -fsS http://localhost:8000/api/peptides >/dev/null 2>&1; then
    echo "  API ready."
    break
  fi
  sleep 1
  if [[ $i -eq 30 ]]; then
    echo "  API did not come up in 30s. Check: docker compose logs api"
    exit 1
  fi
done

extract_tunnel_url() {
  local log_file="$1"
  local label="$2"
  local url=""
  # Cloudflared quick tunnels usually print a URL within 5–15s but can take
  # 45+ seconds on slow networks. Poll for up to 90s.
  for i in $(seq 1 90); do
    # Use `strings` to defang ANSI color codes cloudflared injects.
    url=$(strings "$log_file" 2>/dev/null | grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' | head -1)
    if [[ -n "$url" ]]; then
      echo "$url"
      return 0
    fi
    # Progress dot every 5s so user sees it isn't stuck.
    if (( i % 5 == 0 )); then
      printf "  %s tunnel: still waiting (%ds)…\n" "$label" "$i" >&2
    fi
    sleep 1
  done
  return 1
}

echo "→ starting API tunnel (port 8000)…"
: > "$API_LOG"
"$CLOUDFLARED" tunnel --url http://localhost:8000 >"$API_LOG" 2>&1 &
API_PID=$!

API_URL=$(extract_tunnel_url "$API_LOG" "API") || { echo "  API tunnel failed. See $API_LOG"; exit 1; }
echo "  API  → $API_URL"

echo "→ starting Metro tunnel (port 8081)…"
: > "$METRO_LOG"
"$CLOUDFLARED" tunnel --url http://localhost:8081 >"$METRO_LOG" 2>&1 &
METRO_TUN_PID=$!

METRO_URL=$(extract_tunnel_url "$METRO_LOG" "Metro") || { echo "  Metro tunnel failed. See $METRO_LOG"; exit 1; }
echo "  Metro→ $METRO_URL"

echo "→ writing $ENV_FILE"
cat >"$ENV_FILE" <<EOF
EXPO_PUBLIC_API_URL=$API_URL
EOF

echo ""
echo "══════════════════════════════════════════════════════════════"
echo "  API   : $API_URL"
echo "  Metro : $METRO_URL"
echo "══════════════════════════════════════════════════════════════"
echo "  Open Expo Go on iPhone → scan the QR below."
echo "  Ctrl+C here to stop everything."
echo ""

cd "$MOBILE_DIR"
exec env \
  EXPO_PACKAGER_PROXY_URL="$METRO_URL" \
  EXPO_MANIFEST_PROXY_URL="$METRO_URL" \
  npx expo start --host localhost --go
