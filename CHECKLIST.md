# twilite-infra implementation checklist (0% -> 100%)

Source: [LarceRR/Twilite#167](https://github.com/LarceRR/Twilite/issues/167). Phase order and gates follow §18.2. Decisions D1-D13 are binding. Any contradiction is logged in the issue before implementation changes.

## Weighted progress

| Phase | Weight | Status |
|---|---:|---|
| 0 Repository and engineering foundation | 4% | done after PR #1 checks pass |
| 1 CLI foundation | 12% | done after PR #1 checks pass |
| 2 Linux VM harness | 10% | implementation in progress, gate not passed |
| 3 SSH/bootstrap | 10% | next |
| 4 OS/security | 9% | pending |
| 5 Docker/runtime | 9% | pending |
| 6 OpenBao | 8% | pending |
| 7 Application deployment | 8% | pending |
| 8 PostgreSQL PITR | 8% | pending |
| 9 Monitoring/logging | 6% | pending |
| 10 Chaos/failure injection | 6% | pending |
| 11 Full DR | 6% | pending |
| 12 Scaling simulation | 4% | pending |

**Honest status: Phase 0/1 code is in PR #1. Phase 2 is not called complete until a real Ubuntu VM boots and the lifecycle is repeated from WSL2.**

## Phase 2: Linux VM harness

- [x] 2.1 QEMU/KVM backend inside WSL2; backend interface is pluggable.
- [x] 2.2 `/dev/kvm` detection and explicit TCG degraded mode.
- [x] 2.3 Ubuntu 24.04 cloud image download with official SHA256 verification.
- [x] 2.4 Ephemeral create/start/stop/reboot/reset/destroy lifecycle primitives.
- [x] 2.5 cloud-init seed with a throwaway Ed25519 key and Ubuntu test user.
- [ ] 2.6 Clean snapshot reset, guest SSH readiness, console/SSH artifact collector.
- [ ] 2.7 Full acceptance command sequence on a real VM, including reboot and repeat-from-clean.

**Gate:** real VM acceptance run is repeatable from Windows via WSL2 with no manual SSH repair. TCG can prove functional behavior only, never performance or RTO.

## Phase 3 through 12

Separate PRs implement SSH/bootstrap, OS hardening, Docker/Compose, OpenBao, deployment/rollback, pgBackRest/PITR, monitoring, chaos, DR and scaling. No real VPS before local acceptance, chaos and DR gates pass twice (D10).
