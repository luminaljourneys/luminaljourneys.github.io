# ─────────────────────────────────────────────────────────────────────────────
# Luminal Journeys — Makefile
# Run ALL commands from /luminaljourneys/ root
#
# DAILY WORKFLOW:
#   make dev                    → localhost:5173
#   make staging m="feat: ..."  → commit + push to dev → staging deploy
#   make prod                   → promote staging → live on luminaljourneys.com
#   make qa                     → run Playwright tests (fast, chromium only)
#   make qa-watch               → watch all tests at human pace in a real browser
#   make qa-ui                  → Playwright UI, 1 worker — click group → watch sequence
#
# CLOUD FUNCTIONS:
#   make fn-install             → npm install inside functions/
#   make fn-build               → compile TypeScript → lib/
#   make fn-deploy              → build + deploy functions to Firebase
#   make fn-secret              → set POSTMARK_API_KEY secret (run once)
#
# WIF / GCP DIAGNOSTICS (run when GitHub Actions deploy fails):
#   make wif-check              → show current WIF provider config + repo condition
#   make wif-fix                → repair provider condition to scope it to this repo
#   make redeploy               → force-push an empty commit to re-trigger CI
#
# GIT ACCOUNT DIAGNOSTICS (run when push fails with "Permission denied to BridgeLogicsProjects"):
#   make git-check              → show git remote + which SSH key this repo uses
#   make git-fix                → wire this repo to use the luminaljourneys SSH key
#   make git-test               → verify SSH auth is working as luminaljourneys
# ─────────────────────────────────────────────────────────────────────────────

ROOT    := $(shell pwd)
BRANCH  := $(shell git rev-parse --abbrev-ref HEAD)

# ── GCP / WIF identity — scoped to Luminal Journeys only ────────────────────
GCP_PROJECT     := luminaljourneys
GCP_PROJECT_NUM := 815989961728
GITHUB_ORG      := luminaljourneys
GITHUB_REPO     := luminaljourneys/luminaljourneys.github.io
WIF_POOL        := github-pool
WIF_PROVIDER    := github-provider

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

# Playwright UI — 1 worker so tests run one at a time when you click ▷.
# Click a describe group (e.g. "Landing Page") → ▷ to run the whole group in sequence.
# Click any test row to watch its step-by-step trace with cursor movements.
# Usage: make qa-ui
qa-ui:
	cd $(ROOT) && npx playwright test --ui --workers=1

# Watch mode — runs ALL tests sequentially at human pace in a visible browser.
# You can see every click, fill, and navigation just like a real user would.
# Tweak speed: make qa-watch speed=400  (default 800ms between actions)
# Usage: make qa-watch
speed ?= 800
qa-watch:
	cd $(ROOT) && PW_SLOW_MO=$(speed) PW_HEADED=1 npx playwright test --project=chromium --workers=1 --reporter=line

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

# Live end-to-end: fill real staging form + verify email lands in maildrop.cc inbox
# Requires: EMAIL_E2E=1, INTAKE_E2E_LIVE=1
# Usage: make qa-email mb=kwj
mb ?= kwj
qa-email:
	cd $(ROOT) && INTAKE_E2E_LIVE=1 EMAIL_E2E=1 MAILDROP_MAILBOX=$(mb) \
		npx playwright test tests/intake-e2e.spec.js \
		--config=playwright.staging.config.js \
		--grep "confirmation email" \
		--project=chromium-staging

# Run login tests only against local dev server
# Usage: make qa-login
qa-login:
	cd $(ROOT) && npx playwright test tests/login.spec.js --project=chromium

# ── Cloud Functions ───────────────────────────────────────────────────────────

# Deploy Firestore rules + indexes (run whenever firestore.rules or
# firestore.indexes.json changes — GitHub Actions does NOT do this automatically)
# Usage: make firestore-deploy
firestore-deploy:
	firebase deploy --only firestore:rules,firestore:indexes --project $(GCP_PROJECT)
	@echo "✅  Firestore rules + indexes deployed"

# ── Cloud Functions ───────────────────────────────────────────────────────────

# Install function dependencies
fn-install:
	cd $(ROOT)/functions && npm install

# Compile TypeScript → lib/
fn-build:
	cd $(ROOT)/functions && npm run build

# Build + deploy functions only
fn-deploy:
	cd $(ROOT)/functions && npm run build
	firebase deploy --only functions
	@echo "✅  Functions deployed"

# Set the Postmark API key as a Firebase secret (run once, if using Cloud Functions)
# Note: production secret lives in Cloudflare Worker settings, not Firebase
# Usage: make fn-secret key=your-postmark-server-token
fn-secret:
	@if [ -z "$(key)" ]; then echo "❌  Usage: make fn-secret key=your-postmark-server-token"; exit 1; fi
	echo "$(key)" | firebase functions:secrets:set POSTMARK_API_KEY
	@echo "✅  POSTMARK_API_KEY secret saved to Firebase"

