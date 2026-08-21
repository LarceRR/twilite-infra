# Scaling simulation

The inventory models roles rather than a hard-coded VPS. Run the same deployment contract against `vps-2gb`, `vps-8gb`, `split-data` and `multi-api`; changing capacity changes inventory and placement, not application packaging or release format.

Scaling order follows issue #167: grow the host, split PostgreSQL, split Redis, split staging, add stateless API nodes, make OpenBao HA, then consider an orchestrator only when justified. OpenBao HA is three nodes minimum. No local filesystem is authoritative application state.
