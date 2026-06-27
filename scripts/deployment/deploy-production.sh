#!/usr/bin/env bash
set -Eeuo pipefail

# Resilience360 final production deployment script
# Usage:
#   bash deploy-production.sh
# Optional env overrides:
#   PROD_DOMAIN=https://www.infraresilience.org
#   PROD_DOMAIN_ALT=https://infraresilience.org
#   DEPLOY_WITH_VERCEL=1
#   VERCEL_TOKEN=xxxx
#   VERCEL_SCOPE=team-or-user

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

PROD_DOMAIN="${PROD_DOMAIN:-https://www.infraresilience.org}"
PROD_DOMAIN_ALT="${PROD_DOMAIN_ALT:-https://infraresilience.org}"
DEPLOY_WITH_VERCEL="${DEPLOY_WITH_VERCEL:-1}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
REPORT_DIR="$ROOT_DIR/deploy/reports/$TIMESTAMP"
mkdir -p "$REPORT_DIR"

OVERALL_STATUS=0
WARNINGS=0

info() { printf "\n[%s] %s\n" "INFO" "$*"; }
warn() { printf "\n[%s] %s\n" "WARN" "$*"; WARNINGS=$((WARNINGS + 1)); }
fail() { printf "\n[%s] %s\n" "FAIL" "$*"; OVERALL_STATUS=1; }
run()  { printf "\n$ %s\n" "$*"; "$@"; }

require_file() {
  local file="$1"
  [[ -f "$file" ]] || { fail "Required file missing: $file"; exit 1; }
}

http_ok() {
  local url="$1"
  local code
  code="$(curl -L -sS -o /dev/null -w "%{http_code}" "$url" || true)"
  if [[ "$code" =~ ^2|^3 ]]; then
    return 0
  fi
  return 1
}

scan_refs() {
  local pattern="$1"
  local output_file="$2"
  shift 2
  if command -v rg >/dev/null 2>&1; then
    rg -n -S -i "$pattern" "$@" >"$output_file" || true
  else
    grep -RInE "$pattern" "$@" >"$output_file" || true
  fi
}

require_file "package.json"
require_file "vite.config.ts"
require_file "capacitor.config.ts"
require_file "src/main.tsx"
require_file "src/config/learnTrainVideos.ts"
require_file "src/config/infraModels.ts"
require_file "src/config/bestPractices.ts"
require_file "src/config/materialHubs.ts"
require_file "public/live-earthquake-alerts.html"

info "SECTION A - CLEANUP"
run rm -rf dist
run rm -rf .vite
run rm -rf node_modules/.vite
run rm -rf android/app/src/main/assets/public
run rm -rf ios/App/App/public
if [[ -d node_modules/@capacitor/cli ]]; then
  run npx cap clean android || warn "Capacitor clean android returned non-zero (continuing)."
  run npx cap clean ios || warn "Capacitor clean ios returned non-zero (continuing)."
else
  warn "Capacitor CLI not installed yet; skipping cap clean."
fi

info "SECTION B - INSTALL"
run node --version
run npm --version
run npm ci
run npm ls --depth=0 >/dev/null
run node --check server/index.mjs

info "SECTION C - BUILD"
export VITE_SITE_URL="$PROD_DOMAIN"
export VITE_PORTAL_BASE_URL="$PROD_DOMAIN"
run npm run build
[[ -f dist/index.html ]] || { fail "Build missing dist/index.html"; exit 1; }
[[ -f dist/sw.js ]] || { fail "Build missing dist/sw.js"; exit 1; }
[[ -f dist/manifest.webmanifest ]] || { fail "Build missing dist/manifest.webmanifest"; exit 1; }
info "Build artifacts verified."

info "SECTION D - CAPACITOR"
run npx cap sync android
run npx cap sync ios
[[ -f android/app/src/main/assets/public/index.html ]] || warn "Android web assets not found after sync."
[[ -f ios/App/App/public/index.html ]] || warn "iOS web assets not found after sync."

