/**
 * EditPanel.jsx — Luminal Journeys
 * Bottom-sheet drawer: shows original vs. rewrite with version history.
 * Saves to Firestore on submit and shows a toast confirmation.
 */

import { useState, useEffect, useRef } from 'react'

function formatTimestamp(iso) {
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export default function EditPanel({ contentKey, currentText, history, onSave, onClose }) {
  const [rewrite,     setRewrite]     = useState(currentText)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const textareaRef = useRef(null)

  useEffect(() => {
    textareaRef.current?.focus()
    textareaRef.current?.select()
  }, [])

  const isDirty = rewrite !== currentText

  const handleSubmit = async () => {
    if (!isDirty) { setError('No changes detected.'); return }
    setSaving(true)
    setError('')
    try {
      await onSave(rewrite, 'editor')
      // Show toast then close
      const toast = document.createElement('div')
      toast.className = 'ep-toast'
      toast.textContent = '✓ Saved'
      document.body.appendChild(toast)
      setTimeout(() => toast.classList.add('ep-toast--visible'), 10)
      setTimeout(() => {
        toast.classList.remove('ep-toast--visible')
        setTimeout(() => document.body.removeChild(toast), 300)
      }, 2200)
      onClose()
    } catch (err) {
      console.error('[EditPanel] Save failed:', err?.code, err?.message, err)
      const msg = err?.code === 'permission-denied'
        ? 'Permission denied. Make sure you are signed in with an authorized Google or email-link account (not password login).'
        : `Save failed: ${err?.message ?? 'Check your connection and try again.'}`
      setError(msg)
      setSaving(false)
    }
  }

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="ep-overlay" onClick={handleBackdrop}>
      <div className="ep-drawer">

        {/* Header */}
        <div className="ep-header">
          <div className="ep-header__info">
            <span className="ep-header__badge">Content Editor</span>
            <code className="ep-header__key">{contentKey}</code>
          </div>
          <button className="ep-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Original / Rewrite */}
        <div className="ep-body">
          <div className="ep-half ep-half--original">
            <p className="ep-label">
              <span className="ep-label__dot ep-label__dot--original" />
              Original
            </p>
            <div className="ep-text">{currentText}</div>
          </div>
          <div className="ep-half ep-half--rewrite">
            <p className="ep-label">
              <span className="ep-label__dot ep-label__dot--rewrite" />
              Rewrite
            </p>
            <textarea
              ref={textareaRef}
              className="ep-textarea"
              value={rewrite}
              onChange={e => { setRewrite(e.target.value); setError('') }}
              rows={4}
              placeholder="Type the updated text here…"
            />
          </div>
        </div>

        {error && <p className="ep-error">{error}</p>}

        {/* Actions */}
        <div className="ep-actions">
          <button className="ep-btn ep-btn--cancel" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="ep-btn ep-btn--submit" onClick={handleSubmit} disabled={saving || !isDirty}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>

        {/* Version History */}
        {history.length > 0 && (
          <div className="ep-history">
            <button className="ep-history__toggle" onClick={() => setShowHistory(v => !v)}>
              {showHistory ? '▲' : '▼'}&nbsp; Version History
              <span className="ep-history__count">{history.length}</span>
            </button>
            {showHistory && (
              <div className="ep-history__list">
                {[...history].reverse().map((v, i) => (
                  <div key={i} className="ep-history__item">
                    <div className="ep-history__meta">
                      <span className="ep-history__version">v{v.version}</span>
                      <span className="ep-history__editor">{v.editor}</span>
                      <span className="ep-history__time">{formatTimestamp(v.timestamp)}</span>
                    </div>
                    <p className="ep-history__text">{v.text}</p>
                    <button className="ep-history__restore"
                      onClick={() => { setRewrite(v.text); setError('') }}
                      title="Restore this version">Restore</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
