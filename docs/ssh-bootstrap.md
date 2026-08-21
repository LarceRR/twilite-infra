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

## Initial user

Production VPS may provide a non-root initial user with passwordless sudo; root SSH login is not required. The preflight accepts either `id -u = 0` (root) or `sudo -n true` success (non-root with sudo). When the initial user is not root, every privileged bootstrap command (useradd, install, chown, sshd -t, systemctl reload ssh) is prefixed with `sudo -n` through the existing argv-only transport.

## Bootstrap order

```text
initial access (root or non-root + sudo)
-> detect privilege mode
-> create admin user + sudo (with sudo prefix if non-root)
-> install Ed25519 authorized key (idempotent append)
-> verify admin SSH + sudo on initial port
-> write transitional sshd policy (new port, root fallback)
-> validate/reload sshd (with sudo prefix if non-root)
-> verify admin through final port
-> write final policy with root login disabled
-> validate/reload sshd
-> verify final admin path
```

If a verification step fails, the previous access path is not intentionally removed. The final transition is not accepted until the final admin connection and `sudo -n true` succeed.

## Password bootstrap

Fresh VPS password bootstrap is supported. The password is handled by OpenSSH's TTY prompt; the Node process never receives it. See `docs/password-bootstrap.md`.
