# twilite-infra implementation checklist (0% -> 100%)

Source: [LarceRR/Twilite#167](https://github.com/LarceRR/Twilite/issues/167). Phase order follows §18.2; D1-D13 are binding. New contradictions go to issue #167 before code changes.

## Weighted progress

| Phase | Weight | Status |
|---|---:|---|
| 0 Repository and engineering foundation | 4% | unified PR #7 |
| 1 CLI foundation | 12% | unified PR #7 |
| 2 Linux VM harness | 10% | implementation, real-VM gate pending |
| 3 SSH/bootstrap | 10% | implementation, real-VM gate pending |
| 4 OS/security | 9% | implementation, real-VM gate pending |
| 5 Docker/runtime | 9% | implementation, real-VM gate pending |
| 6 OpenBao | 8% | implementation, recovery gate pending |
| 7 Application deployment | 8% | implementation, rollout gate pending |
| 8 PostgreSQL PITR | 8% | implementation, restore gate pending |
| 9 Monitoring/logging | 6% | implementation, alert gate pending |
| 10 Chaos/failure injection | 6% | implementation, real-VM gate pending |
| 11 Full DR | 6% | pending |
| 12 Scaling simulation | 4% | pending |

**Honest status: Phases 8-10 contracts, scripts and unit tests are implemented in unified PR #7. None of their real-VM acceptance gates are claimed complete.**

## Phase 8: PostgreSQL backup/PITR

- [x] pgBackRest base backup contract and external S3 repository.
- [x] WAL archiving intent with `archive_timeout=60s` and 180s freshness check.
- [x] Client-side cipher material supplied externally, never committed.
- [x] Retention 7d/4w/3m and single-job resource discipline.
- [x] Isolated restore script with download/decrypt/restore report.
- [x] Integrity and application smoke verification contract.
- [x] Cluster-wide PITR explicitly requires staging re-seed (D6).
- [ ] Real VM restore and measured RPO/RTO.
- [ ] Corrupt/missing backup detection drill.

## Phase 9: Monitoring/logging

- [x] Host, container, API, database, secret manager, WAL, restore and deployment metrics.
- [x] CPU/RAM/swap/disk/inode and restart-loop alerts.
- [x] API error, OpenBao sealed, external probe and WAL freshness alerts.
- [x] Independent dead-man heartbeat contract.
- [x] Owner, severity and runbook on every alert.
- [ ] Real VM alert delivery and secret-redaction acceptance.

## Phase 10: Chaos/failure injection

- [x] P0 scenario registry for all required failure classes.
- [x] Reproducible injection runner and artifact collector.
- [x] Scenario result contract includes detection, recovery, health, integrity and alert evidence.
- [ ] Execute every P0 scenario on clean real VM.
- [ ] Execute interrupted provisioning/resume at every major phase.
- [ ] Execute total VM loss recovery cycle.

## Remaining phases

Phase 11 implements the full DR drill twice; Phase 12 implements upgrade and scaling simulation. No real VPS before local acceptance, chaos and DR pass twice (D10).
