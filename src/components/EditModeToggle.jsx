/**
 * EditModeToggle.jsx — Luminal Journeys
 *
 * Floating bottom-left toolbar. Single entry point for ALL admin functions:
 *   • Not logged in → shows "Edit Site" button → triggers login modal
 *   • Logged in     → expands to show: Exit | Form Builder | Pages | Publish
 *
 * The login modal lives here and is shared with AdminPage via EditModeContext.
 * Feature flag: VITE_EDIT_MODE_ENABLED=false hides entirely in prod.
 */

import { useState, useRef, useEffect } from 'react'
import { useEditMode } from '../context/EditModeContext'
import { navigate } from '../App.jsx'
import PencilIcon from './PencilIcon'

const EDIT_MODE_ENABLED = import.meta.env.VITE_EDIT_MODE_ENABLED !== 'false'

export default function EditModeToggle() {
  if (!EDIT_MODE_ENABLED) return null
  return <EditModeToggleInner />
}

function EditModeToggleInner() {
  const { isEditMode, showModal, requestAuth, unlock, lock, dismissModal } = useEditMode()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const usernameRef = useRef(null)

  // Focus username field when modal opens
  useEffect(() => {
    if (showModal) setTimeout(() => usernameRef.current?.focus(), 50)
  }, [showModal])

  const handleUnlock = () => {
    const success = unlock(username.trim(), password)
    if (success) {
      setUsername('')
      setPassword('')
      setError('')
    } else {
      setError('Incorrect username or password.')
      setPassword('')
    }
  }

  const handleClose = () => {
    dismissModal()
    setUsername('')
    setPassword('')
    setError('')
  }

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) handleClose()
  }

  return (
    <>
      {/* ── Floating toolbar ──────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: '1.5rem', left: '1.5rem',
        zIndex: 80, display: 'flex', flexDirection: 'column', gap: '0.5rem',
        alignItems: 'flex-start',
      }}>
        {isEditMode ? (
          // ── Authenticated: show full toolbar ─────────────────────────
          <div style={{
            display: 'flex', flexDirection: 'column', gap: '0.4rem',
            background: '#172f2d', borderRadius: '1rem',
            padding: '0.75rem', boxShadow: '0 8px 32px rgba(23,47,45,0.25)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <ToolbarBtn
              icon="✎"
              label="Form Builder"
              onClick={() => navigate('/admin?tab=form')}
            />
            <ToolbarBtn
              icon="☰"
              label="Pages"
              onClick={() => navigate('/admin?tab=pages')}
            />
            <ToolbarBtn
              icon="⬆"
              label="Publish"
              onClick={() => navigate('/admin?tab=publish')}
            />
            <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '0.2rem 0' }} />
            <ToolbarBtn
              icon="×"
              label="Exit Edit Mode"
              onClick={lock}
              muted
            />
          </div>
        ) : (
          // ── Not authenticated: show Edit Site button ──────────────────
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

      {/* ── Login modal ───────────────────────────────────────────────── */}
      {showModal && !isEditMode && (
        <div
          onClick={handleBackdrop}
          style={{
            position: 'fixed', inset: 0, zIndex: 999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(23,47,45,0.6)',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <div style={{
            background: '#F9F8F6', borderRadius: '1.2rem',
            padding: '2.8rem 2.5rem', width: '100%', maxWidth: 400,
            boxShadow: '0 24px 80px rgba(17,76,92,0.25)',
            border: '1px solid var(--color-border)',
            position: 'relative', margin: '1rem',
          }}>
            {/* Close */}
            <button
              onClick={handleClose}
              style={{ position: 'absolute', top: '1.2rem', right: '1.4rem', background: 'none', border: 'none', cursor: 'pointer', color: '#89a99e', fontSize: '1.4rem', lineHeight: 1 }}
            >×</button>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '1.6rem', color: '#172f2d', marginBottom: '0.3rem' }}>
                Luminal Journeys
              </div>
              <div style={{ fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#89a99e', fontFamily: 'var(--font-mono)' }}>
                Admin Sign In
              </div>
            </div>

            {/* Username */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#3a5450', marginBottom: '0.4rem', fontFamily: 'var(--font-mono)' }}>
                Username
              </label>
              <input
                ref={usernameRef}
                type="text"
                value={username}
                placeholder="Admin username"
                onChange={e => { setUsername(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleUnlock()}
                autoComplete="username"
                style={inputStyle(!!error)}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#3a5450', marginBottom: '0.4rem', fontFamily: 'var(--font-mono)' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                placeholder="Enter password"
                onChange={e => { setPassword(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleUnlock()}
                autoComplete="current-password"
                style={inputStyle(!!error)}
              />
            </div>

            {error && (
              <div style={{ fontSize: '0.82rem', color: '#E07A5F', marginBottom: '1rem', textAlign: 'center' }}>
                {error}
              </div>
            )}

            <button
              onClick={handleUnlock}
              disabled={!username.trim() || !password.trim()}
              style={{
                width: '100%', background: '#172f2d', color: '#fff',
                border: 'none', borderRadius: '0.6rem', padding: '0.85rem',
                fontSize: '0.9rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                opacity: (!username.trim() || !password.trim()) ? 0.5 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              Sign In
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.4rem' }}>
              <button
                onClick={handleClose}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: '#89a99e', fontFamily: 'var(--font-mono)' }}
              >
                ← Back to site
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

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

function inputStyle(hasError) {
  return {
    width: '100%', padding: '0.75rem 1rem', boxSizing: 'border-box',
    border: '1.5px solid ' + (hasError ? '#bf8a3e' : 'var(--color-border)'),
    borderRadius: '0.6rem', fontSize: '0.92rem', outline: 'none',
    background: '#e6ddd0', color: 'var(--color-text)',
    fontFamily: "'DM Sans', sans-serif",
  }
}