info "SECTION E - STATIC ASSET VALIDATION"
S3_BUCKET="pak-population-data"
S3_PREFIXES=(
  "resilience360/learn/"
  "resilience360/infra-models/"
  "resilience360/best-practices/"
  "resilience360/material-hubs/"
  "resilience360/disaster-dashboard/"
)
S3_SAMPLE_URLS=(
  "https://pak-population-data.s3.amazonaws.com/resilience360/learn/flood-protection-barriers.mp4"
  "https://pak-population-data.s3.amazonaws.com/resilience360/infra-models/official-video.mp4"
  "https://pak-population-data.s3.amazonaws.com/resilience360/best-practices/background-image.png"
  "https://pak-population-data.s3.amazonaws.com/resilience360/material-hubs/assets/images/material_hub_bg.png"
  "https://pak-population-data.s3.amazonaws.com/resilience360/disaster-dashboard/assets/images/disaster_dashboard_bg.png"
)
S3_REPORT="$REPORT_DIR/s3-validation.txt"
: >"$S3_REPORT"
for i in "${!S3_PREFIXES[@]}"; do
  prefix="${S3_PREFIXES[$i]}"
  sample_url="${S3_SAMPLE_URLS[$i]}"
  printf "\nPrefix: %s\n" "$prefix" >>"$S3_REPORT"
  if command -v aws >/dev/null 2>&1; then
    if aws s3 ls "s3://${S3_BUCKET}/${prefix}" --no-sign-request >/dev/null 2>&1; then
      printf "  aws s3 ls (no-sign-request): OK\n" >>"$S3_REPORT"
      continue
    elif aws s3 ls "s3://${S3_BUCKET}/${prefix}" >/dev/null 2>&1; then
      printf "  aws s3 ls (signed): OK\n" >>"$S3_REPORT"
      continue
    fi
  fi
  code="$(curl -L -sS -o /dev/null -w "%{http_code}" "$sample_url" || true)"
  if [[ "$code" =~ ^2|^3 ]]; then
    printf "  sample URL OK (%s): %s\n" "$code" "$sample_url" >>"$S3_REPORT"
  else
    printf "  sample URL FAILED (%s): %s\n" "$code" "$sample_url" >>"$S3_REPORT"
    warn "Could not verify S3 prefix $prefix (status $code)."
  fi
done
info "S3 validation report: $S3_REPORT"

info "SECTION F - DOMAIN VALIDATION"
DOMAIN_REPORT="$REPORT_DIR/domain-validation.txt"
: >"$DOMAIN_REPORT"
printf "Expected domains:\n- %s\n- %s\n" "$PROD_DOMAIN" "$PROD_DOMAIN_ALT" >>"$DOMAIN_REPORT"
if http_ok "$PROD_DOMAIN"; then
  printf "Primary domain reachable: OK\n" >>"$DOMAIN_REPORT"
else
  printf "Primary domain reachable: FAIL\n" >>"$DOMAIN_REPORT"
  warn "Primary domain $PROD_DOMAIN not reachable from this environment."
fi
if http_ok "$PROD_DOMAIN_ALT"; then
  printf "Alternate domain reachable: OK\n" >>"$DOMAIN_REPORT"
else
  printf "Alternate domain reachable: FAIL\n" >>"$DOMAIN_REPORT"
  warn "Alternate domain $PROD_DOMAIN_ALT not reachable from this environment."
fi

DOMAIN_SCAN="$REPORT_DIR/domain-scan.txt"
scan_refs 'resilience360\.vercel\.app|api\.sustainablesolution360\.com|http://localhost|https?://127\.0\.0\.1' "$DOMAIN_SCAN" \
  src public index.html vite.config.ts capacitor.config.ts android ios
if [[ -s "$DOMAIN_SCAN" ]]; then
  warn "Found potential old/localhost domain references. Review $DOMAIN_SCAN"
else
  info "No old/localhost domain refs found in production-critical paths."
fi

info "SECTION G - API VALIDATION"
API_SCAN="$REPORT_DIR/api-legacy-scan.txt"
scan_refs 'universal-cms|/api/content|/api/media|/api/disaster-dashboard|/api/materialhubs|/api/app/state|mongodb|mongo' \
  "$API_SCAN" src public dist
if [[ -s "$API_SCAN" ]]; then
  warn "Found legacy API/CMS references. Review $API_SCAN"
else
  info "No legacy API/CMS references found in src/public/dist for scanned patterns."
fi

info "SECTION H - SERVICE WORKER"
SW_REPORT="$REPORT_DIR/service-worker.txt"
: >"$SW_REPORT"
if [[ -f dist/sw.js && -f dist/manifest.webmanifest ]]; then
  printf "sw.js present: YES\nmanifest.webmanifest present: YES\n" >>"$SW_REPORT"
else
  printf "sw.js or manifest missing.\n" >>"$SW_REPORT"
  fail "Service worker files missing."
fi
if command -v rg >/dev/null 2>&1; then
  rg -n "registerType|autoUpdate|onNeedRefresh|controllerchange" src/main.tsx >>"$SW_REPORT" || true
  rg -n '"start_url"|"scope"' dist/manifest.webmanifest >>"$SW_REPORT" || true
fi
info "Service worker report: $SW_REPORT"

