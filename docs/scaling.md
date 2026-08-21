# Scaling simulation

`src/core/scaling/contracts.ts` and `infra/scaling/simulate.sh` model role placement rather than hard-coded VPS assumptions. Profiles cover 2 GiB, larger single host, split data services and multi-API-node deployment. Change profile/inventory, not application packaging or release format.

Scaling triggers are measurable: sustained memory >80%, recurring swap, CPU saturation, API p95/p99, PostgreSQL RTO, staging contention and single-failure-domain risk. OpenBao HA starts at three nodes.
