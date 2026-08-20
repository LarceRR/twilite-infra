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
| 5 Docker/runtime | 9% | PR #6, real-VM gate pending |
| 6 OpenBao | 8% | PR #6, recovery gate pending |
| 7 Application deployment | 8% | PR #6, rollout gate pending |
| 8 PostgreSQL PITR | 8% | pending |
| 9 Monitoring/logging | 6% | pending |
| 10 Chaos/failure injection | 6% | pending |
| 11 Full DR | 6% | pending |
| 12 Scaling simulation | 4% | pending |

**Honest status: Phases 5-7 are implemented and unit-tested; real-VM acceptance, isolation, OpenBao recovery and rollback gates are not complete.**

## Phase 5

- [x] Digest-pinned Compose and separate project names.
- [x] Separate production/staging networks and Docker secret files.
- [x] Healthchecks, restart policy, read-only API FS, dropped caps and no-new-privileges.
- [x] Resource limits matching the 2 GiB budget.
- [x] Logical production/staging isolation layout.
- [ ] Real VM load and negative cross-access tests.

## Phase 6

- [x] TLS 1.3 and Raft Integrated Storage.
- [x] Explicit Transit/KMS contract.
- [x] Separate least-privilege policies.
- [x] Audit bootstrap and external root material.
- [ ] Real VM seal/unseal, reboot and Raft snapshot restore.

## Phase 7

- [x] Immutable digest/SHA validation; latest rejected.
- [x] Capacity, migration, readiness and protected smoke gates.
- [x] Previous release retention and explicit rollback.
- [x] Staging-first protected production workflow with concurrency.
- [ ] Real VM broken-release rollback and migration failure acceptance.

No real VPS before local acceptance, chaos and DR pass twice (D10).
