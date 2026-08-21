# Chaos and failure-injection contract

`infra/chaos/scenarios.yml` is the P0 matrix required by issue #167. Run one scenario at a time from a clean real Linux VM. Ordinary containers are not acceptance evidence. Each run writes scenario, injection status and timestamps; `collect.sh` gathers Docker, journald, listening-port and scenario artifacts without secrets.

```bash
CHAOS_REPO_ROOT="$PWD" CHAOS_REPORT_DIR=.artifacts/chaos \
CHAOS_SCENARIO=api-kill PROD_API_CONTAINER=lumi-prod-api \
bash infra/chaos/run.sh

CHAOS_REPORT_DIR=.artifacts/chaos CHAOS_COLLECT_DIR=.artifacts/chaos-collected \
bash infra/chaos/collect.sh
```

P0 scenarios include process/dependency crashes, VM reboot, network/S3/disk/memory pressure, bad release, failed migration, unreadable secret, corrupted/failed restore, interrupted provisioning, partial rerun and total VM loss. Every scenario must end with health, integrity, detection, recovery and alert evidence before the local DoD can pass.
