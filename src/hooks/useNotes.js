/**
 * useNotes.js — Luminal Journeys
 * Collaborative notes tied to page sections, backed by Firestore.
 * Author identity comes from the logged-in Google user (no name picker).
 *
 * Firestore shape — collection: page_notes
 * {
 *   sectionKey:  string   (e.g. "hero-heading", "intake-step-1")
 *   pageId:      string   (derived from pathname)
 *   text:        string
 *   author:      { displayName, email, photoURL }
 *   createdAt:   Timestamp
 *   resolved:    boolean
 *   replies:     [{ id, text, author, createdAt }]
 * }
 */

import { useState, useEffect } from 'react'
import {
  collection, query, where, onSnapshot,
  addDoc, updateDoc, doc, serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import { NOTES_COLL } from '../lib/collections'

// ── Derive a stable pageId from the current pathname ─────────────────────────
export function getPageId() {
  const parts = window.location.pathname.split('/').filter(Boolean)
  return parts.length > 0 ? parts[parts.length - 1] : 'landing'
}

// ── All notes for the current page (realtime) ─────────────────────────────────
export function usePageNotes() {
  const [notes,   setNotes]   = useState([])
  const [loading, setLoading] = useState(true)
  const pageId = getPageId()

  useEffect(() => {
    const q = query(
      collection(db, NOTES_COLL),
      where('pageId', '==', pageId),
    )
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const aMs = a.createdAt?.toMillis?.() ?? 0
            const bMs = b.createdAt?.toMillis?.() ?? 0
            return aMs - bMs
          })
        setNotes(docs)
        setLoading(false)
      },
      () => setLoading(false),
    )
    return unsub
  }, [pageId])

  return { notes, loading, pageId }
}

// ── Notes for a single section key (excludes resolved) ───────────────────────
export function useSectionNotes(sectionKey) {
  const { notes } = usePageNotes()
  return notes.filter(n => n.sectionKey === sectionKey && !n.resolved)
}

// ── Actions ───────────────────────────────────────────────────────────────────
export async function addNote(sectionKey, pageId, text, author) {
  await addDoc(collection(db, NOTES_COLL), {
    sectionKey,
    pageId,
    text:      text.trim(),
    author:    { displayName: author.displayName, email: author.email, photoURL: author.photoURL ?? null },
    createdAt: serverTimestamp(),
    resolved:  false,
    replies:   [],
  })
}

export async function addReply(noteId, currentReplies, text, author) {
  const reply = {
    id:        crypto.randomUUID(),
    text:      text.trim(),
    author:    { displayName: author.displayName, email: author.email, photoURL: author.photoURL ?? null },
    createdAt: Timestamp.now(),
  }
  await updateDoc(doc(db, NOTES_COLL, noteId), {
    replies: [...currentReplies, reply],
  })
}

export async function resolveNote(noteId) {
  await updateDoc(doc(db, NOTES_COLL, noteId), { resolved: true })
}
