# Claude Code Prompt — E2E Email Integration QA
**Project:** Luminal Journeys · **Date:** 2026-06-09
**Type:** Manual + automated QA pass — Email Integration only

---

## What We're Testing

Full end-to-end email delivery for both user types:

1. **Client confirmation** → `hi@keeya.nl` (real inbox — testing spam placement)
2. **Admin notification** → `intakes@luminaljourneys.com` → ImprovMX → admin inboxes

Both must arrive in **inbox** (not spam), contain correct data, and render properly.

---

## Test Submission Data

Use exactly these values:

```
First Name:    AmaraDev
Last Name:     JohnsonDev
Email:         hi@keeya.nl
Primary Goal:  Stress Relief
City:          Amsterdam
State/Country: The Netherlands
Zip:           2023 ME
env:           production   ← IMPORTANT: must be "production" so client confirmation fires to non-maildrop address
```

---

## Step 1 — Fire the Worker Directly (fastest path)

```bash
curl -X POST https://intake-mailer.clients-7e8.workers.dev \
  -H "Content-Type: application/json" \
  -d '{
    "firstName":       "AmaraDev",
    "lastName":        "JohnsonDev",
    "email":           "hi@keeya.nl",
    "primaryGoal":     "Stress Relief",
    "city":            "Amsterdam",
    "state":           "The Netherlands",
    "zip":             "2023 ME",
    "preferredName":   "AmaraDev",
    "preferredContact":"email",
    "env":             "production",
    "submittedAt":     "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
  }'
```

Expected response:
```json
{
  "ok": true,
  "results": [
    { "type": "client", "status": 200 },
    { "type": "admin",  "to": "intakes@luminaljourneys.com", "status": 200 }
  ]
}
```

If `ok: false` or any status is not 200, stop and report the error body.

---

## Step 2 — Verify Postmark Activity

Go to: Postmark → Servers → Luminal Journeys → Default Transactional Stream → **Activity**

Check for two sends within the last 5 minutes:

| Expected | From | To | Status Required |
|----------|------|----|----------------|
| Client confirmation | hello@luminaljourneys.com | hi@keeya.nl | ✅ Delivered |
| Admin notification | hello@luminaljourneys.com | intakes@luminaljourneys.com | ✅ Delivered |

**Fail conditions:**
- Hard Bounce → report the SMTP error message
- Soft Bounce → report and note the reason
- Delivered but not in inbox → spam issue (see Step 4)

---

## Step 3 — Verify Email Content

**Client confirmation** (arrives at hi@keeya.nl) must contain:
- [ ] Subject: `We've received your intake form, AmaraDev ✦`
- [ ] Greeting: `Thank you, AmaraDev. ✦`
- [ ] Primary Goal: `Stress Relief`
- [ ] Preferred Contact: `email`
- [ ] Email: `hi@keeya.nl`
- [ ] No broken layout, no missing data, no raw `${variable}` visible

**Admin notification** (arrives at intakes@luminaljourneys.com) must contain:
- [ ] Subject: `[LUMINAL JOURNEYS] [PRODUCTION] New intake — AmaraDev JohnsonDev`
- [ ] Name: `AmaraDev JohnsonDev`
- [ ] City/State: Amsterdam, The Netherlands
- [ ] Zip: `2023 ME`
- [ ] Primary Goal: `Stress Relief`
- [ ] Email link: `hi@keeya.nl` (clickable mailto)
- [ ] "Open Admin Panel →" button present and links to `https://admin.luminaljourneys.com`
- [ ] Environment: `PRODUCTION`

---

## Step 4 — Spam Check

Check `hi@keeya.nl` inbox:
- [ ] Client confirmation arrived in **inbox** (not spam/junk)
- [ ] Sender shows as `Luminal Journeys <hello@luminaljourneys.com>`
- [ ] No security warnings from the email client

Check admin inbox (whichever address intakes@ forwards to):
- [ ] Admin notification arrived in **inbox** (not spam/junk)

If either lands in spam:
1. Check Postmark → Servers → Settings → confirm DKIM is Verified + Return-Path is Verified
2. Check GoDaddy DNS for `20260527155126pm._domainkey` TXT record and `pm-bounces` CNAME → `pm.mtasv.net`
3. Check ImprovMX → confirm `intakes@luminaljourneys.com` alias exists and forwards correctly

---

## Pass Criteria — Definition of Done

| Check | Pass Condition |
|-------|---------------|
| Worker response | `{"ok":true}` with both email statuses 200 |
| Postmark activity | Both sends show **Delivered** (not Bounced) |
| Client confirmation | Arrived in inbox at hi@keeya.nl, correct data, no rendering issues |
| Admin notification | Arrived in intakes@ admin inbox, correct data, correct subject tag |
| Spam placement | Both emails in inbox, not spam folder |
| Admin panel link | "Open Admin Panel →" button present in admin email |

All 6 must pass. If any fail, report the exact failure with screenshot or error message.

---

## Architecture Reminder

```
curl → Cloudflare Worker (intake-mailer)
         │
         ├── Postmark → hello@luminaljourneys.com → hi@keeya.nl
         │              (client confirmation — fires because env=production)
         │
         └── Postmark → intakes@luminaljourneys.com
                         → ImprovMX → admin inbox(es)
                         (admin notification — always fires)
```

Worker URL: `https://intake-mailer.clients-7e8.workers.dev`
DKIM status: ✅ Verified (as of 2026-06-09)
Return-Path: ✅ Verified

---

## If the Worker Sends to Wrong Address

If Postmark activity shows admin notification going to `hello@luminaljourneys.com`
instead of `intakes@luminaljourneys.com`, the old code is still deployed.

Fix:
```bash
cd ~/01-tie-babeh-apps/luminaljourneys/workers/intake-mailer
# Confirm line 20 of worker.js reads:
grep "ADMIN_NOTIFICATION_EMAIL" worker.js
# Should output: const ADMIN_NOTIFICATION_EMAIL = 'intakes@luminaljourneys.com';
# If wrong, re-deploy:
npx wrangler deploy
```
