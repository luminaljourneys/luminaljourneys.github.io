/**
 * scripts/check-editors.mjs
 * Reads + manages site_config/authorized_editors via Firestore REST API.
 *
 * Uses `firebase login:print-access-token` for credentials — no service
 * account key needed, bypasses Firestore security rules entirely.
 *
 * Usage:
 *   node scripts/check-editors.mjs                        # list all editors
 *   node scripts/check-editors.mjs --add email@domain.com # add an email
 *   node scripts/check-editors.mjs --remove email@x.com   # remove an email
 *   node scripts/check-editors.mjs --set a@x.com b@x.com  # replace entire list
 */

import { execSync } from 'child_process'

const PROJECT   = 'luminaljourneys'
const DOC_PATH  = 'site_config/authorized_editors'
const BASE_URL  = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`
const DOC_URL   = `${BASE_URL}/${DOC_PATH}`

// ── Get access token from Firebase CLI ───────────────────────────────────────
function getToken() {
  // 1. Try Firebase CLI (interactive — opens browser if needed)
  try {
    const t = execSync('firebase login:print-access-token 2>/dev/null', {
      encoding: 'utf8',
      timeout: 10_000,
    }).trim()
    if (t) return t
  } catch { /* fall through */ }

  // 2. Try gcloud (works when logged in via gcloud auth login)
  try {
    const t = execSync('gcloud auth print-access-token 2>/dev/null', {
      encoding: 'utf8',
      timeout: 10_000,
    }).trim()
    if (t) return t
  } catch { /* fall through */ }

  console.error('❌  Could not get an access token. Fix with one of:')
  console.error('    firebase login          (then re-run this script)')
  console.error('    gcloud auth login       (alternative)')
  process.exit(1)
}

// ── Firestore REST helpers ────────────────────────────────────────────────────

// Convert Firestore REST document → plain { emails: [...] }
function parseDoc(firestoreDoc) {
  const raw = firestoreDoc?.fields?.emails?.arrayValue?.values ?? []
  return raw.map(v => v.stringValue).filter(Boolean)
}

// Convert emails array → Firestore REST PATCH body
function buildPatchBody(emails) {
  return JSON.stringify({
    fields: {
      emails: {
        arrayValue: {
          values: emails.map(e => ({ stringValue: e })),
        },
      },
    },
  })
}

async function readDoc(token) {
  const res = await fetch(DOC_URL, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 404) return null
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GET failed ${res.status}: ${text}`)
  }
  return res.json()
}

async function writeDoc(token, emails) {
  // PATCH with updateMask to only touch the emails field
  const url = `${DOC_URL}?updateMask.fieldPaths=emails`
  const res = await fetch(url, {
    method:  'PATCH',
    headers: {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: buildPatchBody(emails),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PATCH failed ${res.status}: ${text}`)
  }
  return res.json()
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const args   = process.argv.slice(2)
  const cmd    = args[0]  // --add | --remove | --set | undefined
  const token  = getToken()

  console.log(`\n📋 Reading ${DOC_PATH}...\n`)
  const existing = await readDoc(token)

  let emails = existing ? parseDoc(existing) : []

  if (!existing) {
    console.log('⚠️   Document does not exist yet — will create it.\n')
  } else {
    console.log(`✅  Document found. ${emails.length} authorized editor(s):\n`)
    emails.forEach((e, i) => console.log(`  [${i}] ${e}`))
  }

  // ── --add ─────────────────────────────────────────────────────────────────
  if (cmd === '--add') {
    const toAdd = args.slice(1).map(e => e.trim().toLowerCase()).filter(Boolean)
    if (!toAdd.length) { console.error('Usage: --add email@domain.com'); process.exit(1) }
    const updated = [...new Set([...emails, ...toAdd])]
    await writeDoc(token, updated)
    console.log(`\n✅  Added ${toAdd.join(', ')}`)
    console.log('    Full list now:', updated)
    process.exit(0)
  }

  // ── --remove ──────────────────────────────────────────────────────────────
  if (cmd === '--remove') {
    const toRemove = args.slice(1).map(e => e.trim().toLowerCase())
    const updated  = emails.filter(e => !toRemove.includes(e.toLowerCase()))
    await writeDoc(token, updated)
    console.log(`\n✅  Removed ${toRemove.join(', ')}`)
    console.log('    Full list now:', updated)
    process.exit(0)
  }

  // ── --set ─────────────────────────────────────────────────────────────────
  if (cmd === '--set') {
    const updated = args.slice(1).map(e => e.trim().toLowerCase()).filter(Boolean)
    if (!updated.length) { console.error('Usage: --set a@x.com b@x.com ...'); process.exit(1) }
    await writeDoc(token, updated)
    console.log('\n✅  Replaced authorized editors list:')
    updated.forEach((e, i) => console.log(`  [${i}] ${e}`))
    process.exit(0)
  }

  // ── read-only: show auth status for each known editor ────────────────────
  const known = [
    'drwangjones@gmail.com',
    'cullensarahbetty@gmail.com',
    'wouter@keijser.com',
    'dpendragon@pacbell.net',
    'support@getbridgelogics.com',
    'hi@keeya.nl',
  ]
  console.log('\n🔍  Status of known editors:')
  const norm = emails.map(e => e.trim().toLowerCase())
  known.forEach(e => {
    const ok = norm.includes(e.toLowerCase())
    console.log(`  ${ok ? '✅' : '❌'}  ${e}`)
  })

  if (!emails.length) {
    console.log('\n💡  Document is empty. Seed it with:')
    console.log('    node scripts/check-editors.mjs --set drwangjones@gmail.com cullensarahbetty@gmail.com wouter@keijser.com dpendragon@pacbell.net support@getbridgelogics.com hi@keeya.nl')
  }

  process.exit(0)
}

main().catch(e => { console.error('\n❌  Error:', e.message); process.exit(1) })
