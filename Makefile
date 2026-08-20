.PHONY: help check typecheck test unit test:vm:doctor test:vm:create test:vm:provision test:vm:chaos test:vm:collect test:vm:destroy test:os-security
help:
	@printf '%s\n' 'make check | make test:os-security | make test:vm:doctor | make test:vm:create | make test:vm:provision | make test:vm:chaos CASE=api-kill | make test:vm:collect | make test:vm:destroy'
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
	node src/harness/vmctl/main.ts create
test:vm:provision:
	node src/cli/main.ts provision --config examples/config.local-vm.json --dry-run
test:vm:chaos:
	@printf '%s\n' 'failure injection is phase-gated; requested case: $(CASE)'
test:vm:collect:
	@mkdir -p .artifacts/vm && cp -f .vm/vps-2gb/serial.log .artifacts/vm/serial.log 2>/dev/null || true
	@cp -f .vm/vps-2gb/ssh.log .artifacts/vm/ssh.log 2>/dev/null || true
	@printf '%s\n' 'VM artifacts collected under .artifacts/vm'
test:vm:destroy:
	node src/harness/vmctl/main.ts destroy
