/**
 * usePublish.js — Luminal Journeys
 * Batch-copies all staging Firestore collections → production counterparts.
 * No redeploy needed — production site reads from *_production collections.
 *
 * Collections copied:
 *   content_edits_staging  → content_edits_production
 *   pages_staging          → pages_production
 *   site_config/form_staging → site_config/form_production
 */

import { useState } from 'react'
import {
  collection, getDocs, doc, setDoc, writeBatch, serverTimestamp, getDoc
} from 'firebase/firestore'
import { db } from '../firebase'
import {
  CONTENT_COLL, CONTENT_PROD_COLL,
  PAGES_COLL,   PAGES_PROD_COLL,
  FORM_CONFIG_COLL, FORM_CONFIG_DOC, FORM_PROD_DOC,
  PUBLISH_COLL,
  IS_STAGING,
} from '../lib/collections'

export function usePublish() {
  const [publishing, setPublishing] = useState(false)
  const [lastPublished, setLastPublished] = useState(null)
  const [error, setError]           = useState(null)

  const publish = async () => {
    if (!IS_STAGING) {
      setError('Publish is only available in staging mode.')
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
        publisher: 'editor',
      })

      setLastPublished(ts)
    } catch (e) {
      console.error('[usePublish] Publish failed:', e)
      setError('Publish failed — please try again.')
    } finally {
      setPublishing(false)
    }
  }

  return { publish, publishing, lastPublished, error }
}

// ── Helper: copy every doc from one top-level collection to another ───────────
async function copyCollection(srcColl, dstColl) {
  const snap  = await getDocs(collection(db, srcColl))
  if (snap.empty) return

  // Firestore batch allows up to 500 ops; chunk if needed
  const docs  = snap.docs
  const CHUNK = 400
  for (let i = 0; i < docs.length; i += CHUNK) {
    const batch = writeBatch(db)
    docs.slice(i, i + CHUNK).forEach(d => {
      batch.set(doc(db, dstColl, d.id), { ...d.data(), publishedAt: serverTimestamp() })
    })
    await batch.commit()
  }
}
