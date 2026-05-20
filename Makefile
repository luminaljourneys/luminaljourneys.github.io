# ─────────────────────────────────────────────────────────────────────────────
# Luminal Journeys — Makefile
# Run ALL commands from /luminaljourneys/ root
#
# DAILY WORKFLOW:
#   make dev                    → localhost:5173
#   make staging m="feat: ..."  → commit + push to dev → staging deploy
#   make prod                   → promote staging → live on luminaljourneys.com
#   make qa                     → run Playwright tests (fast, chromium only)
# ─────────────────────────────────────────────────────────────────────────────

ROOT    := $(shell pwd)
BRANCH  := $(shell git rev-parse --abbrev-ref HEAD)

# ── Local development ────────────────────────────────────────────────────────

# Start Vite dev server on localhost:5173
dev:
	cd $(ROOT) && npm run dev

# Install dependencies
install:
	cd $(ROOT) && npm install

# Build to dist/ (production bundle)
build:
	cd $(ROOT) && npm run build

# ── Git / Deploy ─────────────────────────────────────────────────────────────

# Commit + push to dev branch → triggers staging deploy via GitHub Actions
# QA at: https://luminaljourneys-staging.web.app
# Usage: make staging m="feat: add form builder rating field"
staging:
	@if [ -z "$(m)" ]; then echo "❌  Usage: make staging m=\"your commit message\""; exit 1; fi
	git add .
	git commit -m "$(m)"
	git push origin dev
	@echo "✅  Pushed to staging — https://luminaljourneys-staging.web.app"

# Alias for backwards compat
stage: staging

# Promote staging → production: merges dev into main → triggers prod deploy
# No message needed. Run after QA passes on staging.
# Usage: make prod
prod:
	@echo "🚀  Promoting staging → production..."
	git checkout main
	git merge dev --no-edit
	git push origin main
	git checkout dev
	@echo "✅  Live at https://luminaljourneys.com"

# Emergency: skips staging, ships straight to production
# Usage: make ship m="hotfix: crash on intake page"
ship:
	@if [ -z "$(m)" ]; then echo "❌  Usage: make ship m=\"hotfix description\""; exit 1; fi
	git add .
	git commit -m "$(m)"
	git push origin dev
	git checkout main
	git merge dev --no-edit
	git push origin main
	git checkout dev
	@echo "✅  Hotfix shipped to production"

# Commit only (no push) — useful mid-session
# Usage: make commit m="wip: form builder"
commit:
	@if [ -z "$(m)" ]; then echo "❌  Usage: make commit m=\"message\""; exit 1; fi
	git add .
	git commit -m "$(m)"

# ── Playwright QA ─────────────────────────────────────────────────────────────

# Fast smoke run — Chromium only, parallel workers
# Usage: make qa
qa:
	cd $(ROOT) && npx playwright test --project=chromium

# Full run — all browsers (Chromium + iPhone 12 + Pixel 5)
# Usage: make qa-all
qa-all:
	cd $(ROOT) && npx playwright test

# Interactive UI mode — step through tests visually
# Usage: make qa-ui
qa-ui:
	cd $(ROOT) && npx playwright test --ui

# Open last HTML report
# Usage: make qa-report
qa-report:
	cd $(ROOT) && npx playwright show-report

# Run a single spec file
# Usage: make qa-file f=tests/intake.spec.js
qa-file:
	cd $(ROOT) && npx playwright test $(f) --project=chromium

# Run tests against live staging URL (no local Vite server needed)
# Usage: make qa-staging
qa-staging:
	cd $(ROOT) && npx playwright test --config=playwright.staging.config.js --project=chromium

# Run login tests only against local dev server
# Usage: make qa-login
qa-login:
	cd $(ROOT) && npx playwright test tests/login.spec.js --project=chromium

.PHONY: dev install build staging stage prod ship commit qa qa-all qa-ui qa-report qa-file qa-staging qa-login
