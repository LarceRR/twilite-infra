# Runtime, OpenBao and deployment contracts

## Phase 5

`infra/compose/base` owns the constrained PostgreSQL, Redis and OpenBao instances. Production and staging are separate Compose projects with different external networks. PostgreSQL is logically isolated by database/role, Redis by ACL/prefix, and API containers receive only environment-specific Docker secrets. Production has 384 MiB/1 CPU and staging 192 MiB/0.25 CPU. Services use healthchecks and `unless-stopped`.

Images must use `repository@sha256:digest`; tag-only and `latest` deployment are rejected. The infrastructure image placeholders remain explicit until reviewed upstream digests are pinned.

## Phase 6

OpenBao uses TLS 1.3, Raft Integrated Storage, IPC_LOCK and scoped KV v2 policies. Production and staging policies are disjoint. Local Transit auto-unseal is outside the VM; production KMS replaces it. Root bootstrap material is external to Git and audit is enabled during bootstrap.

## Phase 7

`infra/deploy/deploy.sh` validates digest/SHA, pulls and verifies the image, checks capacity, runs fixed `/app/bin/migrate`, validates Compose, starts the new version, waits for health, runs protected smoke, then records the digest while retaining the previous known-good release. `rollback.sh` reuses the previous digest and never rebuilds code.

GitHub Actions runs staging first and production behind a protected environment with serialized concurrency. The workflow syncs only versioned deployment files over strict SSH; credentials remain protected secrets.

## Gate status

Phases 5-7 are implemented and statically/unit tested. Real-VM gates remain pending: Compose health/load, negative DB/Redis isolation, OpenBao recovery, migration-failure blocking and broken-release rollback. No production VPS is used.
