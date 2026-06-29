/**
 * seed-content.mjs — Luminal Journeys
 *
 * Seeds all EditableContent keys into Firestore for both staging and production.
 * Run ONCE after deploy to make Firestore the source of truth.
 * Safe to re-run — uses { merge: true } so existing client edits are never overwritten.
 *
 * Usage:
 *   node scripts/seed-content.mjs
 *
 * Requires: firebase-admin, a service account key at scripts/serviceAccountKey.json
 * OR: set GOOGLE_APPLICATION_CREDENTIALS env var to the key path.
 *
 * Install admin SDK if needed:
 *   npm install firebase-admin --save-dev
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Auth ──────────────────────────────────────────────────────────────────────
const KEY_PATH = resolve(__dirname, 'serviceAccountKey.json')

if (!getApps().length) {
  if (existsSync(KEY_PATH)) {
    initializeApp({ credential: cert(JSON.parse(readFileSync(KEY_PATH, 'utf8'))) })
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    initializeApp({ credential: cert(JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'))) })
  } else {
    console.error(`
❌ No Firebase credentials found.

Options:
  1. Download a service account key from Firebase Console →
     Project Settings → Service Accounts → Generate new private key
     Save it to: scripts/serviceAccountKey.json

  2. Or set GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
`)
    process.exit(1)
  }
}

const db = getFirestore()

// ── All content keys and their defaults ───────────────────────────────────────
const YEAR = new Date().getFullYear()

const DEFAULTS = {
  // Brand
  'brand.wordmark':              'Luminal Journeys',

  // Navigation
  'nav.link.principles':         'Our Practice',
  'nav.link.process':            'Process',
  'nav.cta':                     'Discover Your Journey',
  'nav.backhome':                '← Home',

  // Hero section
  'hero.headline.pre':           'Care that begins',
  'hero.headline.em':            'listening.',
  'hero.cta.label':              'Discover Your Journey →',
  'hero.cta.sub':                '5 minutes · No commitment required',

  // Process section
  'process.section.label':       'The Process',

  // Manifesto section
  'manifesto.cta':               'Discover Your Journey →',

  // Footer
  'footer.copyright':            `© ${YEAR} Luminal Journeys · All rights reserved`,

  // Intake page
  'intake.page.label':           'New Client Intake',
  'intake.btn.back':             '← Back',
  'intake.btn.continue':         'Continue →',

  // Thank-you screen
  'thankyou.headline':           'Thank you',
  'thankyou.body.email':         "We've received your intake form and will reach out to",
  'thankyou.body.timeframe':     'within 1–2 business days.',
  'thankyou.body.noemail':       "We've received your intake form and will be in touch shortly.",
  'thankyou.backhome':           '← Back to home',

  // Dynamic pages
  'page.cta.book':               'Book a Consultation',

  // 404 page
  '404.headline':                'Page not found',
  '404.body':                    "This page doesn't exist yet — or it may have been removed.",
}

// ── Seed function ─────────────────────────────────────────────────────────────
async function seedCollection(collName) {
  console.log(`\nSeeding: ${collName}`)
  const now = Timestamp.now()
  let seeded = 0
  let skipped = 0

  for (const [key, defaultText] of Object.entries(DEFAULTS)) {
    const ref = db.collection(collName).doc(key)
    const snap = await ref.get()

    if (snap.exists) {
      // Doc exists — check if it already has a current value
      const data = snap.data()
      if (data.current) {
        console.log(`  ⏭  ${key} — already has content, skipping`)
        skipped++
        continue
      }
    }

    // No doc, or doc exists but has no current value — seed it
    const history = [{
      version:   0,
      text:      defaultText,
      timestamp: new Date().toISOString(),
      editor:    'seed-script',
    }]

    await ref.set({
      current:   defaultText,
      updatedAt: now,
      history,
    }, { merge: true })

    console.log(`  ✓  ${key}`)
    seeded++
  }

  console.log(`  → ${seeded} seeded, ${skipped} skipped (already had content)`)
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Luminal Journeys — Content Seed Script')
  console.log(`   Seeding ${Object.keys(DEFAULTS).length} content keys`)
  console.log('   Uses { merge: true } — existing client edits are never overwritten\n')

  await seedCollection('content_edits_staging')
  await seedCollection('content_edits_production')

  console.log('\n✅ Seed complete. Firestore is now the source of truth.')
  console.log('   The JSX fallbacks are now emergency safety nets only.')
  console.log('   Clients will never see hardcoded text flash on page load.')
  process.exit(0)
}

main().catch(err => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
