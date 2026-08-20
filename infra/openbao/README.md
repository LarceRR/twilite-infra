# OpenBao contract

OpenBao runs as the single 2 GiB node with Integrated Storage/Raft, TLS 1.3, audit logging and no public network port. Runtime containers receive scoped tokens only: production and staging paths are separate, and the application never receives administrative access.

Local auto-unseal uses Transit on the WSL2 host or another failure-domain simulator outside the provisioned VM (D3). Production uses the approved external KMS. The host is never the source of its own unseal key.

Bootstrap material is supplied through root-only files outside the repository. Recovery keys and Raft snapshots are stored outside the VPS failure domain. No token, recovery key or private TLS key belongs in Git.

The compose health gate must pass before deployment can proceed. If OpenBao is sealed or unavailable, new deployment fails closed instead of inventing or logging credentials.
