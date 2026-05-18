/**
 * EditModeToggle.jsx — Luminal Journeys
 * Floating pencil button (bottom-left) that lets the client unlock
 * content editing with a password. Session stays alive for 30 days.
 *
 * Feature flag: set VITE_EDIT_MODE_ENABLED=false to hide entirely in prod
 * until the client is ready to use it.
 */

import { useState, useRef, useEffect } from 'react'
import { useEditMode } from '../context/EditModeContext'
import PencilIcon from './PencilIcon'

const EDIT_MODE_ENABLED = import.meta.env.VITE_EDIT_MODE_ENABLED !== 'false'

export default function EditModeToggle() {
  if (!EDIT_MODE_ENABLED) return null
  return <EditModeToggleInner />
}

function EditModeToggleInner() {
  const { isEditMode, unlock, resumeSession, lock } = useEditMode()
  const [showPrompt, setShowPrompt] = useState(false)
  const [password,   setPassword]   = useState('')
  const [error,      setError]      = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (showPrompt) setTimeout(() => inputRef.current?.focus(), 50)
  }, [showPrompt])

  const handleUnlock = () => {
    const success = unlock(password)
    if (success) {
      setShowPrompt(false)
      setPassword('')
      setError('')
    } else {
      setError('Incorrect password.')
      setPassword('')
      inputRef.current?.focus()
    }
  }

  const handleClose = () => { setShowPrompt(false); setPassword(''); setError('') }
  const handleBackdrop = (e) => { if (e.target === e.currentTarget) handleClose() }

  return (
    <>
      {/* ── Floating toggle ─────────────────────────────────────── */}
      <div className="em-toggle">
        {isEditMode ? (
          <button className="em-toggle__btn em-toggle__btn--active" onClick={lock} title="Exit edit mode">
            <span className="em-toggle__icon"><PencilIcon size={14} /></span>
            <span className="em-toggle__label">Exit Edit Mode</span>
          </button>
        ) : (
          <button className="em-toggle__btn" title="Edit site content"
            onClick={() => { if (!resumeSession()) setShowPrompt(true) }}>
            <span className="em-toggle__icon"><PencilIcon size={14} /></span>
            <span className="em-toggle__label">Edit Content</span>
          </button>
        )}
      </div>

      {/* ── Password modal ──────────────────────────────────────── */}
      {showPrompt && !isEditMode && (
        <div className="em-overlay" onClick={handleBackdrop}>
          <div className="em-modal">
            <div className="em-modal__icon"><PencilIcon size={28} /></div>
            <h3 className="em-modal__title">Edit Content</h3>
            <p className="em-modal__sub">
              Enter your password to unlock content editing.<br />
              Your session stays active for 30 days.
            </p>
            <input
              ref={inputRef}
              className={`em-modal__input${error ? ' em-modal__input--error' : ''}`}
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              onKeyDown={e => { if (e.key === 'Enter') handleUnlock() }}
              autoComplete="current-password"
            />
            {error && <p className="em-modal__error">{error}</p>}
            <div className="em-modal__actions">
              <button className="em-modal__cancel" onClick={handleClose}>Cancel</button>
              <button className="em-modal__submit" onClick={handleUnlock} disabled={!password.trim()}>
                Unlock
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
