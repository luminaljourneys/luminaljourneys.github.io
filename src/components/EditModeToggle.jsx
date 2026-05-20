/**
 * EditModeToggle.jsx — Luminal Journeys
 *
 * Floating bottom-left toolbar. Single entry point for ALL admin functions:
 *   • Not logged in → shows "Edit Site" button → triggers login modal
 *   • Logged in     → expands to show: Form Builder | Pages | Publish | Exit
 *
 * The login modal is owned by EditModeContext (rendered at the provider level).
 * This component only owns the floating toolbar UI.
 *
 * Feature flag: VITE_EDIT_MODE_ENABLED=false hides entirely in prod.
 */

import { useState } from 'react'
import { useEditMode } from '../context/EditModeContext'
import { navigate } from '../App.jsx'
import PencilIcon from './PencilIcon'

const EDIT_MODE_ENABLED = import.meta.env.VITE_EDIT_MODE_ENABLED !== 'false'

export default function EditModeToggle() {
  if (!EDIT_MODE_ENABLED) return null
  return <EditModeToggleInner />
}

function EditModeToggleInner() {
  const { isEditMode, currentUser, requestAuth, lock, signOutFully } = useEditMode()

  // Session is alive but not in edit mode — show a subtle "Resume" button
  const hasSession = !isEditMode && !!currentUser

  return (
    <div style={{
      position: 'fixed', bottom: '1.5rem', left: '1.5rem',
      zIndex: 80, display: 'flex', flexDirection: 'column', gap: '0.5rem',
      alignItems: 'flex-start',
    }}>
      {isEditMode ? (
        // ── In edit mode: show full toolbar ───────────────────────────────
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '0.4rem',
          background: '#172f2d', borderRadius: '1rem',
          padding: '0.75rem', boxShadow: '0 8px 32px rgba(23,47,45,0.25)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <ToolbarBtn icon="✎" label="Form Builder" onClick={() => navigate('/admin?tab=form')} />
          <ToolbarBtn icon="☰" label="Pages"        onClick={() => navigate('/admin?tab=pages')} />
          <ToolbarBtn icon="⬆" label="Publish"      onClick={() => navigate('/admin?tab=publish')} />
          <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '0.2rem 0' }} />
          {/* Exit Edit Mode — keeps session alive for quick re-entry */}
          <ToolbarBtn icon="↙" label="Exit Edit Mode" onClick={lock} muted />
          {/* Sign Out — ends session fully */}
          <ToolbarBtn icon="⏻" label="Sign Out" onClick={signOutFully} muted />
        </div>
      ) : hasSession ? (
        // ── Session alive but viewing — show Resume + Sign Out ────────────
        <div style={{
          display: 'flex', gap: '0.4rem', alignItems: 'center',
        }}>
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

function ToolbarBtn({ icon, label, onClick, muted = false }) {
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
      }}
    >
      <span style={{ fontSize: '0.85rem', width: 16, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
      {label}
    </button>
  )
}
