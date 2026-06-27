#!/usr/bin/env bash
# Run on your laptop or EC2 (no secrets). Verifies API DNS, CORS preflight (no redirect), and a sample POST.
set -euo pipefail

API="${1:-https://infra-resilience360-cloud-production.up.railway.app}"
ORIGIN="${2:-https://www.infraresilience.org}"

echo "=== DNS A/AAAA for API host ==="
getent ahosts "$(echo "$API" | sed -E 's#^https?://##; s#/.*##')" 2>/dev/null || true

echo ""
echo "=== OPTIONS preflight (must NOT be 301/302; expect 204 or 200 with CORS headers) ==="
curl -sS -D - -o /dev/null -X OPTIONS "${API}/api/auth/login" \
  -H "Origin: ${ORIGIN}" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type" | head -n 25

echo ""
echo "=== POST /api/auth/login (expect JSON; 401 invalid creds means API + DB path OK, user missing/wrong password) ==="
curl -sS -X POST "${API}/api/auth/login" \
  -H "Content-Type: application/json" \
  -H "Origin: ${ORIGIN}" \
  -d '{"email":"sanity-check@unknown.invalid","password":"wrong"}' | head -c 400
echo ""

echo ""
echo "=== Tips ==="
echo "1) If OPTIONS shows 301/302, fix nginx: do not redirect preflight; proxy OPTIONS to Node."
echo "2) SPA must use VITE_SITE_URL=${API} (or rely on built-in NET360 companion = api subdomain)."
echo "3) MongoDB URI must include /net360 (or your DB name). Atlas IP Access: allow EC2 public IP."
echo "4) Register first: curl -X POST ${API}/api/auth/register -H 'Content-Type: application/json' -d '{\"email\":\"you@x.com\",\"password\":\"AtLeast8Chars\",\"name\":\"You\"}'"

