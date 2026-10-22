# Local development for the Dragon Capital site (Strapi CMS + Next.js frontend).
# `make` lists the targets; `make dev` installs, seeds missing content and starts both servers.

SHELL := /bin/bash
NPM ?= npm
CMS := cms
WEB := frontend
CMS_URL := http://localhost:1337
WEB_URL := http://localhost:3000

# Fails with a hint when a port is taken (e.g. by an earlier `make dev`).
port_free = @if lsof -ti tcp:$(1) -sTCP:LISTEN >/dev/null; then \
	echo "Port $(1) is already in use – the server may already be running. Use 'make stop' first."; exit 1; fi

.DEFAULT_GOAL := help
.PHONY: help install setup seed-force dev cms web build start check typecheck lint stop reset clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[32m%-12s\033[0m %s\n", $$1, $$2}'

install: $(CMS)/node_modules $(WEB)/node_modules ## Install dependencies (only when missing or the lockfile changed)

$(CMS)/node_modules: $(CMS)/package-lock.json
	$(NPM) --prefix $(CMS) ci
	@touch $@

$(WEB)/node_modules: $(WEB)/package-lock.json
	$(NPM) --prefix $(WEB) ci
	@touch $@

setup: install ## Install and seed whatever content is missing (idempotent; keeps edits)
	$(NPM) --prefix $(CMS) run seed

seed-force: install ## Overwrite all seeded content with the snapshot in cms/scripts/content
	$(NPM) --prefix $(CMS) run seed -- --force

dev: ## Start Strapi (:1337) and Next.js (:3000) together; Ctrl-C stops both
	$(call port_free,1337)
	$(call port_free,3000)
	@$(MAKE) --no-print-directory setup
	@trap 'kill 0' INT TERM EXIT; \
	$(NPM) --prefix $(CMS) run develop & \
	echo "Waiting for Strapi at $(CMS_URL)…"; \
	until curl -sf -o /dev/null "$(CMS_URL)/_health"; do sleep 1; done; \
	$(NPM) --prefix $(WEB) run dev & \
	echo "Site: $(WEB_URL)/vi   CMS admin: $(CMS_URL)/admin"; \
	wait

cms: ## Start only Strapi (:1337); run 'make web' in a second terminal
	$(call port_free,1337)
	@$(MAKE) --no-print-directory setup
	$(NPM) --prefix $(CMS) run develop

web: install ## Start only Next.js (:3000); needs Strapi running ('make cms')
	$(call port_free,3000)
	$(NPM) --prefix $(WEB) run dev

build: setup ## Production build of both apps (Strapi must be running for the Next.js prerender)
	$(NPM) --prefix $(CMS) run build
	@curl -sf -o /dev/null "$(CMS_URL)/_health" || { echo "Start Strapi first (make cms) – Next.js prerenders pages from it."; exit 1; }
	$(NPM) --prefix $(WEB) run build

start: ## Serve the production builds (run 'make build' first)
	@trap 'kill 0' INT TERM EXIT; \
	$(NPM) --prefix $(CMS) run start & \
	until curl -sf -o /dev/null "$(CMS_URL)/_health"; do sleep 1; done; \
	$(NPM) --prefix $(WEB) run start & \
	echo "Site: $(WEB_URL)/vi   CMS admin: $(CMS_URL)/admin"; \
	wait

check: typecheck lint ## Type-check and lint the frontend

typecheck: install
	cd $(WEB) && npx next typegen && npx tsc --noEmit

lint: install
	cd $(WEB) && npx eslint src

stop: ## Stop whatever is listening on :1337 and :3000
	@pids=$$(lsof -ti tcp:1337 -sTCP:LISTEN; lsof -ti tcp:3000 -sTCP:LISTEN); \
	if [ -n "$$pids" ]; then kill $$pids && echo "Stopped $$pids"; else echo "Nothing running"; fi

reset: stop ## Delete the local CMS database and uploads, then reseed
	rm -rf $(CMS)/.tmp $(CMS)/public/uploads/*
	$(NPM) --prefix $(CMS) run seed

clean: ## Remove build output and caches (keeps node_modules and the database)
	rm -rf $(WEB)/.next $(CMS)/dist $(CMS)/.cache
