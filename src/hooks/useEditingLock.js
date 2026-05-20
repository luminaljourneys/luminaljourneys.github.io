/**
 * useEditingLock.js — Luminal Journeys
 *
 * Firestore-based presence locking for collaborative editing.
 * Each editable section (identified by contentKey) has one lock doc:
 *   editing_locks/{contentKey} → { lockedBy, lockedAt, expiresAt }
 *
 * When an editor opens the EditPanel:
 *   1. acquireLock() writes their lock doc
 *   2. A refresh interval keeps the lock alive every 90s
 *   3. releaseLock() deletes the doc on close/save
 *
 * All other editors subscribe via onSnapshot and see the lock immediately.
 * Locks auto-expire after LOCK_TTL_MS so a crash/close can't block the section.
 *
 * Usage:
 *   const { lock, isLockedByMe, acquireLock, releaseLock } = useEditingLock(contentKey)
 */

import { useEffect, useState, useRef, useCallback } from 'react'
import { doc, onSnapshot, setDoc, deleteDoc, Timestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useEditMode } from '../context/EditModeContext'
import { LOCKS_COLL, LOCK_TTL_MS } from '../lib/collections'

const REFRESH_MS = 90 * 1000  // refresh lock TTL every 90s while panel is open

export function useEditingLock(contentKey) {
  const { currentUser, hasFirebaseAuth } = useEditMode()
  const [lock, setLock] = useState(null)   // { lockedBy: { displayName, email }, expiresAt }
  const refreshRef = useRef(null)

  // ── Subscribe to lock state in real time ──────────────────────────────────
  useEffect(() => {
    const ref = doc(db, LOCKS_COLL, contentKey)
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) { setLock(null); return }
      const data = snap.data()
      // Treat expired locks as if they don't exist
      const expiresAt = data.expiresAt instanceof Timestamp
        ? data.expiresAt.toMillis()
        : (data.expiresAt?.seconds ? data.expiresAt.seconds * 1000 : 0)
      if (Date.now() > expiresAt) { setLock(null); return }
      setLock(data)
    }, () => setLock(null))  // on error, treat as unlocked
    return () => unsub()
  }, [contentKey])

  // ── Acquire lock — call when EditPanel opens ──────────────────────────────
  const acquireLock = useCallback(async () => {
    if (!currentUser || !hasFirebaseAuth) return  // only real Firebase Auth sessions
    const ref = doc(db, LOCKS_COLL, contentKey)
    const build = () => ({
      lockedBy: {
        displayName: currentUser.displayName ?? currentUser.email,
        email:       currentUser.email,
      },
      lockedAt:  Timestamp.now(),
      expiresAt: Timestamp.fromMillis(Date.now() + LOCK_TTL_MS),
    })
    try {
      await setDoc(ref, build())
      // Keep lock alive while panel stays open
      refreshRef.current = setInterval(async () => {
        try { await setDoc(ref, build()) } catch { /* ignore refresh errors */ }
      }, REFRESH_MS)
    } catch (e) {
      console.warn('[EditingLock] Could not acquire lock:', e.message)
    }
  }, [contentKey, currentUser, hasFirebaseAuth])

  // ── Release lock — call when EditPanel closes ─────────────────────────────
  const releaseLock = useCallback(async () => {
    clearInterval(refreshRef.current)
    try { await deleteDoc(doc(db, LOCKS_COLL, contentKey)) } catch { /* ignore */ }
  }, [contentKey])

  // Cleanup on unmount (handles browser tab close / component removal)
  useEffect(() => {
    return () => {
      clearInterval(refreshRef.current)
      // Best-effort delete — may not complete if tab is closing, but TTL handles it
      deleteDoc(doc(db, LOCKS_COLL, contentKey)).catch(() => {})
    }
  }, [contentKey])

  const isLockedByMe = !!lock && lock.lockedBy?.email === currentUser?.email

  return { lock, isLockedByMe, acquireLock, releaseLock }
}
