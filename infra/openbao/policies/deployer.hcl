path "secret/data/production/api" { capabilities = ["read"] }
path "secret/data/staging/api" { capabilities = ["create", "read", "update"] }
path "secret/data/staging/smoke" { capabilities = ["create", "read", "update"] }
path "sys/health" { capabilities = ["read"] }
