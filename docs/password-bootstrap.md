# Fresh VPS password bootstrap

Fresh Ubuntu VPS password bootstrap is supported without `sshpass`, password CLI flags, password environment variables or password files.

## Security flow

```text
provider IP + initial user + password
→ scan host key
→ display SHA256 fingerprint
→ explicit operator acceptance
→ OpenSSH ControlMaster prompts for password on the TTY
→ install locally generated Ed25519 public key
→ verify admin SSH + sudo with the generated private key
→ close password ControlMaster
→ move SSH port and disable password authentication only after key verification
→ continue key-only provisioning
```

The password is handled by OpenSSH's TTY prompt. The Node process never receives it, and it is never present in argv, JSON config, environment, logs or artifacts. Non-interactive mode fails instead of accepting an unsafe password input method.

## Commands

```bash
# WSL2 Ubuntu, from the repository on the Linux filesystem
export TWILITE_ACCEPT_HOST_KEY=1  # only after reviewing the printed fingerprint
node src/cli/main.ts plan --config examples/config.production.json
node src/cli/main.ts provision --config examples/config.production.json
```

The command asks for the provider password through the OpenSSH prompt. Do not add `--password` and do not export a password variable.

For an existing key bootstrap, leave `initialAuth.mode` as `auto` and provide `target.identityPath`, or set `initialAuth.mode` to `key`. Legacy config files without `initialAuth` remain compatible.

## Recovery

If interrupted after the public key was installed, rerun with the same config. The authorized key write is idempotent for the generated key, unrelated authorized keys are not removed, and the flow verifies key-only admin access before continuing. Wrong password or unaccepted fingerprint stops before security changes.
