# PostgreSQL backup and PITR contract

Phase 8 uses pgBackRest, not `pg_dump` alone. Base backups and continuous WAL archiving go to external S3-compatible storage, with client-side encryption, retention of 7 daily, 4 weekly and 3 monthly recovery points, and `archive_timeout=60s`.

The backup job is capped and de-prioritised with `nice`/`ionice`. Freshness is critical after 180 seconds. A backup is valid only after download, decrypt, isolated restore, integrity checks and application smoke. `pg_dump` may be added as a secondary logical export, never as the PITR source of truth.

PITR is cluster-wide on the constrained 2 GiB topology. Staging is expendable and must be re-seeded after production restore, per D6. RPO and RTO are measured in the restore report, not inferred from a successful upload.

```bash
PGBACKREST_CONFIG=/etc/pgbackrest/pgbackrest.conf \
PGBACKREST_STANZA=twilite \
PGBACKREST_REPO_CIPHER_PASS_FILE=/run/recovery/pgbackrest-cipher \
PGBACKREST_S3_ENDPOINT="$S3_ENDPOINT" \
PGBACKREST_S3_BUCKET="$S3_BUCKET" \
PGBACKREST_S3_REGION="$S3_REGION" \
BACKUP_REPORT_DIR=/var/lib/twilite-backup/reports \
bash infra/backups/pgbackrest/backup.sh
```

Never put the cipher file, S3 access material or recovered credentials in Git or a report.
