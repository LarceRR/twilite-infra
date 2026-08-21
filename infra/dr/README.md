# Disaster recovery drill

The official local scenario destroys the production-like VM, provisions a clean VM, restores OpenBao access from external recovery material, restores PostgreSQL base+WAL, restores the exact immutable release, runs smoke and records the disposable DNS switch. The current 2 GiB PostgreSQL cluster is cluster-wide, so staging is re-seeded after restore.

Run twice with unique `DR_RUN_ID` values. Both reports must have all automated steps successful, no undocumented manual action and measured RTO <= 3600 seconds before LOCAL-DoD can pass. The DNS switch is intentionally a documented operator action, never an implicit production-side effect.