info "SECTION I - WEB DEPLOYMENT"
DEPLOY_REPORT="$REPORT_DIR/web-deploy.txt"
: >"$DEPLOY_REPORT"
if [[ "$DEPLOY_WITH_VERCEL" == "1" ]]; then
  if command -v vercel >/dev/null 2>&1 || npx --yes vercel@latest --version >/dev/null 2>&1; then
    vercel_args=(deploy --prod --yes)
    if [[ -n "${VERCEL_TOKEN:-}" ]]; then
      vercel_args+=(--token "$VERCEL_TOKEN")
    fi
    if [[ -n "${VERCEL_SCOPE:-}" ]]; then
      vercel_args+=(--scope "$VERCEL_SCOPE")
    fi
    if npx --yes vercel@latest "${vercel_args[@]}" | tee -a "$DEPLOY_REPORT"; then
      info "Vercel deployment command completed."
    else
      warn "Vercel deployment command failed. See $DEPLOY_REPORT"
    fi
  else
    warn "Vercel CLI unavailable. Skipping auto web deploy."
  fi
else
  warn "DEPLOY_WITH_VERCEL=0, skipping auto deployment."
fi
if http_ok "$PROD_DOMAIN"; then
  info "Production domain responds after deploy step."
else
  warn "Could not verify $PROD_DOMAIN response after deploy."
fi

info "SECTION J - POST DEPLOYMENT TESTS"
POST_REPORT="$REPORT_DIR/post-deploy-tests.txt"
: >"$POST_REPORT"
declare -a TEST_URLS=(
  "$PROD_DOMAIN/?view=learn-train"
  "$PROD_DOMAIN/?view=infra-models"
  "$PROD_DOMAIN/?view=material-hubs"
  "$PROD_DOMAIN/?view=best-practices"
  "$PROD_DOMAIN/?view=disaster-dashboard"
  "$PROD_DOMAIN/?view=live-earthquake-alerts"
  "$PROD_DOMAIN/?view=readiness-calculator"
  "$PROD_DOMAIN/?view=smart-construction"
  "$PROD_DOMAIN/?view=building-codes"
  "$PROD_DOMAIN/live-earthquake-alerts.html"
  "$PROD_DOMAIN/material-hubs/index.html"
  "$PROD_DOMAIN/disaster-dashboard/index.html"
)
for test_url in "${TEST_URLS[@]}"; do
  code="$(curl -L -sS -o /dev/null -w "%{http_code}" "$test_url" || true)"
  if [[ "$code" =~ ^2|^3 ]]; then
    printf "OK   [%s] %s\n" "$code" "$test_url" >>"$POST_REPORT"
  else
    printf "FAIL [%s] %s\n" "$code" "$test_url" >>"$POST_REPORT"
    warn "Post-deploy URL check failed ($code): $test_url"
  fi
done
if command -v rg >/dev/null 2>&1; then
  if rg -n "api\.sustainablesolution360\.com|/api/app/state|universal-cms" dist/live-earthquake-alerts.html >/dev/null 2>&1; then
    warn "Live Earthquake Alerts build still contains blocked API/CMS strings."
  else
    printf "Live Earthquake Alerts static API check: OK\n" >>"$POST_REPORT"
  fi
fi
info "Post-deploy test report: $POST_REPORT"

info "SECTION K - MOBILE PREPARATION"
MOBILE_REPORT="$REPORT_DIR/mobile-readiness.txt"
: >"$MOBILE_REPORT"
if command -v npx >/dev/null 2>&1; then
  npx cap doctor >>"$MOBILE_REPORT" 2>&1 || warn "npx cap doctor reported issues."
fi
if [[ -d android ]]; then
  printf "Android project: FOUND\n" >>"$MOBILE_REPORT"
  if [[ -f android/gradlew ]]; then
    printf "Android gradlew: FOUND\n" >>"$MOBILE_REPORT"
  else
    printf "Android gradlew: MISSING\n" >>"$MOBILE_REPORT"
    warn "android/gradlew is missing."
  fi
else
  printf "Android project: MISSING\n" >>"$MOBILE_REPORT"
  warn "Android project directory not found."
fi
if [[ -d ios ]]; then
  printf "iOS project: FOUND\n" >>"$MOBILE_REPORT"
  if command -v xcodebuild >/dev/null 2>&1; then
    xcodebuild -version >>"$MOBILE_REPORT" 2>&1 || warn "xcodebuild found but returned non-zero."
  else
    printf "xcodebuild unavailable in current environment.\n" >>"$MOBILE_REPORT"
    warn "xcodebuild not available (expected on non-macOS hosts)."
  fi
else
  printf "iOS project: MISSING\n" >>"$MOBILE_REPORT"
  warn "iOS project directory not found."
fi
info "Mobile readiness report: $MOBILE_REPORT"

info "Deployment reports directory: $REPORT_DIR"
if [[ "$OVERALL_STATUS" -ne 0 ]]; then
  fail "Deployment script completed with failures. Review reports."
  exit 1
fi

if [[ "$WARNINGS" -gt 0 ]]; then
  warn "Deployment script completed with warnings ($WARNINGS). Review reports."
else
  info "Deployment script completed successfully without warnings."
fi

exit 0