# ── Git Account Diagnostics ───────────────────────────────────────────────────
#
# Root cause: macOS SSH agent loads the BridgeLogicsProjects key first.
# Fix: tell THIS repo's git to always use the luminaljourneys SSH key explicitly.
#
# SSH key for the luminaljourneys GitHub account.
# Override if your key is named differently: make git-fix LJ_KEY=~/.ssh/id_rsa_lj
LJ_KEY ?= ~/.ssh/id_ed25519_luminal

# Show what SSH identity git is using for this repo.
# Run first when push fails with "Permission denied to BridgeLogicsProjects".
# Usage: make git-check
git-check:
	@echo "── Git remote ──────────────────────────────────────────────"
	@git remote -v
	@echo ""
	@echo "── SSH command for this repo (local git config) ─────────────"
	@git config --local core.sshCommand 2>/dev/null || echo "(none — using system SSH agent default)"
	@echo ""
	@echo "── SSH agent identities currently loaded ────────────────────"
	@ssh-add -l 2>/dev/null || echo "(no identities in agent)"

# Wire this repo to always use the luminaljourneys SSH key.
# Writes core.sshCommand into .git/config (local only — does not affect other repos).
# Usage: make git-fix
git-fix:
	@echo "🔧  Wiring repo to use $(LJ_KEY)..."
	git config core.sshCommand "ssh -i $(LJ_KEY) -o IdentitiesOnly=yes"
	@echo "✅  Done. Verify with: make git-test"
	@echo ""
	@echo "If the key doesn't exist yet, create it:"
	@echo "  ssh-keygen -t ed25519 -C 'luminaljourneys-github' -f $(LJ_KEY)"
	@echo "  Then add the public key at: github.com → luminaljourneys account → Settings → SSH Keys"

# Dry-run SSH auth against GitHub using the luminaljourneys key.
# A successful result looks like: Hi <username>! You've successfully authenticated...
# Usage: make git-test
git-test:
	@echo "── Testing SSH auth to GitHub with $(LJ_KEY) ───────────────"
	ssh -T -i $(LJ_KEY) -o IdentitiesOnly=yes git@github.com 2>&1 || true

# ── WIF / GCP Diagnostics ─────────────────────────────────────────────────────

# Show the current WIF provider config — what repo condition is it scoped to?
# Run this first when a deploy fails with "Error creating token" or permission denied.
# Usage: make wif-check
wif-check:
	@echo "── WIF provider config for $(GCP_PROJECT) ──────────────────"
	gcloud iam workload-identity-pools providers describe $(WIF_PROVIDER) \
		--workload-identity-pool=$(WIF_POOL) \
		--location=global \
		--project=$(GCP_PROJECT) \
		--format="yaml(attributeCondition,attributeMapping,oidc.issuerUri)"
	@echo ""
	@echo "── IAM binding check — is this repo bound to the service account? ──"
	gcloud iam service-accounts get-iam-policy \
		$$(gcloud iam service-accounts list --project=$(GCP_PROJECT) --filter="displayName:github" --format="value(email)" | head -1) \
		--project=$(GCP_PROJECT) \
		--format="yaml(bindings)" 2>/dev/null || \
		gcloud iam service-accounts list --project=$(GCP_PROJECT) --format="table(email,displayName)"

# Show active gcloud account + IAM roles on this project.
# Run before wif-fix to confirm you're logged in as the right account.
# Usage: make wif-whoami
wif-whoami:
	@echo "── Active gcloud account ───────────────────────────────────"
	@gcloud config get-value account
	@echo ""
	@echo "── Your IAM roles on $(GCP_PROJECT) ────────────────────────"
	@gcloud projects get-iam-policy $(GCP_PROJECT) \
		--flatten="bindings[].members" \
		--filter="bindings.members:$$(gcloud config get-value account)" \
		--format="table(bindings.role)"
	@echo ""
	@echo "Need roles/iam.workloadIdentityPoolAdmin to run wif-fix."
	@echo "If missing, run: gcloud auth login  (in your terminal, not make)"

# Repair the WIF provider: scope its attribute condition to THIS repo only.
# Run this after wif-check confirms the condition is wrong (e.g. points to purrfect-sort).
# Usage: make wif-fix
wif-fix:
	@echo "🔧  Scoping WIF provider to $(GITHUB_REPO)..."
	gcloud iam workload-identity-pools providers update-oidc $(WIF_PROVIDER) \
		--workload-identity-pool=$(WIF_POOL) \
		--location=global \
		--project=$(GCP_PROJECT) \
		--attribute-condition="attribute.repository=='$(GITHUB_REPO)'"
	@echo "✅  Provider condition updated. Verify with: make wif-check"

# Force a redeploy by pushing an empty commit — useful after wif-fix.
# Usage: make redeploy
redeploy:
	@echo "🚀  Force-pushing empty commit to re-trigger CI on $(BRANCH)..."
	git commit --allow-empty -m "ops: force redeploy"
	git push origin $(BRANCH)
	@echo "✅  CI triggered — watch Actions at https://github.com/$(GITHUB_REPO)/actions"

.PHONY: dev install build staging stage prod ship commit qa qa-all qa-ui qa-watch qa-report qa-file qa-staging qa-email qa-login firestore-deploy fn-install fn-build fn-deploy fn-secret git-check git-fix git-test wif-whoami wif-check wif-fix redeploy
