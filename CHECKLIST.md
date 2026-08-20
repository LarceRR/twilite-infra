# twilite-infra implementation checklist (0% -> 100%)

Source: [LarceRR/Twilite#167](https://github.com/LarceRR/Twilite/issues/167). Phase order and gates follow §18.2. Decisions D1-D13 are binding. Any contradiction is logged in the issue before implementation changes.

## Weighted progress

| Phase | Weight | Status |
|---|---:|---|
| 0 Repository and engineering foundation | 4% | done |
| 1 CLI foundation | 12% | done |
| 2 Linux VM harness | 10% | in progress, scaffolded |
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

**Honest status: 16% implemented and unit-tested. Phase 2 is intentionally not marked complete until its VM gate passes.**

## Phase 0: repository foundation

- [x] 0.1 Repository scaffold and §17 directory layout.
- [x] 0.2 Zero runtime dependencies, Node >=22.18.
- [x] 0.3 TypeScript strict + erasableSyntaxOnly.
- [x] 0.4 Configurable lint/typecheck/test commands.
- [ ] 0.5 CI artifact upload without secrets.
- [ ] 0.6 WSL2 command documentation and Makefile.

Gate: clean clone `npm ci && npm run check`.

## Phase 1: CLI foundation

- [x] 1.1 Typed configuration model and defaults.
- [x] 1.2 Path-aware dependency-free validation.
- [x] 1.3 D5 resource budget assertions.
- [x] 1.4 Legal provisioning state machine.
- [x] 1.5 Step contract precheck/apply/verify/rollback.
- [x] 1.6 Result/error taxonomy.
- [x] 1.7 Bounded exponential retry with jitter.
- [x] 1.8 Safe Ctrl+C cancellation.
- [x] 1.9 Atomic state persistence and run locking.
- [x] 1.10 Resume/reset/reinstall and config fingerprints.
- [x] 1.11 Dry-run enforced centrally by runner.
- [x] 1.12 JSONL logging and redaction.
- [x] 1.13 Human and machine reports.
- [x] 1.14 CLI parser and command dispatcher.
- [x] 1.15 Unit tests for success and negative paths.

Gate: injected failures resume without corrupting state.

## Phase 2: Linux VM harness

- [ ] 2.1 QEMU/KVM backend inside WSL2; Incus adapter.
- [ ] 2.2 `/dev/kvm` hard preflight and TCG degraded mode.
- [ ] 2.3 Ubuntu cloud image checksum and cache.
- [ ] 2.4 Ephemeral create/start/stop/reboot/destroy lifecycle.
- [ ] 2.5 cloud-init seed with SSH/systemd and no preinstalled Docker.
- [ ] 2.6 clean snapshot reset, fixtures and artifact collector.
- [ ] 2.7 reproducible commands: create, provision, failure injection, collect, destroy, repeat.

Gate: real VM acceptance run is repeatable from Windows via WSL2 with no manual SSH repair.

## Phase 3 through 12

The remaining 75% is split into separate PRs: SSH/bootstrap, OS hardening, Docker/Compose, OpenBao, deployment/rollback, pgBackRest/PITR, monitoring, chaos, DR and scaling. No real VPS before local acceptance, chaos and DR gates pass twice (D10).
