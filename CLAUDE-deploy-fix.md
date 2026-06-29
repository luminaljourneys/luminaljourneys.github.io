# Claude Code — Deploy Fix + Content Seed
## Luminal Journeys · `/Users/springsparrow/01-tie-babeh-apps/luminaljourneys`

---

## Your First Task: Read the CI Error

Go to: https://github.com/luminaljourneys/luminaljourneys.github.io/actions

Open the most recent failing "Deploy to Firebase" run. Find the exact step that fails and read the error. That error is the ground truth — fix it before anything else.

---

## Context: What Was Done This Session

This was a full content editability sprint on the Luminal Journeys platform. Here's everything that was changed:

### Stack
- React + Vite + Firebase Hosting
- Two branches: `dev` → staging (admin.luminaljourneys.com), `main` → production (luminaljourneys.com)
- GitHub Actions CI/CD: `.github/workflows/deploy.yml` — builds and deploys on push to either branch
- Cloudflare Worker (`workers/intake-mailer/`) — sends emails via Postmark

### Commits on `dev` (all merged to `main` except the last two)

```
b966d1a fix: add dist/ to .gitignore, add content seed script
9988d40 perf: split firebase + react into separate chunks — reduces initial bundle size
52c4eb5 feat: make all client-facing copy editable via EditableContent
7c649da fix: remove hardcoded 'with' from hero headline
8942138 fix: eliminate flash of old text — EditableContent hides until Firestore resolves
```

### What Each Commit Does

**`8942138` — Flash fix**
- `src/hooks/useEditableContent.js`: changed `useState(fallback)` → `useState(null)`
- `src/components/EditableContent.jsx`: added `visibility:hidden` guard while content is null
- Prevents hardcoded fallback text from flashing before Firestore resolves

**`7c649da` — Headline fix**
- `src/pages/LandingPage.jsx`: removed hardcoded `with{" "}` between two `EditableContent` spans
- Hero headline is now fully editable end-to-end

**`52c4eb5` — All copy editable**
- Wrapped every client-facing string across all pages in `EditableContent`
- Added `EditableContent` import to `IntakePage.jsx`
- Files changed: `LandingPage.jsx`, `IntakePage.jsx`, `DynamicPage.jsx`
- 23 content keys total (see seed script below)

**`9988d40` — Bundle splitting**
- `vite.config.js`: added `manualChunks` to split Firebase + React into separate chunks
- Reduces initial JS bundle from 743KB → multiple smaller async chunks

**`b966d1a` — .gitignore + seed script**
- `.gitignore`: added `dist/` — built files were being committed and causing CI issues
- `scripts/seed-content.mjs`: seeds all 23 content keys into Firestore

---

## Known CI Failure Pattern

All "Deploy to Firebase" runs are failing (red ✗). The "Luminal Journeys CI" lint runs are passing (green ✓). This means the failure is in the **Firebase deploy step**, not the build itself. Likely causes:

1. **`dist/` was committed to git** — old built files in the repo conflict with CI's fresh build. Fixed in `b966d1a` by adding `dist/` to `.gitignore`. BUT the old `dist/` files are still tracked in git history. You need to remove them from tracking:
   ```bash
   git rm -r --cached dist/
   git commit -m "fix: remove dist/ from git tracking"
   git push origin dev
   git checkout main && git merge dev --no-ff -m "fix: remove dist from tracking" && git push origin main && git checkout dev
   ```

2. **Firebase auth / WIF failure** — check if `WIF_PROVIDER` or `WIF_SERVICE_ACCOUNT` secrets are set in GitHub repo settings.

3. **Build error from `vite.config.js` change** — the `manualChunks` config may conflict with Vite 8's new Rolldown bundler. If the build step fails, revert `vite.config.js` to:
   ```js
   import { defineConfig } from "vite";
   import react from "@vitejs/plugin-react";
   export default defineConfig({
     plugins: [react()],
     base: "/",
     build: { chunkSizeWarningLimit: 800 },
   });
   ```

---

## Task 2: Run the Content Seed Script

Once CI is green and the site deploys, seed Firestore so hardcoded fallbacks never show again:

