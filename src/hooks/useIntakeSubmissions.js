/**
 * useIntakeSubmissions.js — Luminal Journeys
 *
 * Real-time Firestore listener for intake_submissions.
 * Shows ALL submissions regardless of environment so the admin panel at
 * admin.luminaljourneys.com can see both real client submissions
 * (env='production' from luminaljourneys.com) and staging/QA submissions.
 * The env column in the table indicates which domain each came from.
 *
 * Returns:
 *   intakes        — sorted array of submission objects (newest first)
 *   loading        — true while the first snapshot is pending
 *   error          — string | null
 *   updateStatus   — (id, newStatus) → writes status to Firestore
 *   updateNotes    — (id, notes)     → writes notes  to Firestore
 */

import { useState, useEffect } from 'react'
import {
  collection, query, orderBy,
  onSnapshot, doc, updateDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

const INTAKE_COLL = 'intake_submissions'

export function useIntakeSubmissions() {
  const [intakes, setIntakes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    // ── Test bypass ───────────────────────────────────────────────────────────
    // window.__pw_submissions is injected by mock-firebase.js addInitScript.
    // onSnapshot uses the Firestore WebChannel (gRPC-web), not the REST API,
    // so it cannot be intercepted at the network layer in Playwright tests.
    // Instead, we short-circuit here and return the injected fixture data.
    if (typeof window !== 'undefined' && Array.isArray(window.__pw_submissions)) {
      setIntakes(window.__pw_submissions.map(s => ({
        ...s,
        // submittedAt is injected as epoch ms (number); convert to Date for fmt()
        submittedAt: s.submittedAt ? new Date(s.submittedAt) : null,
      })))
      setLoading(false)
      return
    }

    // No env filter — admin sees all submissions (production + staging).
    // Single-field index on submittedAt is auto-created by Firestore.
    const q = query(
      collection(db, INTAKE_COLL),
      orderBy('submittedAt', 'desc'),
    )

    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map(d => ({
          id: d.id,
          ...d.data(),
          // Normalise Firestore Timestamp → JS Date for display
          submittedAt: d.data().submittedAt?.toDate?.() ?? null,
        }))
        setIntakes(docs)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error('[useIntakeSubmissions] Firestore error:', err)
        setError(err.message)
        setLoading(false)
      },
    )

    return unsub
  }, [])

  /** Cycle status and persist to Firestore */
  async function updateStatus(id, newStatus) {
    // Optimistic update — snapshot will confirm
    setIntakes(prev =>
      prev.map(r => r.id === id ? { ...r, status: newStatus } : r)
    )
    try {
      await updateDoc(doc(db, INTAKE_COLL, id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      })
    } catch (err) {
      console.error('[useIntakeSubmissions] updateStatus failed:', err)
    }
  }

  /** Save admin notes and persist to Firestore */
  async function updateNotes(id, notes) {
    setIntakes(prev =>
      prev.map(r => r.id === id ? { ...r, notes } : r)
    )
    try {
      await updateDoc(doc(db, INTAKE_COLL, id), {
        notes,
        updatedAt: serverTimestamp(),
      })
    } catch (err) {
      console.error('[useIntakeSubmissions] updateNotes failed:', err)
    }
  }

  return { intakes, loading, error, updateStatus, updateNotes }
}
