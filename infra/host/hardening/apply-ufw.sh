#!/usr/bin/env bash
set -Eeuo pipefail

SSH_PORT="${TWILITE_SSH_PORT:-5564}"
PUBLIC_PORTS="${TWILITE_PUBLIC_PORTS:-}"
RESET="${TWILITE_FIREWALL_RESET:-0}"
IPV6="${TWILITE_IPV6:-no}"

[[ "$SSH_PORT" =~ ^[0-9]+$ ]] && (( SSH_PORT >= 1 && SSH_PORT <= 65535 )) || { echo 'invalid TWILITE_SSH_PORT' >&2; exit 2; }
[[ "$IPV6" == yes || "$IPV6" == no ]] || { echo 'TWILITE_IPV6 must be yes or no' >&2; exit 2; }

if [[ "$RESET" == 1 ]]; then
  echo 'firewall reset explicitly requested'
  ufw --force reset
elif [[ "$RESET" != 0 ]]; then
  echo 'TWILITE_FIREWALL_RESET must be 0 or 1' >&2
  exit 2
fi

ufw default deny incoming
ufw default allow outgoing
ufw delete allow 22/tcp >/dev/null 2>&1 || true
ufw allow "$SSH_PORT"/tcp comment 'twilite ssh'
for port in $PUBLIC_PORTS; do
  [[ "$port" =~ ^[0-9]+$ ]] && (( port >= 1 && port <= 65535 )) || { echo "invalid public port: $port" >&2; exit 2; }
  [[ "$port" != "$SSH_PORT" ]] && ufw allow "$port"/tcp comment 'twilite public'
done
ufw --force enable
ufw status verbose
