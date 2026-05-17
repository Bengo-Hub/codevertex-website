#!/usr/bin/env bash
# Codevertex Website — Build, Scan, Push & Deploy
# Mirrors auth-api / ordering-backend deployment pattern.
# DB migrations + seed run at container startup via scripts/entrypoint.sh
# using DIRECT_DATABASE_URL (direct postgres, not pgbouncer).

set -euo pipefail
set +H

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; }

APP_NAME=${APP_NAME:-"codevertex-website"}
NAMESPACE=${NAMESPACE:-"codevertex"}
ENV_SECRET_NAME=${ENV_SECRET_NAME:-"codevertex-website-secrets"}
DEPLOY=${DEPLOY:-true}
SETUP_DATABASES=${SETUP_DATABASES:-false}
DB_TYPES=${DB_TYPES:-postgres}
SERVICE_DB_NAME=${SERVICE_DB_NAME:-codevertex}
SERVICE_DB_USER=${SERVICE_DB_USER:-codevertex_user}

REGISTRY_SERVER=${REGISTRY_SERVER:-docker.io}
REGISTRY_NAMESPACE=${REGISTRY_NAMESPACE:-codevertex}
IMAGE_REPO="${REGISTRY_SERVER}/${REGISTRY_NAMESPACE}/${APP_NAME}"

DEVOPS_REPO=${DEVOPS_REPO:-"Bengo-Hub/devops-k8s"}
DEVOPS_DIR=${DEVOPS_DIR:-"$HOME/devops-k8s"}
VALUES_FILE_PATH=${VALUES_FILE_PATH:-"apps/${APP_NAME}/values.yaml"}

GIT_EMAIL=${GIT_EMAIL:-"dev@bengobox.com"}
GIT_USER=${GIT_USER:-"Codevertex Website Bot"}
TRIVY_ECODE=${TRIVY_ECODE:-0}

if [[ -z ${GITHUB_SHA:-} ]]; then
  GIT_COMMIT_ID=$(git rev-parse --short=8 HEAD || echo "localbuild")
else
  GIT_COMMIT_ID=${GITHUB_SHA::8}
fi

log_info "Service  : ${APP_NAME}"
log_info "Namespace: ${NAMESPACE}"
log_info "Image    : ${IMAGE_REPO}:${GIT_COMMIT_ID}"

SKIP_SCAN=${SKIP_SCAN:-false}

command -v git    >/dev/null || { log_error "git is required"; exit 1; }
command -v docker >/dev/null || { log_error "docker is required"; exit 1; }
if [[ ${SKIP_SCAN} != "true" ]]; then
  command -v trivy >/dev/null || { log_error "trivy is required (runs in CI); use SKIP_SCAN=true to bypass locally"; exit 1; }
fi
if [[ ${DEPLOY} == "true" ]]; then
  for tool in kubectl helm yq jq; do
    command -v "$tool" >/dev/null || { log_error "$tool is required"; exit 1; }
  done
fi

log_success "Prerequisite checks passed"

# =============================================================================
# Auto-sync secrets from devops-k8s
# =============================================================================
if [[ ${DEPLOY} == "true" ]]; then
  log_info "Checking and syncing required secrets from devops-k8s..."
  SYNC_SCRIPT=$(mktemp)
  if curl -fsSL https://raw.githubusercontent.com/Bengo-Hub/devops-k8s/main/scripts/tools/check-and-sync-secrets.sh -o "$SYNC_SCRIPT" 2>/dev/null; then
    source "$SYNC_SCRIPT"
    check_and_sync_secrets "REGISTRY_USERNAME" "REGISTRY_PASSWORD" "GIT_TOKEN" "POSTGRES_PASSWORD" "KUBE_CONFIG" || log_warn "Secret sync failed — continuing with existing secrets"
    rm -f "$SYNC_SCRIPT"
  else
    log_warn "Unable to download secret sync script — continuing with existing secrets"
  fi
fi

if [[ ${SKIP_SCAN} != "true" ]]; then
  log_info "Running Trivy filesystem scan"
  trivy fs . --exit-code "$TRIVY_ECODE" --format table || true
else
  log_warn "SKIP_SCAN=true — skipping Trivy scan"
fi

log_info "Building Docker image"
# NEXT_PUBLIC_* must be baked at build time for Next.js
DOCKER_BUILDKIT=1 docker build . -t "${IMAGE_REPO}:${GIT_COMMIT_ID}" \
  --build-arg NEXT_PUBLIC_TREASURY_TENANT="${NEXT_PUBLIC_TREASURY_TENANT:-codevertex}" \
  --build-arg NEXT_PUBLIC_SSO_URL="${NEXT_PUBLIC_SSO_URL:-https://accounts.codevertexitsolutions.com}" \
  --build-arg NEXT_PUBLIC_TREASURY_PAY_URL="${NEXT_PUBLIC_TREASURY_PAY_URL:-https://books.codevertexitsolutions.com/pay}"
