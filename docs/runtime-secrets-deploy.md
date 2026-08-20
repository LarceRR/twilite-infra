# Runtime, OpenBao and deployment contracts

## Phase 5: runtime

`infra/compose/base` owns the single constrained PostgreSQL, Redis and OpenBao instances. `production` and `staging` are separate Compose projects and attach to different external networks. PostgreSQL is logically isolated by database/role, Redis by ACL/prefix, and the API containers receive only their environment's Docker secrets. Production has 384 MiB and 1 CPU; staging has 192 MiB and 0.25 CPU. All critical services have healthchecks and `unless-stopped`.

Every application image must be addressed as `repository@sha256:digest`. `latest` and tag-only deployment are rejected by the release validator. The Compose files intentionally contain `REPLACE_WITH_REVIEWED_DIGEST` placeholders until the exact upstream image digests are reviewed and pinned in the release change.

## Phase 6: OpenBao

OpenBao uses TLS, Raft Integrated Storage, IPC_LOCK, audit enablement during bootstrap, and scoped KV v2 policies. Production and staging policies are disjoint. Local Transit auto-unseal is outside the VM; production KMS replaces it. Root bootstrap material is supplied from root-only files outside Git.

## Phase 7: deployment

`infra/deploy/deploy.sh` is the target-side contract. It validates the digest and commit SHA, pulls and verifies the image, checks Docker capacity, runs `/app/bin/migrate` separately, starts the new container, waits for the container healthcheck and protected smoke URL, then records the digest while retaining the previous known-good release. `rollback.sh` reuses the previous digest and never rebuilds code.

GitHub Actions is the control plane: staging runs first, production is a separate protected environment with serialized concurrency. The workflow syncs only the versioned deployment contract over strict SSH; credentials are GitHub protected secrets or Docker secrets and are never committed.

## Gate status

Phases 5-7 are implemented and statically/unit tested. Their acceptance gates remain pending until the real Ubuntu systemd VM proves Compose health, production/staging negative isolation, OpenBao recovery, immutable deploy, migration failure blocking and broken-release rollback. No production VPS is used.
