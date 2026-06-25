# Claude Code Handoff — intake-mailer Deploy
**Project:** Luminal Journeys · **Date:** 2026-06-09 · **Priority:** BLOCKER

---

## Mission

Deploy the `intake-mailer` Cloudflare Worker so admin notification emails start
arriving at `intakes@luminaljourneys.com`. This is blocking the admin team from
knowing when new intake forms are submitted. Once confirmed E2E, document the
full Cloudflare deploy workflow for the BridgeLogics 2nd Brain.

---

## Context — What Was Done, What Failed

### The Bug (fixed in code, not yet deployed)
The worker was sending admin notifications FROM `hello@luminaljourneys.com`
TO `hello@luminaljourneys.com`. ImprovMX silently drops self-addressed mail
to prevent loops. Admins never received a single notification.

### The Fix (already in worker.js)
A dedicated alias `intakes@luminaljourneys.com` was created in ImprovMX.
The worker already has this change on line 20:
```js
const ADMIN_NOTIFICATION_EMAIL = 'intakes@luminaljourneys.com';
```
**The code is correct. It just needs to be deployed.**

---

## File Locations

```
~/01-tie-babeh-apps/luminaljourneys/
  workers/intake-mailer/
    worker.js          ← the worker (already updated)
    wrangler.toml      ← name: "intake-mailer", main: "worker.js"
```

### wrangler.toml
```toml
name = "intake-mailer"
main = "worker.js"
compatibility_date = "2024-01-01"
```

---

## What the Worker Does

Receives a POST from the Luminal Journeys intake form (after Firestore write).
Sends two emails via Postmark:
1. **Client confirmation** → submitter's email (production + maildrop.cc test addresses)
2. **Admin notification** → `intakes@luminaljourneys.com` (ImprovMX forwards to all admins)

Env var required: `POSTMARK_API_KEY` (already set in Cloudflare dashboard).

---

## Task List

### 1. Deploy the Worker (BLOCKER)

**Option A — Cloudflare MCP tools (preferred)**
The `cloudflare` plugin was installed via:
```bash
git clone git@github.com:cloudflare/skills.git
```
If Cloudflare MCP tools are available in your session, use them to deploy
`intake-mailer` directly. Worker name: `intake-mailer`.

**Option B — wrangler CLI fallback**
```bash
cd ~/01-tie-babeh-apps/luminaljourneys/workers/intake-mailer
npx wrangler login      # opens browser — authenticate once
npx wrangler deploy     # deploys intake-mailer worker
```
Note: if `npx wrangler` throws a missing `@cloudflare/workerd-darwin-arm64`
error, clear the bad cache first:
```bash
rm -rf ~/.npm/_npx/32026684e21afda6
```

### 2. Smoke Test After Deploy

Submit a test intake at `https://luminaljourneys.com` (or staging) and confirm:
- Admin notification arrives at `intakes@luminaljourneys.com`
- Client confirmation arrives at the submitter address

For a non-destructive test, POST directly to the worker:
```bash
curl -X POST https://intake-mailer.<your-subdomain>.workers.dev \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@maildrop.cc",
    "env": "staging"
  }'
```
Expected response: `{"ok":true,"results":[{"type":"admin","to":"intakes@luminaljourneys.com","status":200}]}`

### 3. Verify Postmark Logs

Check Postmark dashboard → Activity for delivery confirmation.
Admin email stream: `outbound`.

### 4. Document in 2nd Brain

Once deploy + smoke test pass, create:
```
wiki/global-devops/deployment-playbooks/Cloudflare Worker Deploy.md
```
Include:
- wrangler install + auth steps
- deploy command
- Cloudflare MCP tool usage (if used above — this is the preferred path going forward)
- Postmark env var setup
- ImprovMX alias setup for self-loop avoidance
- Smoke test curl command

Also update:
```
wiki/clients/luminal-journeys/Luminal Journeys.md   ← Current State: email working
wiki/global-devops/error-log/Error Log.md           ← log the self-loop bug + fix
```

---

## Email Routing Architecture (for documentation)

```
Form submission
      │
      ▼
Cloudflare Worker (intake-mailer)
      │
      ├── Postmark → hello@luminaljourneys.com → client confirmation
      │
      └── Postmark → intakes@luminaljourneys.com → ImprovMX → all admins
                      ↑
                      This alias was created specifically to avoid the
                      ImprovMX self-loop (hello→hello gets dropped)
```

---

## After This Is Done

Once E2E email is confirmed working, the next session will produce a
**decision journey flow diagram** showing the full intake pipeline:
form → Firestore → Worker → Postmark → client + admin — to be added to
the wiki and used for admin team onboarding.

---

## Credentials / Secrets

- `POSTMARK_API_KEY` — already set as a Cloudflare Worker secret (do not touch)
- ImprovMX — `intakes@` alias already created, forwarding active
- Cloudflare account — authenticate via `wrangler login` or MCP tools

---

## Definition of Done

- [ ] Worker deployed (`wrangler deploy` exits 0 or MCP confirms)
- [ ] Admin notification received at `intakes@luminaljourneys.com`
- [ ] Client confirmation received at test address
- [ ] Postmark activity log shows both sends as delivered
- [ ] 2nd Brain updated: playbook + error log + Current State
