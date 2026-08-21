#!/usr/bin/env bash
set -Eeuo pipefail
# Filters a stream for operational export. It never attempts to recover or print secret values.
sed -E 's/(authorization|password|token|secret|api[_-]?key|private[_-]?key)[[:space:]]*[:=][[:space:]]*[^ ,;]+/\1=[REDACTED]/Ig; s/(Bearer|Basic)[[:space:]]+[^ ]+/\1 [REDACTED]/Ig'
