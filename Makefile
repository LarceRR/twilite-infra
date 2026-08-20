.PHONY: help check typecheck test unit test:vm:doctor test:vm:create test:vm:provision test:vm:chaos test:vm:collect test:vm:destroy
help:
	@printf '%s\n' 'make check | make test:vm:doctor | make test:vm:create | make test:vm:provision | make test:vm:chaos CASE=api-kill | make test:vm:collect | make test:vm:destroy'
check:
	npm run check
typecheck:
	npm run typecheck
unit:
	npm run test:unit
test:vm:doctor:
	node src/cli/main.ts doctor
test:vm:create:
	@echo 'VM backend pending Phase 2 implementation: requires WSL2 + QEMU/KVM, never Docker-only'
test:vm:provision:
	@echo 'VM provisioning pending Phase 2 implementation'
test:vm:chaos:
	@echo 'Chaos case $(CASE) pending Phase 10 implementation'
test:vm:collect:
	@echo 'Artifact collector pending Phase 2 implementation'
test:vm:destroy:
	@echo 'VM destroy pending Phase 2 implementation'
