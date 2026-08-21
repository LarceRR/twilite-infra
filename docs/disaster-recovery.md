# Disaster recovery

The official DR drill is automated in `infra/dr/run.sh`: destroy the production-like VM, provision a clean VM, restore OpenBao access from external material, restore PostgreSQL base+WAL, restore the exact immutable release, run live/ready smoke checks and switch only a disposable test DNS record. The current cluster-wide PITR requires staging re-seed.

Run twice with distinct `DR_RUN_ID` values. The local DoD requires both reports to have every automated step successful, no undocumented manual action and measured RTO <=60 minutes. The DNS switch remains an explicit documented operator action.
