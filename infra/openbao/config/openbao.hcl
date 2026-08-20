ui = false
cluster_name = "twilite-openbao"
api_addr = "https://openbao:8200"
cluster_addr = "https://openbao:8201"
disable_mlock = false
storage "raft" {
  path = "/openbao/data"
  node_id = "twilite-openbao-1"
}
listener "tcp" {
  address = "0.0.0.0:8200"
  cluster_address = "0.0.0.0:8201"
  tls_cert_file = "/openbao/tls/server.crt"
  tls_key_file = "/openbao/tls/server.key"
  tls_min_version = "tls13"
}
# Local drills use Transit outside the VM (D3); production replaces this template with approved KMS.
# seal "transit" { address = "https://transit.example.invalid:8200" key_name = "twilite-unseal" mount_path = "transit/" }
telemetry { disable_hostname = true prometheus_retention_time = "24h" }
