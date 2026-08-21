# SSH bootstrap contract

Phase 3 implements the access-changing path from issue #167 and D12.

## Transport invariants

- OpenSSH client only, no JavaScript SSH library.
- `shell: false`, argv-only process construction.
- `BatchMode=yes`, strict `known_hosts`, explicit identity and control socket.
- `ControlMaster=auto`, bounded connect/command timeouts, keepalive limits.
- Host keys are obtained with `ssh-keyscan`, displayed as `SHA256:` fingerprints and trusted only after explicit operator confirmation.
- Private Ed25519 keys are generated on the operator host, mode `0600`, and never copied to the VPS.
- Remote file writes use a temp file, `sync -f`, and `mv`, with a restrictive mode.

## Bootstrap order

```text
initial root access
→ create admin user + sudo
→ install Ed25519 authorized key
→ verify admin SSH + sudo
→ write transitional sshd policy (new port, root fallback)
→ validate/reload sshd
→ verify admin through final port
→ write final policy with root login disabled
→ validate/reload sshd
→ verify final admin path
```

If a verification step fails, the previous access path is not intentionally removed. The final transition is not accepted until the final admin connection and `id -u` succeed.

## Gate still pending

The unit tests cover argv safety, redaction boundaries, key permissions, configuration rendering and ordering. The Phase 3 gate remains pending until this flow runs against the real systemd/SSH Ubuntu VM from Phase 2, including interruption and reboot tests.