log_success "Docker build complete: ${IMAGE_REPO}:${GIT_COMMIT_ID}"

if [[ ${DEPLOY} != "true" ]]; then
  log_warn "DEPLOY=false → skipping publish & deploy"
  exit 0
fi

if [[ -n ${REGISTRY_USERNAME:-} && -n ${REGISTRY_PASSWORD:-} ]]; then
  echo "$REGISTRY_PASSWORD" | docker login "$REGISTRY_SERVER" -u "$REGISTRY_USERNAME" --password-stdin
fi

docker push "${IMAGE_REPO}:${GIT_COMMIT_ID}"
log_success "Image pushed"

if [[ -n ${KUBE_CONFIG:-} ]]; then
  mkdir -p ~/.kube
  if echo "$KUBE_CONFIG" | base64 -d > ~/.kube/config 2>/dev/null; then
    log_info "KUBE_CONFIG decoded from base64"
  else
    echo "$KUBE_CONFIG" > ~/.kube/config
    log_info "KUBE_CONFIG used as raw content"
  fi
  chmod 600 ~/.kube/config
  export KUBECONFIG=~/.kube/config
fi

kubectl get ns "$NAMESPACE" >/dev/null 2>&1 || kubectl create ns "$NAMESPACE"

# Apply local dev secrets if present
if [[ -z ${CI:-}${GITHUB_ACTIONS:-} && -f KubeSecrets/devENV.yml ]]; then
  log_info "Applying local dev secrets"
  kubectl apply -n "$NAMESPACE" -f KubeSecrets/devENV.yml || log_warn "Failed to apply devENV.yml"
fi

# Registry credentials
if [[ -n ${REGISTRY_USERNAME:-} && -n ${REGISTRY_PASSWORD:-} ]]; then
  kubectl -n "$NAMESPACE" create secret docker-registry registry-credentials \
    --docker-server="$REGISTRY_SERVER" \
    --docker-username="$REGISTRY_USERNAME" \
    --docker-password="$REGISTRY_PASSWORD" \
    --dry-run=client -o yaml | kubectl apply -f - || log_warn "Registry secret creation failed"
fi

# =============================================================================
# Clone devops-k8s (needed for create-service-database + create-service-secrets)
# =============================================================================
if [[ ! -d "$DEVOPS_DIR" ]]; then
  TOKEN="${GH_PAT:-${GIT_SECRET:-${GITHUB_TOKEN:-}}}"
  CLONE_URL="https://github.com/${DEVOPS_REPO}.git"
  [[ -n $TOKEN ]] && CLONE_URL="https://x-access-token:${TOKEN}@github.com/${DEVOPS_REPO}.git"
  git clone "$CLONE_URL" "$DEVOPS_DIR" || log_warn "Unable to clone devops repo"
fi

# =============================================================================
# Provision Postgres database (idempotent, skips if already exists)
# =============================================================================
if [[ "$SETUP_DATABASES" == "true" && -n "${KUBE_CONFIG:-}" ]]; then
  if kubectl -n infra get statefulset postgresql >/dev/null 2>&1; then
    log_info "Waiting for PostgreSQL to be ready..."
    kubectl -n infra rollout status statefulset/postgresql --timeout=180s || log_warn "PostgreSQL not fully ready"

    if [[ -d "$DEVOPS_DIR" && -f "$DEVOPS_DIR/scripts/infrastructure/create-service-database.sh" ]]; then
      log_info "Provisioning database '${SERVICE_DB_NAME}' for ${APP_NAME}..."
      SERVICE_DB_NAME="$SERVICE_DB_NAME" \
      APP_NAME="$APP_NAME" \
      NAMESPACE="$NAMESPACE" \
      bash "$DEVOPS_DIR/scripts/infrastructure/create-service-database.sh" || log_warn "Database creation failed or already exists"
    else
      log_warn "create-service-database.sh not found — database should be created via devops-k8s infrastructure"
    fi
  else
    log_warn "PostgreSQL not found in infra namespace — skipping database provisioning"
  fi
fi

# =============================================================================
# Upsert standardized service secrets (POSTGRES_URL, DATABASE_*, etc.)
# =============================================================================
if [[ -d "$DEVOPS_DIR" && -f "$DEVOPS_DIR/scripts/infrastructure/create-service-secrets.sh" ]]; then
  log_info "Upserting secrets for ${APP_NAME}..."
  export KUBECONFIG="${KUBECONFIG:-$HOME/.kube/config}"
  SERVICE_NAME="$APP_NAME" \
  NAMESPACE="$NAMESPACE" \
  DB_NAME="$SERVICE_DB_NAME" \
  DB_USER="$SERVICE_DB_USER" \
  SECRET_NAME="$ENV_SECRET_NAME" \
  POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-}" \
  bash "$DEVOPS_DIR/scripts/infrastructure/create-service-secrets.sh" || log_warn "Secret upsert failed"
