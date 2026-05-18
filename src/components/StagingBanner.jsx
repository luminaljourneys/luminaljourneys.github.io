/**
 * StagingBanner.jsx — Luminal Journeys
 * Sticky top bar visible only when:
 *   - VITE_EDIT_MODE_ENABLED !== 'false'  (i.e. staging build)
 *   - AND the user has an active edit session
 *
 * Shows environment label + Publish button.
 * On publish, batch-copies staging Firestore → production Firestore.
 */

import { useState } from 'react'
import { useEditMode } from '../context/EditModeContext.jsx'
import { usePublish } from '../hooks/usePublish.js'
import { IS_STAGING } from '../lib/collections'

const EDIT_ENABLED = import.meta.env.VITE_EDIT_MODE_ENABLED !== 'false'

export default function StagingBanner() {
  const { isEditMode } = useEditMode()
  const { publish, publishing, lastPublished, error } = usePublish()
  const [showConfirm, setShowConfirm] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Only visible in staging build + authenticated edit session
  if (!EDIT_ENABLED || !isEditMode || !IS_STAGING) return null

  const handlePublish = async () => {
    setShowConfirm(false)
    await publish()
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 4000)
  }

  const fmtTime = (iso) => {
    if (!iso) return null
    try {
      return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    } catch { return null }
  }

  return (
    <>
      {/* ── Confirm dialog ────────────────────────────────────────────────── */}
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

      {/* ── Banner bar ───────────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 9000, width: '100%',
        background: '#172f2d',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.6rem clamp(1rem, 3vw, 2rem)',
        fontFamily: "'DM Sans', sans-serif",
        gap: '1rem',
      }}>
        {/* Left — env label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{
            background: '#bf8a3e', color: '#fff',
            fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase',
            padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontWeight: 700,
          }}>Staging</span>
          <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>
            You're editing the staging site. Changes here won't appear on production until you publish.
          </span>
        </div>

        {/* Right — status + publish button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          {showSuccess && (
            <span style={{ fontSize: '0.78rem', color: '#74c9a0' }}>
              ✓ Published {fmtTime(lastPublished) ? `at ${fmtTime(lastPublished)}` : ''}
            </span>
          )}
          {error && (
            <span style={{ fontSize: '0.78rem', color: '#E07A5F' }}>{error}</span>
          )}
          <button
            onClick={() => !publishing && setShowConfirm(true)}
            disabled={publishing}
            style={{
              background: publishing ? 'rgba(191,138,62,0.5)' : '#bf8a3e',
              color: '#fff', border: 'none',
              padding: '0.45rem 1.3rem', borderRadius: '2rem',
              cursor: publishing ? 'wait' : 'pointer',
              fontSize: '0.82rem', fontWeight: 600, letterSpacing: '0.03em',
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
