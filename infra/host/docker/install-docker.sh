#!/usr/bin/env bash
set -Eeuo pipefail

export DEBIAN_FRONTEND=noninteractive
. /etc/os-release
[[ "$ID" == ubuntu ]] || { echo 'supported OS is Ubuntu' >&2; exit 2; }
arch="$(dpkg --print-architecture)"
case "$arch" in amd64|arm64) ;; *) echo "unsupported architecture: $arch" >&2; exit 2 ;; esac
install -d -m 0755 /etc/apt/keyrings
curl --fail --silent --show-error --location https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor --yes -o /etc/apt/keyrings/docker.gpg
chmod 0644 /etc/apt/keyrings/docker.gpg
printf 'deb [arch=%s signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu %s stable\n' "$arch" "$VERSION_CODENAME" > /etc/apt/sources.list.d/docker.list
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl daemon-reload
systemctl enable --now docker
