# twilite-infra

Provisioning CLI and infrastructure-as-code for Twilite/LumiApp, governed by [LarceRR/Twilite#167](https://github.com/LarceRR/Twilite/issues/167) and decisions D1-D13.

## Requirements

- Node.js >= 22.18.0
- CLI runtime dependencies: none
- CLI is cross-platform; acceptance, chaos and DR tests run only in Linux through WSL2 on Windows
- Acceptance tests use real Ubuntu VMs, not ordinary Docker containers

```bash
npm ci
npm run check
node src/cli/main.ts --help
node src/cli/main.ts doctor
```

## CLI contract

```text
CONNECT -> PREFLIGHT -> SSH_BASELINE -> OS_BASELINE -> SECURITY -> DOCKER -> OPENBAO
  -> STORAGE -> MONITORING -> RUNTIME_BASELINE -> HEALTH_CHECK -> READY
```

```bash
node src/cli/main.ts plan --config examples/config.local-vm.json
node src/cli/main.ts provision --config examples/config.local-vm.json --dry-run
node src/cli/main.ts provision --config examples/config.local-vm.json --yes
node src/cli/main.ts resume --config examples/config.local-vm.json --yes
node src/cli/main.ts status --config examples/config.local-vm.json
node src/cli/main.ts report --config examples/config.local-vm.json
node src/cli/main.ts reset --config examples/config.local-vm.json --yes
```

The runner implements typed state, atomic persistence, resume/reinstall semantics, dry-run enforcement, bounded retries, cancellation, JSONL logging, redaction and machine/human reports. Runtime infrastructure steps are added phase by phase and cannot be marked complete by documentation alone.

## WSL2 VM testing

Infrastructure behavior is tested against a real Linux VM with systemd, SSH, Docker daemon, networking, firewall and reboot capability. Docker-in-Docker is not acceptance evidence. The complete lifecycle is documented in `docs/testing-wsl2.md` and exposed through `make`.

See `CHECKLIST.md` for the weighted 0%-100% plan and the exact phase gates.
