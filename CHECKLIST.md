# twilite-infra implementation checklist (0% -> 100%)

Source: [LarceRR/Twilite#167](https://github.com/LarceRR/Twilite/issues/167). Phase order follows §18.2; D1-D13 are binding. New contradictions go to issue #167 before code changes.

## Weighted progress

| Phase | Weight | Status |
|---|---:|---|
| 0 Repository and engineering foundation | 4% | foundation in PR #1 |
| 1 CLI foundation | 12% | foundation in PR #1 |
| 2 Linux VM harness | 10% | PR #2, real-VM gate pending |
| 3 SSH/bootstrap | 10% | PR #3, real-VM gate pending |
| 4 OS/security | 9% | PR #4, real-VM gate pending |
| 5 Docker/runtime | 9% | implementation in PR #5, real-VM gate pending |
| 6 OpenBao | 8% | implementation in PR #5, recovery gate pending |
| 7 Application deployment | 8% | implementation in PR #5, rollout gate pending |
| 8 PostgreSQL PITR | 8% | pending |
| 9 Monitoring/logging | 6% | pending |
| 10 Chaos/failure injection | 6% | pending |
| 11 Full DR | 6% | pending |
| 12 Scaling simulation | 4% | pending |

**Honest status: Phases 5-7 are implemented and unit-tested; real-VM acceptance, isolation, OpenBao recovery and rollback gates are not claimed complete.**

## Phase 5: Docker/runtime baseline

- [x] 5.1 Digest-pinned Compose services and separate project names.
- [x] 5.2 Production/staging networks and Docker secrets are separate.
- [x] 5.3 PostgreSQL, Redis and OpenBao healthchecks.
- [x] 5.4 Resource limits match the 2 GiB budget.
- [x] 5.5 Restart policy, read-only API filesystem, dropped capabilities and no-new-privileges.
- [x] 5.6 API readiness endpoint contract.
- [x] 5.7 Production/staging logical isolation layout.
- [ ] 5.8 Real VM load test proves staging cannot starve production.
- [ ] 5.9 Real VM negative PostgreSQL/Redis cross-access tests.

## Phase 6: OpenBao

- [x] 6.1 TLS 1.3 listener and Raft Integrated Storage config.
- [x] 6.2 Explicit local Transit versus production KMS contract.
- [x] 6.3 Separate production/staging least-privilege policies.
- [x] 6.4 Audit enablement and root bootstrap from external secret file.
- [x] 6.5 Fail-closed deployment dependency contract.
- [ ] 6.6 Real VM init, seal/unseal and reboot recovery drill.
- [ ] 6.7 Real VM Raft snapshot save/restore.

## Phase 7: application deployment

- [x] 7.1 Immutable digest/SHA validation; `latest` rejected.
- [x] 7.2 Capacity check before rollout.
- [x] 7.3 Separate fixed migration step.
- [x] 7.4 Readiness and protected smoke gates.
- [x] 7.5 Previous known-good release retention.
- [x] 7.6 Automatic-failure stop contract and explicit rollback script.
- [x] 7.7 Staging first, production protected environment and concurrency.
- [ ] 7.8 Real VM broken-release automatic rollback.
- [ ] 7.9 Real VM migration failure blocks rollout.

## Remaining phases

Phase 8 implements pgBackRest/WAL/PITR; Phase 9 monitoring; Phase 10 chaos; Phase 11 DR; Phase 12 scaling. No real VPS before the complete local acceptance, chaos and DR cycle passes twice (D10).
