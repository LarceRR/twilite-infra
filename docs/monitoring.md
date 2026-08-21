# Monitoring and logging contract

Monitoring is independent of the production VPS. The contract covers CPU, RAM, swap, disk, inodes, container restarts, API latency/errors, PostgreSQL, Redis, OpenBao seal state, WAL freshness, restore drills, deployments and external HTTPS probes.

Every alert has an owner, severity and runbook. The dead-man heartbeat is sent to an external endpoint every 60 seconds; missing heartbeats alert after three minutes. Structured application/provisioning logs remain redacted and Docker/journald retention is capped by Phase 4.

The local contract is in `src/core/monitoring/contracts.ts`; Prometheus rules are in `infra/monitoring/prometheus/alerts.yml`.
