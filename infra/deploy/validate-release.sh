#!/usr/bin/env bash
set -Eeuo pipefail
: "${API_IMAGE_DIGEST:?set digest}"
: "${RELEASE_SHA:?set commit SHA}"
[[ "$API_IMAGE_DIGEST" =~ ^sha256:[0-9a-f]{64}$ ]] || { echo 'mutable or malformed image reference rejected' >&2; exit 2; }
[[ "$RELEASE_SHA" =~ ^[0-9a-f]{7,64}$ ]] || { echo 'malformed release SHA rejected' >&2; exit 2; }
if [[ "${API_IMAGE_REFERENCE:-}" == *latest* ]]; then echo 'latest is forbidden' >&2; exit 2; fi
printf '%s\n' 'immutable release metadata accepted'
