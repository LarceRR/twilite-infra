#!/usr/bin/env bash
set -Eeuo pipefail

: "${DEPLOY_ENV:?set production or staging}"
: "${API_IMAGE_REPOSITORY:?set GHCR repository without tag}"
: "${STATE_DIR:?set state directory}"
: "${SMOKE_URL:?set protected smoke URL}"

case "$DEPLOY_ENV" in
  production) PROJECT_NAME="${PROD_PROJECT_NAME:-lumi-prod}"; COMPOSE_ENV="infra/compose/production/compose.yaml" ;;
  staging) PROJECT_NAME="${STAGE_PROJECT_NAME:-lumi-staging}"; COMPOSE_ENV="infra/compose/staging/compose.yaml" ;;
  *) echo 'DEPLOY_ENV must be production or staging' >&2; exit 2 ;;
esac
PREVIOUS_FILE="${STATE_DIR}/previous.digest"
[[ -s "$PREVIOUS_FILE" ]] || { echo 'no previous known-good release is recorded' >&2; exit 1; }
API_IMAGE_DIGEST="$(<"$PREVIOUS_FILE")"
[[ "$API_IMAGE_DIGEST" =~ ^sha256:[0-9a-f]{64}$ ]] || { echo 'previous release state is invalid' >&2; exit 1; }
export API_IMAGE_REPOSITORY API_IMAGE_DIGEST RELEASE_SHA="rollback-${API_IMAGE_DIGEST#sha256:}" 

compose=(docker compose --project-name "$PROJECT_NAME" --file infra/compose/base/compose.yaml --file "$COMPOSE_ENV")
docker pull "${API_IMAGE_REPOSITORY}@${API_IMAGE_DIGEST}" >/dev/null
"${compose[@]}" config --quiet
"${compose[@]}" up -d --no-build --remove-orphans api
for attempt in $(seq 1 60); do
  container="$(${compose[@]} ps -q api)"
  if [[ -n "$container" ]] && [[ "$(docker inspect --format '{{.State.Health.Status}}' "$container")" == healthy ]]; then break; fi
  if (( attempt == 60 )); then echo 'rollback release did not become healthy' >&2; exit 1; fi
  sleep 2
done
curl --fail --silent --show-error --max-time 15 "$SMOKE_URL" >/dev/null
printf '%s\n' "$API_IMAGE_DIGEST" > "${STATE_DIR}/current.digest"
printf '%s\n' "rollback succeeded to $API_IMAGE_DIGEST"
