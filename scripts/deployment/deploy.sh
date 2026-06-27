#!/usr/bin/env bash
set -Eeuo pipefail

# One-shot deploy for Resilience360
# Usage:
#   ./deploy.sh
#   ./deploy.sh --branch main --app resilience360 --migrate none
#   ./deploy.sh --migrate all
#   ./deploy.sh --migrate homepage,retrofit,inframodels,infrapdf,bestpractices,portals
#
# Notes:
# - Runs from repository root
# - Installs dev deps (required for Vite/TypeScript build)
# - Loads .env into current shell for migration scripts and PM2 --update-env

APP_NAME="resilience360"
BRANCH="main"
MIGRATE="none" # none | all | comma list: homepage,retrofit,inframodels,infrapdf,bestpractices,portals
SKIP_PULL="false"
SKIP_SYNC="false"

usage() {
  cat <<'EOF'
Usage: ./deploy.sh [options]

Options:
  --app <name>          PM2 app name (default: resilience360)
  --branch <name>       Git branch to pull (default: main)
  --migrate <value>     none | all | comma list (homepage,retrofit,inframodels,infrapdf,bestpractices,portals)
  --skip-pull           Skip git fetch/pull
  --skip-sync           Skip disaster-dashboard sync step
  -h, --help            Show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --app)
      APP_NAME="${2:-}"
      shift 2
      ;;
    --branch)
      BRANCH="${2:-}"
      shift 2
      ;;
    --migrate)
      MIGRATE="${2:-none}"
      shift 2
      ;;
    --skip-pull)
      SKIP_PULL="true"
      shift
      ;;
    --skip-sync)
      SKIP_SYNC="true"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1"
      usage
      exit 1
      ;;
  esac
done

run() {
  echo
  echo "==> $*"
  "$@"
}

if [[ ! -f "package.json" ]]; then
  echo "Error: run this script from the project root (package.json not found)."
  exit 1
fi

if [[ "$SKIP_PULL" != "true" ]]; then
  run git fetch origin
  run git checkout "$BRANCH"
  run git pull --ff-only origin "$BRANCH"
fi

run npm install

if [[ -f ".env" ]]; then
  echo
  echo "==> Loading .env into shell"
  set -a
  # shellcheck disable=SC1091
  source ".env"
  set +a
else
  echo
  echo "==> Warning: .env not found in repo root; skipping env load"
fi

run npm run build

if [[ "$SKIP_SYNC" != "true" ]]; then
  run npm run disaster-dashboard:sync
fi

run_migration_if_selected() {
  local key="$1"
  local script="$2"
  if [[ "$MIGRATE" == "all" ]]; then
    run npm run "$script"
    return
  fi
  IFS=',' read -r -a parts <<<"$MIGRATE"
  for p in "${parts[@]}"; do
    local t
    t="$(echo "$p" | tr '[:upper:]' '[:lower:]' | xargs)"
    if [[ "$t" == "$key" ]]; then
      run npm run "$script"
      return
    fi
  done
}

if [[ "$MIGRATE" != "none" ]]; then
  run_migration_if_selected "homepage" "cms:homepage:static-to-s3"
  run_migration_if_selected "retrofit" "cms:retrofit:local-to-s3"
  run_migration_if_selected "inframodels" "cms:inframodels:static-to-s3"
  run_migration_if_selected "infrapdf" "cms:inframodels:pdf-static-to-s3"
  run_migration_if_selected "bestpractices" "cms:bestpractices:static-to-s3"
  run_migration_if_selected "portals" "cms:portals:smart-material:static-to-s3"
fi

run pm2 restart "$APP_NAME" --update-env
run pm2 save
run pm2 status

echo
echo "Deploy completed successfully."
