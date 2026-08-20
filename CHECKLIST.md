# twilite-infra implementation checklist (0% -> 100%)

Source: [LarceRR/Twilite#167](https://github.com/LarceRR/Twilite/issues/167). Phase order and gates follow §18.2. Decisions D1-D13 are binding. Any contradiction is logged in the issue before implementation changes.

## Weighted progress

| Phase | Weight | Status |
|---|---:|---|
| 0 Repository and engineering foundation | 4% | foundation in PR #1 |
| 1 CLI foundation | 12% | foundation in PR #1 |
| 2 Linux VM harness | 10% | implementation in PR #2, gate pending |
| 3 SSH/bootstrap | 10% | implementation in PR #3, VM gate pending |
| 4 OS/security | 9% | pending |
| 5 Docker/runtime | 9% | pending |
| 6 OpenBao | 8% | pending |
| 7 Application deployment | 8% | pending |
| 8 PostgreSQL PITR | 8% | pending |
| 9 Monitoring/logging | 6% | pending |
| 10 Chaos/failure injection | 6% | pending |
| 11 Full DR | 6% | pending |
| 12 Scaling simulation | 4% | pending |

**Honest status: Phase 3 code is implemented and unit-tested; its acceptance gate is not passed until the real systemd/SSH Ubuntu VM runs the full bootstrap, interruption and reboot checks.**

## Phase 2: Linux VM harness

- [x] 2.1 QEMU/KVM backend inside WSL2; backend interface is pluggable.
- [x] 2.2 `/dev/kvm` detection and explicit TCG degraded mode.
- [x] 2.3 Ubuntu 24.04 cloud image download with official SHA256 verification.
- [x] 2.4 Ephemeral create/start/stop/reboot/reset/destroy lifecycle primitives.
- [x] 2.5 cloud-init seed with a throwaway Ed25519 key and Ubuntu test user.
- [ ] 2.6 Clean snapshot reset, guest SSH readiness, console/SSH artifact collector.
- [ ] 2.7 Full acceptance command sequence on a real VM, including reboot and repeat-from-clean.

**Gate:** real VM acceptance run is repeatable from Windows via WSL2 with no manual SSH repair. TCG can prove functional behavior only, never performance or RTO.

## Phase 3: SSH/bootstrap

- [x] 3.1 OpenSSH transport with `BatchMode`, strict `known_hosts`, ControlMaster and argv-only process construction.
- [x] 3.2 Mandatory process timeouts, cancellation, exit classification and atomic remote writes.
- [x] 3.3 Initial access probe and admin user creation path.
- [x] 3.4 Host fingerprint capture and explicit trust function.
- [x] 3.5 Ed25519 admin key generation, collision-safe names and private mode validation.
- [x] 3.6 Admin authorized key and sudoers installation rendering.
- [x] 3.7 Verify admin SSH + sudo before access-changing hardening.
- [x] 3.8 Transitional new-port policy, final-port verification, then root SSH disable.
- [x] 3.9 SSH hardening renderer for MaxAuthTries, idle timeout, MaxSessions, forwarding, passwords and root login.
- [ ] 3.10 Interrupted bootstrap acceptance test on the real VM.
- [ ] 3.11 Final admin path survives VM reboot acceptance test.

**Gate:** fresh VM stays reachable through the final admin path after every hardening step and after reboot.

## Phase 4 through 12

Separate PRs implement OS hardening, Docker/Compose, OpenBao, deployment/rollback, pgBackRest/PITR, monitoring, chaos, DR and scaling. No real VPS before local acceptance, chaos and DR gates pass twice (D10).
