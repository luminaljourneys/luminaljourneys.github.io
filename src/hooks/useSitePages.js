/**
 * useSitePages.js — Luminal Journeys
 * Reads and writes dynamic pages from Firestore.
 * Collection: pages_staging / pages_production (env-aware via collections.js)
 *
 * Page data shape:
 *   {
 *     id:          string   — slug used in URL, e.g. "services"
 *     title:       string   — displayed in nav / page <h1>
 *     heading:     string   — hero heading (editable via EditableContent)
 *     subheading:  string   — hero subheading
 *     body:        string   — main body copy (supports line breaks)
 *     showInNav:   boolean  — whether to show page in site nav
 *     order:       number   — nav sort order
 *     createdAt:   string   — ISO timestamp
 *     updatedAt:   Firestore ServerTimestamp
 *   }
 */

import { useState, useEffect } from 'react'
import {
  collection, getDocs, doc, setDoc, deleteDoc, serverTimestamp, query, orderBy
} from 'firebase/firestore'
import { db } from '../firebase'
import { PAGES_COLL } from '../lib/collections'
import { useEditMode } from '../context/EditModeContext'

export const DEFAULT_PAGES = []  // No built-in pages — LandingPage, IntakePage, AdminPage are code routes

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useSitePages() {
  const [pages,   setPages]   = useState([])
  const [loading, setLoading] = useState(true)
  const { recordSave } = useEditMode()

  useEffect(() => {
    let cancelled = false
    const fetch = async () => {
      try {
        const q    = query(collection(db, PAGES_COLL), orderBy('order', 'asc'))
        const snap = await getDocs(q)
        if (!cancelled) {
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
          setPages(docs)
        }
      } catch (e) {
        console.warn('[useSitePages] Could not load pages.', e)
        if (!cancelled) setPages([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetch()
    return () => { cancelled = true }
  }, [])

  // ── Add a new page ────────────────────────────────────────────────────────
  const addPage = async ({ title, heading = '', subheading = '', body = '', showInNav = true }) => {
    // Derive slug from title: lowercase, hyphens, strip special chars
    const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    // Ensure unique slug
    const existing = pages.map(p => p.id)
    let slug = baseSlug
    let n = 2
    while (existing.includes(slug)) { slug = `${baseSlug}-${n++}` }

    const maxOrder = pages.length ? Math.max(...pages.map(p => p.order ?? 0)) : 0
    const page = {
      title,
      heading:    heading  || title,
      subheading: subheading,
      body:       body,
      showInNav,
      order:      maxOrder + 1,
      createdAt:  new Date().toISOString(),
      updatedAt:  serverTimestamp(),
    }

    await setDoc(doc(db, PAGES_COLL, slug), page)
    const newPage = { id: slug, ...page }
    setPages(prev => [...prev, newPage])
    recordSave()
    return newPage
  }

  // ── Update a page ─────────────────────────────────────────────────────────
  const updatePage = async (pageId, changes) => {
    const ref = doc(db, PAGES_COLL, pageId)
    const updated = { ...changes, updatedAt: serverTimestamp() }
    await setDoc(ref, updated, { merge: true })
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, ...updated } : p))
    recordSave()
  }

  // ── Delete a page ─────────────────────────────────────────────────────────
  const deletePage = async (pageId) => {
    await deleteDoc(doc(db, PAGES_COLL, pageId))
    setPages(prev => prev.filter(p => p.id !== pageId))
    recordSave()
  }

  // ── Reorder ───────────────────────────────────────────────────────────────
  const reorderPage = async (pageId, direction) => {
    const sorted  = [...pages].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    const idx     = sorted.findIndex(p => p.id === pageId)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return
    const a = sorted[idx]
    const b = sorted[swapIdx]
    // Swap orders in Firestore
    await setDoc(doc(db, PAGES_COLL, a.id), { order: b.order, updatedAt: serverTimestamp() }, { merge: true })
    await setDoc(doc(db, PAGES_COLL, b.id), { order: a.order, updatedAt: serverTimestamp() }, { merge: true })
    setPages(prev => prev.map(p => {
      if (p.id === a.id) return { ...p, order: b.order }
      if (p.id === b.id) return { ...p, order: a.order }
      return p
    }))
    recordSave()
  }

  return { pages, loading, addPage, updatePage, deletePage, reorderPage }
}
