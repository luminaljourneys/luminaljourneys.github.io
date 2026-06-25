/**
 * StagingBanner.jsx — Luminal Journeys
 * Sticky top bar visible only in staging build + authenticated edit session.
 *
 * Features:
 *   - Staging environment label
 *   - Last saved by [user] at [time, tz] — reads site_config/meta via onSnapshot
 *   - Notes panel toggle (speech bubble icon)
 *   - User avatar / name chip + sign out
 *   - Publish Live button
 */

import { useState, useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useEditMode } from '../context/EditModeContext.jsx'
import { usePublish } from '../hooks/usePublish.js'
import { IS_STAGING, SITE_CONFIG_COLL, SITE_META_DOC } from '../lib/collections'
import { navigate } from '../App.jsx'
import NotePanel from './NotePanel.jsx'

const EDIT_ENABLED = import.meta.env.VITE_EDIT_MODE_ENABLED !== 'false'

export default function StagingBanner() {
  const { isEditMode, currentUser, lock, signOutFully } = useEditMode()
  const { publish, publishing, lastPublished, error } = usePublish()
  const [showConfirm,  setShowConfirm]  = useState(false)
  const [showSuccess,  setShowSuccess]  = useState(false)
  const [showNotes,    setShowNotes]    = useState(false)
  const [saveMeta,     setSaveMeta]     = useState(null) // { lastSavedAt (Timestamp), lastSavedBy }

  // ── All hooks must be called before any early return ─────────────────────
  // Listen to last-saved metadata (only does real work when visible)
  useEffect(() => {
    if (!EDIT_ENABLED || !isEditMode || !IS_STAGING) return
    const unsub = onSnapshot(
      doc(db, SITE_CONFIG_COLL, SITE_META_DOC),
      (snap) => { if (snap.exists()) setSaveMeta(snap.data()) },
      () => {},
    )
    return unsub
  }, [isEditMode])

  // Push the fixed nav down when the banner is visible via a CSS variable
  useEffect(() => {
    const root = document.documentElement
    if (EDIT_ENABLED && isEditMode && IS_STAGING) {
      root.style.setProperty('--banner-height', '40px')
    } else {
      root.style.removeProperty('--banner-height')
    }
    return () => root.style.removeProperty('--banner-height')
  }, [isEditMode])

  // Only visible in staging build + authenticated edit session
  if (!EDIT_ENABLED || !isEditMode || !IS_STAGING) return null

  const handlePublish = async () => {
    setShowConfirm(false)
    await publish()
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 5000)
  }

  const fmtSaveTime = (ts) => {
    if (!ts) return null
    try {
      const d = ts.toDate ? ts.toDate() : new Date(ts)
      return d.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit',
        timeZoneName: 'short',
      })
    } catch { return null }
  }

  const fmtPublishTime = (iso) => {
    if (!iso) return null
    try {
      return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    } catch { return null }
  }

  return (
    <>
      {/* ── Confirm publish dialog ────────────────────────────────────────── */}
      {showConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(17,30,28,0.6)', backdropFilter: 'blur(4px)',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          <div style={{
            background: '#F9F8F6', borderRadius: '1rem',
            padding: '2.2rem 2.5rem', maxWidth: 420, width: '90%',
            boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
            border: '1px solid rgba(23,47,45,0.15)',
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem', fontFamily: "'DM Serif Display', Georgia, serif", color: '#172f2d' }}>
              Publish to production?
            </div>
            <p style={{ fontSize: '0.9rem', color: '#3a5450', lineHeight: 1.6, marginBottom: '1.6rem' }}>
              This will copy all staging content — text edits, form config, and pages — live to <strong>luminaljourneys.com</strong> immediately. There is no undo.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowConfirm(false)} style={{
                background: 'none', border: '1.5px solid rgba(23,47,45,0.2)',
                color: '#89a99e', padding: '0.6rem 1.4rem', borderRadius: '2rem',
                cursor: 'pointer', fontSize: '0.88rem',
              }}>Cancel</button>
              <button onClick={handlePublish} style={{
                background: '#bf8a3e', color: '#fff', border: 'none',
                padding: '0.6rem 1.8rem', borderRadius: '2rem',
                cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600,
              }}>Yes, Publish Live ✦</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Notes panel ───────────────────────────────────────────────────── */}
      {showNotes && <NotePanel onClose={() => setShowNotes(false)} />}

      {/* ── Banner bar ────────────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 9000, width: '100%',
        background: '#172f2d',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.55rem clamp(1rem, 3vw, 2rem)',
        fontFamily: "'DM Sans', sans-serif",
        gap: '1rem',
      }}>

        {/* ── Left: env label + last saved ─────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
          <span style={{
            background: '#bf8a3e', color: '#fff',
            fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase',
            padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontWeight: 700,
            flexShrink: 0,
          }}>Admin</span>

          {saveMeta?.lastSavedBy ? (
            <span style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Saved by{' '}
              <span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>
                {saveMeta.lastSavedBy.displayName}
              </span>
              {fmtSaveTime(saveMeta.lastSavedAt) && (
                <> at <span style={{ color: 'rgba(255,255,255,0.6)' }}>{fmtSaveTime(saveMeta.lastSavedAt)}</span></>
              )}
            </span>
          ) : (
            <span style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.35)' }}>
              No saves yet this session
            </span>
          )}
        </div>

        {/* ── Right: notes + user + publish ─────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>

          {/* Notes button */}
          <button
            onClick={() => setShowNotes(v => !v)}
            title="Team notes"
            style={{
              background: showNotes ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: showNotes ? '#fff' : 'rgba(255,255,255,0.6)',
              width: 30, height: 30, borderRadius: '50%',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.85rem', transition: 'all 0.15s',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
              <path d="M14 1H2a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h3l2 3 2-3h5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1Z" />
            </svg>
          </button>

          {/* User chip */}
          {currentUser && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName}
                  style={{ width: 24, height: 24, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.2)' }}
                />
              ) : (
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: '#bf8a3e', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.65rem', fontWeight: 700,
                }}>
                  {currentUser.displayName[0].toUpperCase()}
                </div>
              )}
              <span data-testid="user-chip-name" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.65)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser.displayName}
              </span>
              <button
                onClick={async () => { await signOutFully(); navigate('/') }}
                title="Sign out"
                style={{
                  background: 'none', border: 'none',
                  color: 'rgba(255,255,255,0.35)', cursor: 'pointer',
                  fontSize: '0.7rem', padding: '0 0.2rem',
                  transition: 'color 0.15s',
                }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Divider */}
          <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.12)', flexShrink: 0 }} />

          {/* Publish status */}
          {showSuccess && (
            <span style={{ fontSize: '0.73rem', color: '#74c9a0' }}>
              ✓ Published {fmtPublishTime(lastPublished) ? `at ${fmtPublishTime(lastPublished)}` : ''}
            </span>
          )}
          {error && (
            <span style={{ fontSize: '0.73rem', color: '#E07A5F' }}>{error}</span>
          )}

          {/* Publish button */}
          <button
            onClick={() => !publishing && setShowConfirm(true)}
            disabled={publishing}
            style={{
              background: publishing ? 'rgba(191,138,62,0.5)' : '#bf8a3e',
              color: '#fff', border: 'none',
              padding: '0.42rem 1.2rem', borderRadius: '2rem',
              cursor: publishing ? 'wait' : 'pointer',
              fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.03em',
              transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}
          >
            {publishing ? 'Publishing…' : 'Publish Live ✦'}
          </button>
        </div>
      </div>
    </>
  )
}