```bash
cd /Users/springsparrow/01-tie-babeh-apps/luminaljourneys

# Install firebase-admin if not present
npm install firebase-admin --save-dev

# Download service account key from Firebase Console:
# Project Settings → Service Accounts → Generate new private key
# Save as: scripts/serviceAccountKey.json

node scripts/seed-content.mjs
```

The script uses `{ merge: true }` — it will NOT overwrite any content the client has already edited. It only seeds keys that don't exist yet.

---

## The 23 Content Keys

All live in Firestore collection `content_edits_staging` (staging) and `content_edits_production` (production):

| Key | Default | Page |
|-----|---------|------|
| `brand.wordmark` | Luminal Journeys | Nav, intake, dynamic pages |
| `nav.link.principles` | Our Practice | Desktop nav |
| `nav.link.process` | Process | Desktop nav |
| `nav.cta` | Discover Your Journey | Nav CTA |
| `nav.backhome` | ← Home | Dynamic pages |
| `hero.headline.pre` | Care that begins | Hero |
| `hero.headline.em` | listening. | Hero italic |
| `hero.cta.label` | Discover Your Journey → | Hero CTA |
| `hero.cta.sub` | 5 minutes · No commitment required | Hero sub |
| `process.section.label` | The Process | Process section |
| `manifesto.cta` | Discover Your Journey → | Manifesto CTA |
| `footer.copyright` | © 2026 Luminal Journeys · All rights reserved | Footer |
| `intake.page.label` | New Client Intake | Intake top bar |
| `intake.btn.back` | ← Back | Intake nav |
| `intake.btn.continue` | Continue → | Intake nav |
| `thankyou.headline` | Thank you | Thank-you screen |
| `thankyou.body.email` | We've received your intake form... | Thank-you screen |
| `thankyou.body.timeframe` | within 1–2 business days. | Thank-you screen |
| `thankyou.body.noemail` | We've received your intake form and will be in touch shortly. | Thank-you screen |
| `thankyou.backhome` | ← Back to home | Thank-you + 404 |
| `page.cta.book` | Book a Consultation | Dynamic page CTA |
| `404.headline` | Page not found | 404 state |
| `404.body` | This page doesn't exist yet… | 404 state |

---

## EditableContent Architecture

- **Hook:** `src/hooks/useEditableContent.js` — fetches from Firestore, falls back to prop if no doc
- **Component:** `src/components/EditableContent.jsx` — renders `visibility:hidden` while loading (null state), then shows content. In edit mode shows pencil icon + EditPanel drawer.
- **Collections:** `content_edits_staging` / `content_edits_production` (set by `VITE_ENV`)
- **Schema per doc:**
  ```js
  {
    current:   "The text the client last saved",
    updatedAt: Timestamp,
    history:   [{ version, text, timestamp, editor }]
  }
  ```

---

## QA Checklist After Deploy

- [ ] No flash of old text on page load (hard refresh `Cmd+Shift+R`)
- [ ] Hero headline shows client's edited text (not "Care that begins with listening")
- [ ] All text on landing page is click-to-edit in admin mode
- [ ] Thank-you screen copy is editable
- [ ] Intake page label + buttons are editable
- [ ] Footer copyright is editable
- [ ] Admin email subject reads "Luminal Journeys: New Intake Has Arrived — [Name]"
- [ ] Logo renders in both client + admin emails (run `npx wrangler deploy` from Mac for this)

---

## Worker Deploy (Email Logo — Separate from CI)

The Cloudflare Worker must be deployed manually from Mac (Linux binary mismatch):
```bash
cd /Users/springsparrow/01-tie-babeh-apps/luminaljourneys/workers/intake-mailer
npx wrangler deploy
```
This fixes: logo not rendering in emails, old subject line still showing.

---

## Do Not

- Do not run `npm ci` or `wrangler deploy` in the Linux bash sandbox — wrong platform binaries
- Do not commit `dist/` — it's now in `.gitignore` but old tracked files need `git rm --cached`
- Do not modify files in `sources/` in the 2nd Brain wiki
