# Decision log mirror

Authoritative source: [LarceRR/Twilite#167](https://github.com/LarceRR/Twilite/issues/167). This mirror is not allowed to silently change architecture.

- **D1** WSL2 is the Linux execution host; acceptance uses real QEMU/KVM VMs inside WSL2. `/dev/kvm` is a hard preflight. QEMU TCG is degraded only, invalid for performance/RTO evidence. Incus is an interchangeable backend.
- **D2** CLI runtime is cross-platform; acceptance, chaos and DR are Linux-only through WSL2.
- **D3** OpenBao unseal mode is explicit: `transit | kms | manual`; local Transit lives outside the test VM.
- **D4** Storage uses an S3 abstraction; local MinIO with versioning/object-lock runs outside the test VM.
- **D5** Backup and migration jobs are 128 MiB each, mutually exclusive, drawn from OS reserve.
- **D6** One PostgreSQL cluster on 2 GiB; staging is expendable after PITR and re-seeded.
- **D7** `archive_timeout=60s`; freshness alert at 180s; RPO is measured.
- **D8** Keep `unless-stopped`; post-reboot convergence runs Compose and the health gate.
- **D9** Staging smoke uses a least-privilege OpenBao credential, not a weakened allowlist.
- **D10** LOCAL-DoD passes twice before any real VPS; PROD-DoD is later.
- **D11** TypeScript strict, Node >=22.18 type stripping, zero runtime dependencies.
- **D12** SSH uses OpenSSH argv, strict known_hosts, ControlMaster and atomic remote writes.
- **D13** pgBackRest + WAL/PITR to S3; pg_dump is secondary.

Any new contradiction must be recorded in issue #167 before implementation changes.
