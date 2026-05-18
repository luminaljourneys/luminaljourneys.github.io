/**
 * useEditableContent.js — Luminal Journeys
 * Loads content from Firestore `content_edits/{contentKey}`.
 * Falls back to the hardcoded string if the doc doesn't exist yet.
 * Saves new content with full version history so the client can restore.
 */

import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { CONTENT_COLL } from '../lib/collections'

export function useEditableContent(contentKey, fallback) {
  const [content, setContent] = useState(fallback)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const fetchContent = async () => {
      try {
        const snap = await getDoc(doc(db, CONTENT_COLL, contentKey))
        if (!cancelled && snap.exists()) {
          const data = snap.data()
          setContent(data.current ?? fallback)
          setHistory(data.history ?? [])
        }
      } catch (e) {
        console.warn(`[EditableContent] Could not fetch "${contentKey}", using fallback.`, e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchContent()
    return () => { cancelled = true }
  }, [contentKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const saveContent = async (newText, editor = 'editor') => {
    const ref  = doc(db, CONTENT_COLL, contentKey)
    const snap = await getDoc(ref)

    // Seed history with the original fallback on first-ever edit
    const prevHistory = snap.exists()
      ? (snap.data().history ?? [])
      : [{ version: 0, text: fallback, timestamp: new Date().toISOString(), editor: 'original' }]

    const newEntry = {
      version:   prevHistory.length,
      text:      newText,
      timestamp: new Date().toISOString(),
      editor,
    }

    const updatedHistory = [...prevHistory, newEntry]

    await setDoc(ref, {
      current:   newText,
      updatedAt: serverTimestamp(),
      history:   updatedHistory,
    })

    setContent(newText)
    setHistory(updatedHistory)
  }

  return { content, history, loading, saveContent }
}
