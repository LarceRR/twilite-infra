#!/usr/bin/env bash
set -Eeuo pipefail
: "${DEPLOY_ENV:?set production or staging}"
: "${API_IMAGE_REPOSITORY:?set GHCR repository without tag}"
: "${API_IMAGE_DIGEST:?set immutable sha256 digest}"
: "${RELEASE_SHA:?set source commit SHA}"
: "${STATE_DIR:?set state directory}"
: "${SMOKE_URL:?set internal or protected smoke URL}"
DEPLOY_ROOT="${DEPLOY_ROOT:-/opt/twilite-infra}"
[[ "$DEPLOY_ENV" == production || "$DEPLOY_ENV" == staging ]] || { echo 'invalid deployment environment' >&2; exit 2; }
[[ "$API_IMAGE_REPOSITORY" =~ ^[A-Za-z0-9._/-]+$ ]] || { echo 'unsafe image repository' >&2; exit 2; }
[[ "$API_IMAGE_DIGEST" =~ ^sha256:[0-9a-f]{64}$ ]] || { echo 'digest required' >&2; exit 2; }
[[ "$RELEASE_SHA" =~ ^[0-9a-f]{7,64}$ ]] || { echo 'commit SHA required' >&2; exit 2; }
[[ "$SMOKE_URL" =~ ^https?://[A-Za-z0-9._:/-]+$ ]] || { echo 'unsafe smoke URL' >&2; exit 2; }
[[ -d "$DEPLOY_ROOT/infra/compose" ]] || { echo 'deployment contract missing' >&2; exit 1; }
case "$DEPLOY_ENV" in production) PROJECT_NAME="${PROD_PROJECT_NAME:-lumi-prod}"; COMPOSE_ENV="$DEPLOY_ROOT/infra/compose/production/compose.yaml";; staging) PROJECT_NAME="${STAGE_PROJECT_NAME:-lumi-staging}"; COMPOSE_ENV="$DEPLOY_ROOT/infra/compose/staging/compose.yaml";; esac
COMPOSE_BASE="$DEPLOY_ROOT/infra/compose/base/compose.yaml"
IMAGE_REF="${API_IMAGE_REPOSITORY}@${API_IMAGE_DIGEST}"
RELEASE_DIR="${STATE_DIR}/releases"; CURRENT_FILE="${STATE_DIR}/current.digest"; PREVIOUS_FILE="${STATE_DIR}/previous.digest"
mkdir -p "$RELEASE_DIR"; chmod 700 "$STATE_DIR"
compose=(docker compose --project-name "$PROJECT_NAME" --file "$COMPOSE_BASE" --file "$COMPOSE_ENV")
docker pull "$IMAGE_REF" >/dev/null
docker image inspect "$IMAGE_REF" --format '{{index .RepoDigests 0}}' | grep -Fq "$API_IMAGE_DIGEST"
mem_total="$(docker info --format '{{.MemTotal}}')"; [[ "$mem_total" =~ ^[0-9]+$ ]] && (( mem_total > 0 )) || exit 1
if [[ -f "$CURRENT_FILE" ]]; then cp --preserve=mode "$CURRENT_FILE" "$PREVIOUS_FILE"; fi
"${compose[@]}" run --rm --no-deps --entrypoint /app/bin/migrate api
"${compose[@]}" config --quiet
export API_IMAGE_REPOSITORY API_IMAGE_DIGEST RELEASE_SHA
"${compose[@]}" up -d --no-build --remove-orphans api
for attempt in $(seq 1 60); do container="$(${compose[@]} ps -q api)"; if [[ -n "$container" ]] && [[ "$(docker inspect --format '{{.State.Health.Status}}' "$container")" == healthy ]]; then break; fi; if (( attempt == 60 )); then echo 'readiness gate failed' >&2; exit 1; fi; sleep 2; done
curl --fail --silent --show-error --max-time 15 "$SMOKE_URL" >/dev/null
printf '%s\n' "$API_IMAGE_DIGEST" > "$CURRENT_FILE"
printf '%s\n' "$RELEASE_SHA" > "$RELEASE_DIR/${API_IMAGE_DIGEST#sha256:}.sha"
printf '%s\n' "{\"environment\":\"$DEPLOY_ENV\",\"release_sha\":\"$RELEASE_SHA\",\"image_digest\":\"$API_IMAGE_DIGEST\",\"result\":\"success\"}" > "$RELEASE_DIR/${API_IMAGE_DIGEST#sha256:}.json"
printf '%s\n' "deployed $DEPLOY_ENV release $RELEASE_SHA"
