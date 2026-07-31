/**
 * migrate-cta-text.mjs — Luminal Journeys
 *
 * One-time migration: updates the 3 CTA keys from "Discover Your Journey"
 * to "Get Started" in both Firestore collections.
 *
 * Unlike seed-content.mjs, this FORCES the update (overwrites current value).
 *
 * Usage:
 *   node scripts/migrate-cta-text.mjs
 *
 * Requires: scripts/serviceAccountKey.json
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const KEY_PATH = resolve(__dirname, 'serviceAccountKey.json')

if (!getApps().length) {
  if (existsSync(KEY_PATH)) {
    initializeApp({ credential: cert(JSON.parse(readFileSync(KEY_PATH, 'utf8'))) })
  } else {
    console.error('❌ No service account key found at scripts/serviceAccountKey.json')
    process.exit(1)
  }
}

const db = getFirestore()

// Keys to force-update
const UPDATES = {
  'nav.cta':         'Get Started',
  'hero.cta.label':  'Get Started →',
  'manifesto.cta':   'Get Started →',
}

async function migrateCollection(collName) {
  console.log(`\nMigrating: ${collName}`)
  const now = Timestamp.now()

  for (const [key, newText] of Object.entries(UPDATES)) {
    const ref = db.collection(collName).doc(key)
    const snap = await ref.get()
    const oldText = snap.exists ? snap.data()?.current : '(no doc)'

    // Append to history, don't replace it
    const existingHistory = snap.exists ? (snap.data()?.history ?? []) : []
    const newEntry = {
      version:   existingHistory.length,
      text:      newText,
      timestamp: new Date().toISOString(),
      editor:    'migrate-cta-text',
    }

    await ref.set({
      current:   newText,
      updatedAt: now,
      history:   [...existingHistory, newEntry],
    }, { merge: true })

    console.log(`  ✓  ${key}: "${oldText}" → "${newText}"`)
  }
}

async function main() {
  console.log('🔄 Luminal Journeys — CTA Text Migration')
  console.log('   Updating 3 keys: nav.cta, hero.cta.label, manifesto.cta')
  console.log('   "Discover Your Journey" → "Get Started"')

  await migrateCollection('content_edits_staging')
  await migrateCollection('content_edits_production')

  console.log('\n✅ Migration complete.')
  console.log('   Reload admin.luminaljourneys.com and luminaljourneys.com to confirm.')
  process.exit(0)
}

main().catch(err => {
  console.error('❌ Migration failed:', err)
  process.exit(1)
})
