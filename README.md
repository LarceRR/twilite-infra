# twilite-infra

Provisioning CLI and infrastructure-as-code for Twilite/LumiApp, governed by [LarceRR/Twilite#167](https://github.com/LarceRR/Twilite/issues/167) and decisions D1-D13.

## Requirements

- Node.js >= 22.18.0 running inside Linux/WSL2 for infrastructure work
- CLI runtime dependencies: none
- acceptance uses real Ubuntu VMs, not ordinary Docker containers
- repository should live under `~/work`, not `/mnt/c` or `/mnt/d`, so Linux permissions work

## Fresh VPS password bootstrap

Supported. Production VPS may provide a non-root initial user with passwordless sudo; root SSH login is not required. Set `target.initialAuth.mode` to `password` and `target.initialUser` to the provider user (e.g. `vps`). Review the displayed SSH fingerprint, then let OpenSSH prompt for the provider password on the TTY. The password never enters CLI args, config, environment, logs or artifacts. After the generated Ed25519 admin key is verified, the password session closes and the rest of provisioning is key-only. See `docs/password-bootstrap.md` and `docs/ssh-bootstrap.md`.

## CLI

```bash
node src/cli/main.ts doctor
node src/cli/main.ts plan --config examples/config.production.json
TWILITE_ACCEPT_HOST_KEY=1 node src/cli/main.ts provision --config examples/config.production.json
node src/cli/main.ts resume --config examples/config.production.json
node src/cli/main.ts status --config examples/config.production.json
node src/cli/main.ts report --config examples/config.production.json
```

`plan` and `--dry-run` never connect or prompt. Real provisioning requires WSL2/Linux, explicit host fingerprint acceptance, and an interactive TTY for password bootstrap.

## WSL2 VM acceptance

```bash
make test:vm:doctor
make test:vm:create PROFILE=vps-2gb
make test:vm:provision
make test:vm:chaos CASE=api-kill
make test:vm:collect
make test:vm:destroy
```

Operational readiness is not claimed until the real-VM acceptance, chaos, PITR and two DR drills pass. No production VPS is required for debugging.
