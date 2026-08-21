#!/usr/bin/env bash
set -Eeuo pipefail
: "${DR_DNS_PROVIDER_COMMAND:?set approved disposable DNS command}"
: "${DR_TEST_HOSTNAME:?set disposable test hostname}"
: "${DR_TEST_TARGET:?set restored endpoint}"
case "$DR_DNS_PROVIDER_COMMAND" in
  /*) ;;
  *) echo 'DNS provider command must be an absolute executable path' >&2; exit 2 ;;
esac
"$DR_DNS_PROVIDER_COMMAND" "$DR_TEST_HOSTNAME" "$DR_TEST_TARGET"
printf '%s\n' 'test DNS switched'
