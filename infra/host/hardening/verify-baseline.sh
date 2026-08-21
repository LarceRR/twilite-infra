#!/usr/bin/env bash
set -Eeuo pipefail

SSH_PORT="${TWILITE_SSH_PORT:-5564}"
[[ "$SSH_PORT" =~ ^[0-9]+$ ]] && (( SSH_PORT >= 1 && SSH_PORT <= 65535 )) || exit 2

command -v ufw >/dev/null
command -v fail2ban-client >/dev/null
command -v docker >/dev/null
command -v aa-enabled >/dev/null
ufw status | grep -q "${SSH_PORT}/tcp"
fail2ban-client status sshd >/dev/null
docker info --format '{{json .SecurityOptions}}' >/dev/null
aa-enabled >/dev/null
sshd -t
ss -lntup
printf '%s\n' 'twilite OS/security baseline verification passed'
