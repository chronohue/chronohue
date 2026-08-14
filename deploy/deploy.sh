#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${HOST:-217.149.22.176}"
REMOTE="/var/www/circahue.isamarin.xyz"

cd "$ROOT"
if [ "${SKIP_BUILD:-0}" != "1" ]; then
  npm ci
  npm run build:demo
fi
if [ ! -d "${ROOT}/site" ]; then
  echo "site/ missing — run npm run build:demo first" >&2
  exit 1
fi

ssh -o BatchMode=yes "root@${HOST}" "mkdir -p '${REMOTE}'"
rsync -az --delete --exclude '.well-known' "${ROOT}/site/" "root@${HOST}:${REMOTE}/"

if [ "${BOOTSTRAP_HTTP:-0}" = "1" ]; then
  scp -q "${ROOT}/deploy/nginx-circahue.http.conf" "root@${HOST}:/etc/nginx/sites-available/circahue.isamarin.xyz"
else
  scp -q "${ROOT}/deploy/nginx-circahue.conf" "root@${HOST}:/etc/nginx/sites-available/circahue.isamarin.xyz"
fi

ssh -o BatchMode=yes "root@${HOST}" '
  ln -sfn /etc/nginx/sites-available/circahue.isamarin.xyz /etc/nginx/sites-enabled/circahue.isamarin.xyz
  nginx -t
  systemctl reload nginx
'

echo "site  https://circahue.isamarin.xyz/"
