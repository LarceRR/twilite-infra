.PHONY: help check typecheck test unit test:vm:doctor test:vm:create test:vm:start test:vm:provision test:vm:chaos test:vm:collect test:vm:destroy test:os-security
help:
	@printf '%s\n' 'make check | make test:vm:doctor | make test:vm:create PROFILE=vps-2gb | make test:vm:provision | make test:vm:chaos CASE=api-kill | make test:vm:collect | make test:vm:destroy'
check:
	npm run check
typecheck:
	npm run typecheck
unit:
	npm run test:unit
test:os-security:
	node --test --test-reporter=spec test/unit/os-security.test.ts
test:vm:doctor:
	node src/harness/vmctl/main.ts doctor
test:vm:create:
	node src/harness/vmctl/main.ts create && node src/harness/vmctl/main.ts start
test:vm:start:
	node src/harness/vmctl/main.ts start
test:vm:provision:
	TWILITE_ACCEPT_HOST_KEY=1 node src/cli/main.ts provision --config examples/config.local-vm.json --yes
test:vm:chaos:
	CHAOS_REPO_ROOT="$(PWD)" CHAOS_REPORT_DIR=.artifacts/chaos CHAOS_SCENARIO=$(CASE) bash infra/chaos/run.sh
test:vm:collect:
	CHAOS_REPORT_DIR=.artifacts/chaos CHAOS_COLLECT_DIR=.artifacts/chaos-collected bash infra/chaos/collect.sh
	@mkdir -p .artifacts/vm && cp -f .vm/vps-2gb/serial.log .artifacts/vm/serial.log 2>/dev/null || true
	@cp -f .vm/vps-2gb/ssh.log .artifacts/vm/ssh.log 2>/dev/null || true
test:vm:destroy:
	node src/harness/vmctl/main.ts destroy
