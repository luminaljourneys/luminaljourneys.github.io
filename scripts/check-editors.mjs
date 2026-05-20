/**
 * scripts/check-editors.mjs
 * Reads site_config/authorized_editors from Firestore and prints all emails.
 * Run: node scripts/check-editors.mjs
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// Load .env.local manually
const __dir = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dir, '../.env.local')
const env = {}
try {
  readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [k, ...v] = line.split('=')
    if (k && k.startsWith('VITE_')) env[k.trim()] = v.join('=').trim()
  })
} catch { /* .env.local missing */ }

const firebaseConfig = {
  apiKey:     env.VITE_FIREBASE_API_KEY     || 'AIzaSyBr7fy8CAIUg5ab4Gc_ZnXtZOVn4CpCMD8',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'luminaljourneys.firebaseapp.com',
  projectId:  env.VITE_FIREBASE_PROJECT_ID  || 'luminaljourneys',
}

const app = initializeApp(firebaseConfig)
const db  = getFirestore(app)

async function main() {
  console.log('\n📋 Reading site_config/authorized_editors...\n')
  const snap = await getDoc(doc(db, 'site_config', 'authorized_editors'))

  if (!snap.exists()) {
    console.log('❌  Document does not exist at site_config/authorized_editors')
    console.log('    Make sure it is inside the site_config COLLECTION (not a top-level collection).')
    process.exit(1)
  }

  const data = snap.data()
  const emails = data.emails ?? []

  console.log(`✅  Document found. emails array has ${emails.length} entries:\n`)
  emails.forEach((e, i) => {
    const display = JSON.stringify(e) // shows hidden spaces, null, etc.
    console.log(`  [${i}] ${display}`)
  })

  // Check for hi@keeya.nl specifically
  const target = 'hi@keeya.nl'
  const normalized = emails.filter(Boolean).map(e => e.trim().toLowerCase())
  const found = normalized.includes(target.toLowerCase())
  console.log(`\n🔍  "${target}" authorized: ${found ? '✅ YES' : '❌ NO'}`)

  if (!found) {
    console.log('\n💡  To add it, run: node scripts/check-editors.mjs --add hi@keeya.nl')
  }

  // --add flag
  const addEmail = process.argv[3]
  if (process.argv[2] === '--add' && addEmail) {
    const updated = [...new Set([...emails.filter(Boolean).map(e => e.trim()), addEmail.trim()])]
    await setDoc(doc(db, 'site_config', 'authorized_editors'), { emails: updated }, { merge: true })
    console.log(`\n✅  Added "${addEmail}" → emails array now:`, updated)
  }

  process.exit(0)
}

main().catch(e => { console.error('Error:', e.message); process.exit(1) })
