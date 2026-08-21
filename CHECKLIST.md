# twilite-infra implementation checklist (0% -> 100%)

Source: [LarceRR/Twilite#167](https://github.com/LarceRR/Twilite/issues/167). Phase order follows §18.2; D1-D13 are binding. New contradictions go to issue #167 before code changes.

## Weighted progress

| Phase | Weight | Status |
|---|---:|---|
| 0 Repository and engineering foundation | 4% | code complete in unified PR #7 |
| 1 CLI foundation | 12% | code complete in unified PR #7 |
| 2 Linux VM harness | 10% | code complete, real-VM gate pending |
| 3 SSH/bootstrap | 10% | code complete, real-VM gate pending |
| 4 OS/security | 9% | code complete, real-VM gate pending |
| 5 Docker/runtime | 9% | code complete, real-VM gate pending |
| 6 OpenBao | 8% | code complete, recovery gate pending |
| 7 Application deployment | 8% | code complete, rollout gate pending |
| 8 PostgreSQL PITR | 8% | code complete, restore gate pending |
| 9 Monitoring/logging | 6% | code complete, alert gate pending |
| 10 Chaos/failure injection | 6% | code complete, real-VM gate pending |
| 11 Full DR | 6% | code complete, two-drill gate pending |
| 12 Scaling simulation | 4% | code complete, simulation gate pending |

**Code/planning coverage: 100%. Operational acceptance: not complete until the required WSL2 VM, chaos and DR gates pass twice. No VPS is used.**

## Phase 11: Full DR

- [x] Ordered disposable-VPS loss and replacement sequence.
- [x] External OpenBao recovery material restore.
- [x] PostgreSQL base+WAL restore and immutable release restore.
- [x] Health smoke and disposable DNS switch contract.
- [x] Report contract with measured RPO/RTO and undocumented-action detection.
- [ ] Execute drill 1 on clean real VM.
- [ ] Execute drill 2 after corrections on a second clean real VM.

## Phase 12: Upgrade/scaling

- [x] Inventory-driven 2 GiB, larger-host, split-data and multi-API profiles.
- [x] Measurable scaling triggers and ordered migration path.
- [x] Target-group-compatible role model and OpenBao 3-node HA rule.
- [x] Resource/profile change does not change application release contract.
- [ ] Run real VM profile simulation and record resource measurements.

## Definition of Done

The repository now contains the complete implementation contract from 0% to 100%. The issue is operationally done only after local acceptance, idempotency, failure injection, chaos, PITR, OpenBao recovery, two consecutive DR drills and scaling simulation pass on real Linux VMs through WSL2. A real VPS remains blocked until then.
