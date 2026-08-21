# WSL2 VM testing contract

Acceptance evidence must come from a real Linux VM with systemd, SSH, Docker daemon, networking, firewall and reboot capability. Ordinary Docker containers are not a substitute.

## Required lifecycle

Run all commands from an Ubuntu WSL2 shell, not PowerShell-native tooling:

```bash
# 1. create a clean VM
make test:vm:create PROFILE=vps-2gb

# 2. run the full provisioning suite against the VM
make test:vm:provision

# 3. inject failures and run chaos cases
make test:vm:chaos CASE=api-kill

# 4. collect logs, JSONL, console output and resource/recovery reports
make test:vm:collect

# 5. destroy the VM
make test:vm:destroy

# 6. repeat clean
make test:vm:create PROFILE=vps-2gb CLEAN=1 && make test:vm:provision
```

Before acceptance, `make test:vm:doctor` must verify WSL2, QEMU, SSH and `/dev/kvm`. If KVM is unavailable, TCG may run functional checks as `DEGRADED`; it cannot produce performance or RTO evidence (D1).

No production VPS is used before the local acceptance, chaos and DR cycle passes twice.
