# Claude Code Prompt — Email Header Logo Fix
## Luminal Journeys · intake-mailer Cloudflare Worker

---

## Context

You are working on the Luminal Journeys project at:
`/Users/springsparrow/01-tie-babeh-apps/luminaljourneys/`

The email delivery system is a Cloudflare Worker at:
`workers/intake-mailer/worker.js`

It sends two transactional emails via Postmark after an intake form submission:
1. **Client confirmation** — goes to the person who filled out the form
2. **Admin notification** — goes to `intakes@luminaljourneys.com`

Both emails share the same `emailHeader()` function, which should render a branded dark green header with a gold logo mark on the left, a thin vertical divider, and "LUMINAL JOURNEYS" wordmark on the right — exactly mirroring the site's navigation bar.

---

## The Problem

The email header logo is **not rendering** in either email type. The header shows only the text "Luminal Journeys" on a dark green background, but the gold circular logo mark image is broken/missing.

The current code has `const LOGO_B64` defined at line ~158 with a valid inline base64 PNG data URI, and `emailHeader()` references `src="${LOGO_B64}"`. Despite this, the image does not appear when the emails are received.

**Root cause to investigate:**
- Confirm `LOGO_B64` is correctly assigned and not truncated
- Confirm `src="${LOGO_B64}"` is actually in the rendered `<img>` tag (not `LOGO_URL` or any other variable name)
- Confirm the base64 string is a valid PNG — run it through a decoder if needed
- Confirm the `emailHeader()` function is being called in both `clientEmailHtml()` and `adminEmailHtml()`

---

## The Reference Design

The nav bar HTML from the live site (`luminaljourneys.com`) is the exact design to match in email:

```html
<div data-testid="nav-logo" style="display: flex; align-items: center; gap: 0.75rem;">
  <img
    alt="Luminal Journeys"
    src="/luminaljourneys-primary-logo-mark-gold.transparent.png"
    style="height: 60px; width: auto; display: block;"
  />
  <div style="width: 1px; height: 32px; background: rgba(23, 47, 45, 0.1);"></div>
  <span style="font-family: "DM Sans", sans-serif; font-size: 0.85rem; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: rgb(23, 47, 45); line-height: 1;">
    Luminal Journeys
  </span>
</div>
```

**Translate this to email-safe HTML** (table layout, no flexbox):
- Logo mark: `<img>` with inline base64 src, `width="44" height="44"`, `display:block`
- Vertical rule: single-pixel `<td>` with background color, NOT a CSS border
- Wordmark: `<span>` with `font-family:Georgia,serif` (DM Sans not available in email clients), `font-size:13px`, `letter-spacing:0.18em`, `text-transform:uppercase`, `color:#e6ddd0`
- All three elements in a single `<table>` row with three `<td>` cells
- Outer `<td>` background: `#172f2d` (deep forest green)

---

## The Logo Asset

The source PNG is at:
`public/luminaljourneys-primary-logo-mark-gold.transparent.png`

It is 1254×1254px RGBA. For email it must be resized to **80×80px** (displays at 40px, 2× retina) and base64-encoded inline. Use Python + PIL:

```python
from PIL import Image
import base64, io

img = Image.open('public/luminaljourneys-primary-logo-mark-gold.transparent.png')
img_resized = img.resize((80, 80), Image.LANCZOS)
buf = io.BytesIO()
img_resized.save(buf, format='PNG', optimize=True)
b64 = base64.b64encode(buf.getvalue()).decode()
print(f"data:image/png;base64,{b64}")
```

Expected output: ~8,696 character base64 string. The `data:image/png;base64,` prefix must be included in the `src` attribute.

---

## What To Fix

### 1. Regenerate and replace `LOGO_B64`

Run the Python script above from the project root. Replace the entire `LOGO_B64` constant in `worker.js` with the fresh output. Do NOT truncate or summarise the base64 string — it must be the complete value.

### 2. Fix `emailHeader()` — email-safe table layout

Replace the current `emailHeader()` function with this structure:

```javascript
function emailHeader() {
  return `
  <tr>
    <td style="background:#172f2d;padding:20px 32px;text-align:center;">
      <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
        <tr>
          <td style="vertical-align:middle;padding-right:12px;">
            <img
              src="${LOGO_B64}"
              alt="Luminal Journeys"
              width="44" height="44"
              style="display:block;border:0;width:44px;height:44px;"
            />
          </td>
          <td style="vertical-align:middle;padding-right:12px;">
            <div style="width:1px;height:32px;background:rgba(255,255,255,0.18);font-size:0;line-height:0;">&nbsp;</div>
          </td>
          <td style="vertical-align:middle;">
            <span style="font-family:Georgia,serif;font-size:13px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#e6ddd0;white-space:nowrap;line-height:1;">Luminal Journeys</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}
```

### 3. Verify both email functions call `emailHeader()`

Confirm `clientEmailHtml()` and `adminEmailHtml()` both include `${emailHeader()}` as the first row inside their outer `<table>`.

### 4. Verify the admin subject line

The admin email subject must read:
```
Luminal Journeys: New Intake Has Arrived — {firstName} {lastName}
```
Not `[LUMINAL JOURNEYS] [PRODUCTION]` or any other format.

---

## Verification Steps

After making changes:

1. **Check the base64 is valid** — run this in Node:
   ```bash
   node -e "
   const fs = require('fs');
   const src = fs.readFileSync('workers/intake-mailer/worker.js', 'utf8');
   const match = src.match(/LOGO_B64 = 'data:image\/png;base64,([^']+)'/);
   if (match) {
     const buf = Buffer.from(match[1], 'base64');
     console.log('Base64 length:', match[1].length);
     console.log('Decoded bytes:', buf.length);
     console.log('PNG header:', buf.slice(0,4).toString('hex')); // should be 89504e47
   } else {
     console.log('LOGO_B64 not found or malformed');
   }
   "
   ```
   Expected: base64 length ~8696, decoded bytes ~6520, PNG header `89504e47`.

2. **Deploy the worker:**
   ```bash
   cd workers/intake-mailer
   npx wrangler deploy
   ```
   This MUST be run from macOS — the Linux sandbox has the wrong workerd binary.

3. **Test with maildrop.cc** — submit the intake form at `luminaljourneys.com/intake` using any `*@maildrop.cc` address. Check the inbox at `maildrop.cc/inbox/?mailbox=*`.

4. **QA checklist for both emails:**
   - [ ] Gold circular logo mark visible (not a broken image icon)
   - [ ] Thin vertical rule between logo and wordmark
   - [ ] "LUMINAL JOURNEYS" wordmark in uppercase next to the logo
   - [ ] Dark green header background (#172f2d)
   - [ ] Admin email subject: "Luminal Journeys: New Intake Has Arrived — [Name]"
   - [ ] Client email subject: "We've received your intake form, [Name] ✦"

---

## Do Not

- Do not use a hosted `https://` URL for the logo `src` — Gmail and corporate mail clients block external image requests
- Do not use `data:` URIs stored in a separate variable with a different name than `LOGO_B64`
- Do not truncate the base64 string with a comment like `// truncated for clarity`
- Do not use CSS `display:flex` or `display:grid` in email HTML — use `<table>` layout only
- Do not run `wrangler deploy` from the Linux bash sandbox — it will fail with a binary mismatch error
