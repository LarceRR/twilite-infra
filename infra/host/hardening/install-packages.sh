#!/usr/bin/env bash
set -Eeuo pipefail

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get -y full-upgrade
apt-get install -y --no-install-recommends \
  ca-certificates curl gnupg jq apparmor apparmor-utils auditd \
  fail2ban ufw unattended-upgrades apt-listchanges systemd-timesyncd util-linux
systemctl enable --now systemd-timesyncd
systemctl enable --now fail2ban
systemctl enable apparmor
