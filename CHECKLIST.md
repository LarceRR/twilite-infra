# twilite-infra implementation checklist (0% -> 100%)

Source: [LarceRR/Twilite#167](https://github.com/LarceRR/Twilite/issues/167). Phase order and gates follow §18.2. Decisions D1-D13 are binding. Any contradiction is logged in the issue before implementation changes.

## Weighted progress

| Phase | Weight | Status |
|---|---:|---|
| 0 Repository and engineering foundation | 4% | foundation in PR #1 |
| 1 CLI foundation | 12% | foundation in PR #1 |
| 2 Linux VM harness | 10% | implementation in PR #2, gate pending |
| 3 SSH/bootstrap | 10% | implementation in PR #3, VM gate pending |
| 4 OS/security | 9% | implementation in PR #4, VM gate pending |
| 5 Docker/runtime | 9% | pending |
| 6 OpenBao | 8% | pending |
| 7 Application deployment | 8% | pending |
| 8 PostgreSQL PITR | 8% | pending |
| 9 Monitoring/logging | 6% | pending |
| 10 Chaos/failure injection | 6% | pending |
| 11 Full DR | 6% | pending |
| 12 Scaling simulation | 4% | pending |

**Honest status: Phase 4 files and renderers are implemented and unit-tested; the VM acceptance gate is not passed until the real systemd Ubuntu VM proves exposure, reboot/idempotency and security behavior.**

## Phase 4: OS and security baseline

- [x] 4.1 Package baseline and full-upgrade script.
- [x] 4.2 UTC/NTP service enablement and reboot-safe systemd dependency.
- [x] 4.3 Explicit swap settings remain typed from Phase 1.
- [x] 4.4 UFW deny-in/allow-out with inventory-driven public ports.
- [x] 4.5 Fail2ban SSH jail using systemd journal and nftables.
- [x] 4.6 Journald retention and size caps.
- [x] 4.7 Docker Engine installation script and Unix-socket-only daemon policy.
- [x] 4.8 Docker log rotation, live-restore and systemd drop-in.
- [x] 4.9 Unattended security updates with automatic reboot disabled.
- [x] 4.10 AppArmor/auditd package and verification checks.
- [x] 4.11 Explicit IPv6 policy and measured sysctl baseline.
- [x] 4.12 Typed renderers and unit tests for negative exposure cases.
- [ ] 4.13 Reboot detection/reconnect integration test on real VM.
- [ ] 4.14 External port scan shows only intended public services.
- [ ] 4.15 Second provisioning run is idempotent on real VM.

**Gate:** external/VM-side scan shows only intended public services; second provisioning run produces no unintended changes.

## Phase 5 through 12

Separate PRs implement Docker/Compose runtime isolation, OpenBao, deployment/rollback, pgBackRest/PITR, monitoring, chaos, DR and scaling. No real VPS before local acceptance, chaos and DR gates pass twice (D10).
