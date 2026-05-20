/**
 * usePublish.js — Luminal Journeys
 * Batch-copies all staging Firestore collections → production counterparts.
 * No redeploy needed — production site reads from *_production collections.
 *
 * Collections copied:
 *   content_edits_staging    → content_edits_production
 *   pages_staging            → pages_production
 *   site_config/form_staging → site_config/form_production
 *
 * Auth requirement:
 *   Firestore security rules require a Firebase Auth token (Google or email
 *   magic link). Password-only sessions have no Firebase token — publishing
 *   from those sessions is blocked with a clear error message.
 */

import { useState } from 'react'
import {
  collection, getDocs, doc, setDoc, writeBatch, serverTimestamp, getDoc
} from 'firebase/firestore'
import { auth, db } from '../firebase'
import {
  CONTENT_COLL, CONTENT_PROD_COLL,
  PAGES_COLL,   PAGES_PROD_COLL,
  FORM_CONFIG_COLL, FORM_CONFIG_DOC, FORM_PROD_DOC,
  PUBLISH_COLL,
  IS_STAGING,
} from '../lib/collections'

// Firestore rules evaluate isAuthorizedEditor() once per write operation in a
// batch. Each evaluation calls exists() + get() on authorized_editors = 2 reads.
// The per-request limit is 20 reads, so safe batch size is floor(20/2) - 1 = 9.
const BATCH_CHUNK = 9

export function usePublish() {
  const [publishing,    setPublishing]    = useState(false)
  const [lastPublished, setLastPublished] = useState(null)
  const [error,         setError]         = useState(null)

  const publish = async () => {
    if (!IS_STAGING) {
      setError('Publish is only available in staging mode.')
      return
    }

    // ── Require Firebase Auth ─────────────────────────────────────────────────
    // Password login only creates a local session — no Firebase token is issued,
    // so Firestore security rules will reject all writes. Google Sign-In and
    // email magic link both produce a real Firebase token and can publish.
    const firebaseUser = auth.currentUser
    if (!firebaseUser) {
      setError('Publishing requires signing in with Google or email link. Password sessions cannot write to production.')
      return
    }

    setPublishing(true)
    setError(null)

    try {
      // ── 1. Copy content_edits_staging → content_edits_production ──────────
      await copyCollection(CONTENT_COLL, CONTENT_PROD_COLL)

      // ── 2. Copy pages_staging → pages_production ───────────────────────────
      await copyCollection(PAGES_COLL, PAGES_PROD_COLL)

      // ── 3. Copy site_config/form_staging → site_config/form_production ─────
      const formSnap = await getDoc(doc(db, FORM_CONFIG_COLL, FORM_CONFIG_DOC))
      if (formSnap.exists()) {
        await setDoc(doc(db, FORM_CONFIG_COLL, FORM_PROD_DOC), {
          ...formSnap.data(),
          publishedAt: serverTimestamp(),
        })
      }

      // ── 4. Log publish event ───────────────────────────────────────────────
      const ts = new Date().toISOString()
      await setDoc(doc(db, PUBLISH_COLL, ts), {
        publishedAt: serverTimestamp(),
        publishedBy: {
          email:       firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email,
          uid:         firebaseUser.uid,
        },
      })

      setLastPublished(ts)
    } catch (e) {
      console.error('[usePublish] Publish failed:', e)
      if (e?.code === 'permission-denied') {
        setError(
          'Permission denied. Make sure your account is on the authorized editors list ' +
          'and that Firestore rules are deployed (firebase deploy --only firestore:rules).'
        )
      } else {
        setError(`Publish failed: ${e?.message ?? 'unknown error'}. Check the console for details.`)
      }
    } finally {
      setPublishing(false)
    }
  }

  return { publish, publishing, lastPublished, error }
}

// ── Helper: copy every doc from src collection → dst collection ───────────────
// Chunks into batches of BATCH_CHUNK to stay within Firestore's 20-read limit
// for security rule evaluation (isAuthorizedEditor calls exists() + get() = 2
// reads per write, so 9 writes × 2 = 18 reads — safely under the 20 cap).
async function copyCollection(srcColl, dstColl) {
  const snap = await getDocs(collection(db, srcColl))
  if (snap.empty) return

  const docs = snap.docs
  for (let i = 0; i < docs.length; i += BATCH_CHUNK) {
    const batch = writeBatch(db)
    docs.slice(i, i + BATCH_CHUNK).forEach(d => {
      batch.set(doc(db, dstColl, d.id), { ...d.data(), publishedAt: serverTimestamp() })
    })
    await batch.commit()
  }
}
