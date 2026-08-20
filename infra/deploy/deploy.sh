#!/usr/bin/env bash
set -Eeuo pipefail

: "${DEPLOY_ENV:?set production or staging}"
: "${API_IMAGE_REPOSITORY:?set GHCR repository without tag}"
: "${API_IMAGE_DIGEST:?set immutable sha256 digest}"
: "${RELEASE_SHA:?set source commit SHA}"
: "${STATE_DIR:?set state directory}"
: "${SMOKE_URL:?set internal or protected smoke URL}"

[[ "$DEPLOY_ENV" == production || "$DEPLOY_ENV" == staging ]] || { echo 'DEPLOY_ENV must be production or staging' >&2; exit 2; }
[[ "$API_IMAGE_REPOSITORY" =~ ^[A-Za-z0-9._/-]+$ ]] || { echo 'API_IMAGE_REPOSITORY contains unsafe characters' >&2; exit 2; }
[[ "$API_IMAGE_DIGEST" =~ ^sha256:[0-9a-f]{64}$ ]] || { echo 'API_IMAGE_DIGEST must be a sha256 digest' >&2; exit 2; }
[[ "$RELEASE_SHA" =~ ^[0-9a-f]{7,64}$ ]] || { echo 'RELEASE_SHA must be a hexadecimal commit SHA' >&2; exit 2; }
[[ "$SMOKE_URL" =~ ^https?://[A-Za-z0-9._:/-]+$ ]] || { echo 'SMOKE_URL is not an allowed URL shape' >&2; exit 2; }

case "$DEPLOY_ENV" in
  production) PROJECT_NAME="${PROD_PROJECT_NAME:-lumi-prod}"; COMPOSE_ENV="infra/compose/production/compose.yaml" ;;
  staging) PROJECT_NAME="${STAGE_PROJECT_NAME:-lumi-staging}"; COMPOSE_ENV="infra/compose/staging/compose.yaml" ;;
esac
COMPOSE_BASE="infra/compose/base/compose.yaml"
IMAGE_REF="${API_IMAGE_REPOSITORY}@${API_IMAGE_DIGEST}"
RELEASE_DIR="${STATE_DIR}/releases"
CURRENT_FILE="${STATE_DIR}/current.digest"
PREVIOUS_FILE="${STATE_DIR}/previous.digest"

mkdir -p "$RELEASE_DIR"
chmod 700 "$STATE_DIR"
compose=(docker compose --project-name "$PROJECT_NAME" --file "$COMPOSE_BASE" --file "$COMPOSE_ENV")

# 1-2. Resolve and verify an immutable release.
docker pull "$IMAGE_REF" >/dev/null
docker image inspect "$IMAGE_REF" --format '{{index .RepoDigests 0}}' | grep -Fq "$API_IMAGE_DIGEST"

# 3. Verify target capacity before touching the running release.
mem_total="$(docker info --format '{{.MemTotal}}')"
[[ "$mem_total" =~ ^[0-9]+$ ]] && (( mem_total > 0 )) || { echo 'unable to read Docker memory capacity' >&2; exit 1; }

# Preserve the previous known-good release.
if [[ -f "$CURRENT_FILE" ]]; then cp --preserve=mode "$CURRENT_FILE" "$PREVIOUS_FILE"; fi

# 5-6. Migration is a fixed expand/contract contract, never arbitrary shell.
"${compose[@]}" run --rm --no-deps --entrypoint /app/bin/migrate api
"${compose[@]}" config --quiet

# 7-8. Start the new release and wait for readiness.
export API_IMAGE_REPOSITORY API_IMAGE_DIGEST RELEASE_SHA
"${compose[@]}" up -d --no-build --remove-orphans api
for attempt in $(seq 1 60); do
  container="$(${compose[@]} ps -q api)"
  if [[ -n "$container" ]] && [[ "$(docker inspect --format '{{.State.Health.Status}}' "$container")" == healthy ]]; then break; fi
  if (( attempt == 60 )); then echo 'new release did not become healthy' >&2; exit 1; fi
  sleep 2
done

# 9. Smoke gate. Credentials are protected env/Docker secrets, never logged.
curl --fail --silent --show-error --max-time 15 "$SMOKE_URL" >/dev/null

# 10-11. Record release metadata without credentials.
printf '%s\n' "$API_IMAGE_DIGEST" > "$CURRENT_FILE"
printf '%s\n' "$RELEASE_SHA" > "$RELEASE_DIR/${API_IMAGE_DIGEST#sha256:}.sha"
printf '%s\n' "{\"environment\":\"$DEPLOY_ENV\",\"release_sha\":\"$RELEASE_SHA\",\"image_digest\":\"$API_IMAGE_DIGEST\",\"result\":\"success\"}" > "$RELEASE_DIR/${API_IMAGE_DIGEST#sha256:}.json"
printf '%s\n' "deployed $DEPLOY_ENV release $RELEASE_SHA"