else
  log_warn "create-service-secrets.sh not available — using existing cluster secrets"
fi

# =============================================================================
# Patch secret with Prisma-specific keys:
#   DATABASE_URL        → pgbouncer URL (?pgbouncer=true) for Next.js runtime
#   DIRECT_DATABASE_URL → direct postgres URL for migrations (entrypoint.sh)
#   ANTHROPIC_API_KEY   → Vera AI chatbot
#
# These keys supplement the Go-style POSTGRES_URL written by create-service-secrets.sh.
# =============================================================================
if [[ -n "${KUBE_CONFIG:-}" ]] && kubectl get ns "$NAMESPACE" >/dev/null 2>&1; then
  log_info "Patching ${ENV_SECRET_NAME} with Prisma + AI keys..."

  PG_DIRECT_HOST="postgresql.infra.svc.cluster.local"
  PG_DIRECT_PORT="5432"
  PG_BOUNCER_HOST="pgbouncer.infra.svc.cluster.local"
  PG_BOUNCER_PORT="6432"

  url_encode() {
    python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1],safe=''))" "$1" 2>/dev/null \
      || printf '%s' "$1" | sed 's/!/%21/g; s/@/%40/g; s/:/%3A/g; s|/|%2F|g; s/?/%3F/g; s/#/%23/g'
  }

  DB_PASS="${POSTGRES_PASSWORD:-}"
  if [[ -z "$DB_PASS" ]] && kubectl get secret "$ENV_SECRET_NAME" -n "$NAMESPACE" >/dev/null 2>&1; then
    DB_PASS=$(kubectl get secret "$ENV_SECRET_NAME" -n "$NAMESPACE" \
      -o jsonpath="{.data.DATABASE_PASSWORD}" 2>/dev/null | base64 -d || echo "")
  fi

  ENCODED_PASS=$(url_encode "${DB_PASS}")

  DATABASE_URL="postgresql://${SERVICE_DB_USER}:${ENCODED_PASS}@${PG_BOUNCER_HOST}:${PG_BOUNCER_PORT}/${SERVICE_DB_NAME}?pgbouncer=true&sslmode=disable"
  DIRECT_DATABASE_URL="postgresql://${SERVICE_DB_USER}:${ENCODED_PASS}@${PG_DIRECT_HOST}:${PG_DIRECT_PORT}/${SERVICE_DB_NAME}?sslmode=disable"

  PATCH_JSON='{"data":{'
  PATCH_JSON+="\"DATABASE_URL\":\"$(echo -n "${DATABASE_URL}" | base64 -w0)\","
  PATCH_JSON+="\"DIRECT_DATABASE_URL\":\"$(echo -n "${DIRECT_DATABASE_URL}" | base64 -w0)\""
  [[ -n "${ANTHROPIC_API_KEY:-}" ]] && PATCH_JSON+=",\"ANTHROPIC_API_KEY\":\"$(echo -n "${ANTHROPIC_API_KEY}" | base64 -w0)\""
  PATCH_JSON+='}}'

  if kubectl get secret "$ENV_SECRET_NAME" -n "$NAMESPACE" >/dev/null 2>&1; then
    kubectl patch secret "$ENV_SECRET_NAME" -n "$NAMESPACE" --type merge -p "$PATCH_JSON" \
      && log_success "Patched ${ENV_SECRET_NAME} with DATABASE_URL / DIRECT_DATABASE_URL" \
      || log_warn "Secret patch failed"
  else
    log_info "Creating ${ENV_SECRET_NAME} with Prisma keys..."
    kubectl -n "$NAMESPACE" create secret generic "$ENV_SECRET_NAME" \
      --from-literal=DATABASE_URL="${DATABASE_URL}" \
      --from-literal=DIRECT_DATABASE_URL="${DIRECT_DATABASE_URL}" \
      ${ANTHROPIC_API_KEY:+--from-literal=ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY}"} \
      --dry-run=client -o yaml | kubectl apply -f - || log_warn "Secret creation failed"
  fi
fi

# =============================================================================
# Update Helm values (image tag) via devops-k8s centralized script
# =============================================================================
source "${DEVOPS_DIR}/scripts/helm/update-values.sh" 2>/dev/null || true
if declare -f update_helm_values >/dev/null 2>&1; then
  update_helm_values "$APP_NAME" "$GIT_COMMIT_ID" "$IMAGE_REPO"
else
  log_warn "update_helm_values not available — image tag in values.yaml not updated"
fi

log_success "Deployment pipeline complete for ${APP_NAME}:${GIT_COMMIT_ID}"
log_info "  Image     : ${IMAGE_REPO}:${GIT_COMMIT_ID}"
log_info "  Namespace : ${NAMESPACE}"
log_info "  Databases : ${SETUP_DATABASES} (${DB_TYPES})"
log_info "Migrations + seed run at container startup via scripts/entrypoint.sh"
