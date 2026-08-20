# Deployment contract

`deploy.sh` implements the issue's exact order: resolve digest, verify image integrity, verify capacity, pull, run the fixed migration contract, verify Compose config, start the new release, wait for `/health/ready`, run smoke, then record the successful digest and retain the previous known-good digest.

A failed pre-traffic gate stops the rollout. `rollback.sh` never rebuilds code: it pulls the previous digest, starts it, waits for health and reruns smoke. The migration contract is expand/contract only; destructive cleanup is a later deployment.

No deployment command accepts `latest`, tags or arbitrary migration shell commands. Secrets arrive only through Docker secrets and protected environment files. Release metadata contains commit SHA and digest, not credentials.
