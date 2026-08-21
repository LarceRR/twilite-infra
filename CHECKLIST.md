# twilite-infra implementation checklist (0% -> 100%)

Source: [LarceRR/Twilite#167](https://github.com/LarceRR/Twilite/issues/167). D1-D13 are binding. New contradictions go to issue #167 before code changes.

## Current status

**Code implementation: complete through password-only bootstrap architecture. Operational production readiness is blocked until real Linux VM acceptance passes.**

- CI typecheck and unit/security contract suites: required and green.
- Password-only fresh-VPS flow: implemented, interactive and secret-safe.
- Existing key bootstrap: backward-compatible.
- Real VM acceptance: must still be executed on clean Ubuntu with systemd, SSH, Docker, UFW and reboot.

## Password bootstrap requirements

- [x] Explicit `target.initialAuth.mode`: `key | password | auto`.
- [x] Legacy config with `identityPath` and no `initialAuth` remains compatible.
- [x] Interactive OpenSSH password prompt through TTY, no sshpass.
- [x] Password never enters argv, config, environment, logs or artifacts.
- [x] Fingerprint scanned and explicitly accepted before password authentication.
- [x] Generated local Ed25519 admin key is installed and verified before password session closes.
- [x] Password authentication is disabled only in final SSH hardening after key verification.
- [x] authorized_keys append-only/idempotent behavior preserves unrelated keys.
- [x] Wrong password, wrong fingerprint, interruption and injection contracts covered.

## Operational gates still required

- [ ] Clean WSL2 QEMU Ubuntu VM: create, boot and SSH readiness.
- [ ] Fresh VM password-only bootstrap to final key-only READY.
- [ ] Existing key bootstrap to READY.
- [ ] Wrong password/fingerprint abort with no destructive changes.
- [ ] Interrupted bootstrap resume and idempotent rerun.
- [ ] Docker/UFW/Fail2ban/systemd/reboot acceptance.
- [ ] OpenBao init/unseal/recovery and Raft restore.
- [ ] PostgreSQL backup/PITR restore with measured RPO/RTO.
- [ ] Full P0 chaos matrix with recovery and alert evidence.
- [ ] Two consecutive full DR drills.
- [ ] Scaling simulation with measured resources.

No real production VPS is declared ready until every operational gate passes. No password or private key belongs in Git.
