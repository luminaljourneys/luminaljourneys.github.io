/**
 * EditModeToggle.jsx — Luminal Journeys
 *
 * Floating bottom-left toolbar. Single entry point for ALL admin functions:
 *   • Not logged in  → shows "Edit Site" button → triggers login modal
 *   • Logged in      → shows collapsible menu:
 *                        Intakes (with unread badge) | Form Builder | Pages | Publish | ← View Site
 *                        ── Exit Edit Mode | Sign Out
 *                        Minimize → collapses back to "Edit Site" button
 *
 * Feature flag: VITE_EDIT_MODE_ENABLED=false hides entirely in prod.
 */

import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useEditMode } from '../context/EditModeContext'
import { navigate } from '../App.jsx'
import PencilIcon from './PencilIcon'
import { IS_STAGING } from '../lib/collections'

// Double-gated: both the env flag AND the IS_STAGING check must pass.
const EDIT_MODE_ENABLED = import.meta.env.VITE_EDIT_MODE_ENABLED !== 'false' && IS_STAGING

// ── Intake count hook ──────────────────────────────────────────────────────────
function useIntakeCount() {
  const [count, setCount] = useState(null)
  useEffect(() => {
    // Always count production submissions (same as the admin Intakes tab)
    const q = query(
      collection(db, 'intake_submissions'),
      where('env', '==', 'production'),
    )
    const unsub = onSnapshot(q, snap => setCount(snap.size), () => setCount(null))
    return unsub
  }, [])
  return count
}

export default function EditModeToggle() {
  if (!EDIT_MODE_ENABLED) return null
  return <EditModeToggleInner />
}

function EditModeToggleInner() {
  const { isEditMode, currentUser, hasFirebaseAuth, requestAuth, lock, signOutFully } = useEditMode()
  const intakeCount = useIntakeCount()

  // Minimized state — collapses expanded menu back to "Edit Site" pill
  const [minimized, setMinimized] = useState(false)

  // Only Firebase Auth sessions (Google / magic link) get the Resume button.
  const hasSession = !isEditMode && !!currentUser && hasFirebaseAuth

  // When entering edit mode, always start expanded
  useEffect(() => {
    if (isEditMode) setMinimized(false)
  }, [isEditMode])

  return (
    <div style={{
      position: 'fixed', bottom: '1.5rem', left: '1.5rem',
      zIndex: 80, display: 'flex', flexDirection: 'column', gap: '0.5rem',
      alignItems: 'flex-start',
    }}>
      {isEditMode ? (
        minimized ? (
          // ── Minimized: just "Edit Site" pill ────────────────────────────
          <button
            onClick={() => setMinimized(false)}
            title="Open admin menu"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: '#172f2d', color: '#F9F8F6',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '2rem', padding: '0.55rem 1.1rem',
              cursor: 'pointer', fontSize: '0.8rem',
              fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
              letterSpacing: '0.02em',
              boxShadow: '0 4px 16px rgba(23,47,45,0.2)',
              transition: 'all 0.15s',
            }}
          >
            <PencilIcon size={13} />
            Edit Site
          </button>
        ) : (
          // ── Expanded: full toolbar ───────────────────────────────────────
          <div style={{
            display: 'flex', flexDirection: 'column', gap: '0.4rem',
            background: '#172f2d', borderRadius: '1rem',
            padding: '0.75rem', boxShadow: '0 8px 32px rgba(23,47,45,0.25)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            {/* Minimize button — top right of panel */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.1rem' }}>
              <button
                onClick={() => setMinimized(true)}
                title="Minimize"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem',
                  padding: '0 0.2rem', lineHeight: 1,
                  fontFamily: "'DM Sans', sans-serif",
                  transition: 'color 0.12s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
              >
                ✕ minimize
              </button>
            </div>

            {/* Intakes — with live count badge → admin dashboard */}
            <ToolbarBtn
              icon="📥"
              label="Intakes"
              onClick={() => navigate('/admin?tab=intakes')}
              badge={intakeCount}
            />
            {/* Form Builder → live intake form for in-place editing */}
            <ToolbarBtn icon="✎" label="Form Builder" onClick={() => navigate('/intake')} />
            {/* Pages / Publish → admin dashboard tabs */}
            <ToolbarBtn icon="☰" label="Pages"        onClick={() => navigate('/admin?tab=pages')} />
            <ToolbarBtn icon="⬆" label="Publish"      onClick={() => navigate('/admin?tab=publish')} />
            <ToolbarBtn icon="⌂" label="← View Site"  onClick={() => navigate('/')} />

            <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '0.2rem 0' }} />

            {/* Exit Edit Mode — collapses toolbar to minimized "Edit Site" pill */}
            <ToolbarBtn
              icon="↙"
              label="Exit Edit Mode"
              onClick={() => { lock(); setMinimized(true) }}
              muted
            />
            {/* Sign Out — ends session fully */}
            <ToolbarBtn
              icon="⏻"
              label="Sign Out"
              onClick={async () => { await signOutFully(); navigate('/') }}
              muted
            />
          </div>
        )
      ) : hasSession ? (
        // ── Session alive but viewing — show Resume + Sign Out ────────────
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <button
            onClick={() => requestAuth()}
            title="Resume editing"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: '#172f2d', color: '#F9F8F6',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '2rem', padding: '0.55rem 1.1rem',
              cursor: 'pointer', fontSize: '0.8rem',
              fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
              letterSpacing: '0.02em',
              boxShadow: '0 4px 16px rgba(23,47,45,0.2)',
            }}
          >
            <PencilIcon size={13} />
            Resume Editing
          </button>
          <button
            onClick={signOutFully}
            title="Sign out"
            style={{
              background: 'rgba(23,47,45,0.08)', border: '1px solid rgba(23,47,45,0.15)',
              borderRadius: '2rem', padding: '0.55rem 0.8rem',
              cursor: 'pointer', fontSize: '0.75rem', color: '#5a7a76',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Sign out
          </button>
        </div>
      ) : (
        // ── No session: show Edit Site button ─────────────────────────────
        <button
          onClick={() => requestAuth()}
          title="Edit site content"
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: '#172f2d', color: '#F9F8F6',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '2rem', padding: '0.55rem 1.1rem',
            cursor: 'pointer', fontSize: '0.8rem',
            fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
            letterSpacing: '0.02em',
            boxShadow: '0 4px 16px rgba(23,47,45,0.2)',
            transition: 'all 0.15s',
          }}
        >
          <PencilIcon size={13} />
          Edit Site
        </button>
      )}
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ToolbarBtn({ icon, label, onClick, muted = false, badge = null }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        background: hovered ? 'rgba(255,255,255,0.12)' : 'transparent',
        border: 'none', borderRadius: '0.5rem',
        color: muted ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.85)',
        padding: '0.45rem 0.65rem', cursor: 'pointer',
        fontSize: '0.8rem', fontFamily: "'DM Sans', sans-serif",
        fontWeight: 500, letterSpacing: '0.01em',
        whiteSpace: 'nowrap', transition: 'all 0.12s',
        width: '100%', textAlign: 'left',
        position: 'relative',
      }}
    >
      <span style={{ fontSize: '0.85rem', width: 16, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
      {label}
      {badge !== null && (
        <span style={{
          marginLeft: 'auto',
          background: '#bf8a3e', color: '#fff',
          fontSize: '0.6rem', fontWeight: 700,
          borderRadius: '2rem', padding: '0.1rem 0.45rem',
          minWidth: 18, textAlign: 'center',
          lineHeight: '1.4',
        }}>
          {badge}
        </span>
      )}
    </button>
  )
}
