# ─────────────────────────────────────────────
# Luminal Journeys Makefile
# Run ALL commands from root /luminaljourneys/
# ─────────────────────────────────────────────

ROOT := $(shell pwd)

# Start local dev server on localhost
dev:
	cd $(ROOT) && npm run dev

# Install npm dependencies
install:
	cd $(ROOT) && npm install

# Build project locally (output to dist/)
build:
	cd $(ROOT) && npm run build

# Stage + commit only, no push
# Usage: make commit m="your message"
commit:
	git add . && git commit -m "$(m)"

# Stage + commit + push to dev → triggers staging deploy via GitHub Actions
# Usage: make stage m="feat: what you changed"
# QA at: https://luminaljourneys-staging.web.app
stage:
	git add . && git commit -m "$(m)" && git push origin dev

# Promote staging to production → merges dev into main → triggers production deploy
# No message needed. Run after QA on staging.
# Usage: make prod
prod:
	git checkout main
	git merge dev --no-edit
	git push origin main
	git checkout dev

# Emergency deploy: skips staging QA, goes straight to production
# Usage: make ship m="hotfix: description"
ship:
	git add . && git commit -m "$(m)"
	git push origin dev
	git checkout main
	git merge dev --no-edit
	git push origin main
	git checkout dev