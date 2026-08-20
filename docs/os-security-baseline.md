# OS and security baseline

Phase 4 implements the host policy from issue #167. These files are rendered or copied by the provisioning steps; they are not instructions to edit a live VPS by hand.

## Network policy

UFW defaults to deny inbound and allow outbound. The SSH port comes from inventory. Public HTTP/HTTPS ports are inventory-driven and are **not opened** when `publicPorts` is empty. PostgreSQL, Redis, OpenBao and Docker TCP ports are rejected by config validation and never allowed by the baseline.

`TWILITE_FIREWALL_RESET=1` is required before UFW reset. A normal rerun is additive and safe; destructive reset is explicit. IPv6 is configured through the typed `security.ipv6` setting, never guessed.

## Docker policy

`daemon.json` exposes only `/var/run/docker.sock`, enables capped `json-file` rotation, keeps `live-restore`, disables the userland proxy and leaves iptables integration enabled. A systemd drop-in removes conflicting default `ExecStart` arguments and starts dockerd from the managed config. The Docker API is never bound to TCP.

## Fail2ban

The SSH jail reads the systemd journal, uses nftables multiport bans, and protects the final configured SSH port. Defaults are 3 SSH attempts, 10 minutes of observation and one-hour bans. Fail2ban is an alerting/self-healing layer, not a replacement for key-only SSH and UFW.

## OS controls

The baseline installs security updates, systemd-timesyncd, AppArmor tooling, auditd, UFW and Fail2ban; caps journald at 200 MiB with 14-day retention; enables unattended security updates without surprise reboot; and applies only measured sysctl controls.

## Verification

```bash
TWILITE_SSH_PORT=5564 TWILITE_PUBLIC_PORTS='80 443' /usr/local/sbin/twilite-apply-ufw
TWILITE_SSH_PORT=5564 /usr/local/sbin/twilite-verify-baseline
systemctl daemon-reload
systemctl restart docker
ss -lntup
ufw status verbose
fail2ban-client status sshd
```

The Phase 4 acceptance gate remains pending until these files are applied on the real Ubuntu VM, followed by an external port scan and a second idempotent provisioning run. No ordinary Docker container is acceptable evidence.
