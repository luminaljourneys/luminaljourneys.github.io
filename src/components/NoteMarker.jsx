/**
 * NoteMarker.jsx — Luminal Journeys
 * Small speech-bubble icon that appears next to any section in edit mode.
 * Click to open a popover with threaded notes for that section.
 * Author identity comes from currentUser in EditModeContext — no name picker.
 *
 * Usage:
 *   <NoteMarker sectionKey="hero-heading" />
 */

import { useState, useRef, useEffect } from 'react'
import { useEditMode } from '../context/EditModeContext.jsx'
import {
  useSectionNotes,
  usePageNotes,
  addNote,
  addReply,
  resolveNote,
} from '../hooks/useNotes.js'

const AVATAR_COLORS = ['#4A7C59', '#bf8a3e', '#4A6C8C', '#8C4A6C', '#6C4A8C']
function avatarColor(str = '') {
  let h = 0
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

function AuthorChip({ author, size = 20 }) {
  if (author.photoURL) {
    return (
      <img
        src={author.photoURL}
        alt={author.displayName}
        style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0 }}
      />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: avatarColor(author.email),
      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.44, fontWeight: 700,
    }}>
      {author.displayName?.[0]?.toUpperCase() ?? '?'}
    </div>
  )
}

function fmtTime(ts) {
  if (!ts) return ''
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      + ' · ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

export default function NoteMarker({ sectionKey }) {
  const { isEditMode, currentUser } = useEditMode()
  const { pageId }   = usePageNotes()
  const notes        = useSectionNotes(sectionKey)
  const count        = notes.length

  const [open,      setOpen]      = useState(false)
  const [draft,     setDraft]     = useState('')
  const [replyTo,   setReplyTo]   = useState(null) // noteId | null
  const [replyText, setReplyText] = useState('')
  const [saving,    setSaving]    = useState(false)

  const popoverRef  = useRef(null)
  const textareaRef = useRef(null)
  const bottomRef   = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    if (open) setTimeout(() => textareaRef.current?.focus(), 60)
  }, [open])

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [notes.length, open])

  if (!isEditMode) return null

  const handlePost = async () => {
    if (!draft.trim() || !currentUser) return
    setSaving(true)
    try {
      await addNote(sectionKey, pageId, draft, currentUser)
      setDraft('')
    } finally { setSaving(false) }
  }

  const handleReply = async (note) => {
    if (!replyText.trim() || !currentUser) return
    setSaving(true)
    try {
      await addReply(note.id, note.replies, replyText, currentUser)
      setReplyText('')
      setReplyTo(null)
    } finally { setSaving(false) }
  }

  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
      {/* Bubble trigger */}
      <button
        onClick={() => setOpen(v => !v)}
        title={count > 0 ? `${count} note${count !== 1 ? 's' : ''}` : 'Add note'}
        style={{
          background: count > 0 ? 'rgba(23,47,45,0.1)' : 'transparent',
          border: '1px solid rgba(23,47,45,0.18)',
          color: count > 0 ? '#172f2d' : '#89a99e',
          width: 22, height: 22, borderRadius: '50%',
          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', flexShrink: 0, transition: 'all 0.15s',
          marginLeft: '0.35rem',
        }}
      >
        <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
          <path d="M14 1H2a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h3l2 3 2-3h5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1Z" />
        </svg>
        {count > 0 && (
          <span style={{
            position: 'absolute', top: -5, right: -5,
            background: '#bf8a3e', color: '#fff',
            width: 14, height: 14, borderRadius: '50%',
            fontSize: '0.55rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{count}</span>
        )}
      </button>

      {/* Popover */}
      {open && (
        <div
          ref={popoverRef}
          style={{
            position: 'absolute', top: '110%', left: 0, zIndex: 8000,
            width: 300, maxHeight: 420,
            background: '#F9F8F6', borderRadius: '0.85rem',
            boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
            border: '1px solid rgba(23,47,45,0.12)',
            display: 'flex', flexDirection: 'column',
            fontFamily: "'DM Sans', sans-serif",
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '0.7rem 0.85rem 0.5rem',
            borderBottom: '1px solid rgba(23,47,45,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#89a99e', fontFamily: 'var(--font-mono)' }}>
              Notes · {sectionKey}
            </span>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#89a99e', cursor: 'pointer', fontSize: '0.85rem' }}>✕</button>
          </div>

          {/* Body */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '0.6rem 0.85rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Thread */}
            {notes.map(note => (
              <div key={note.id} style={{ borderBottom: '1px solid rgba(23,47,45,0.06)', paddingBottom: '0.6rem' }}>
                {/* Root note */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <AuthorChip author={note.author} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.15rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#172f2d' }}>{note.author.displayName}</span>
                      <span style={{ fontSize: '0.65rem', color: '#89a99e' }}>{fmtTime(note.createdAt)}</span>
                      <button
                        onClick={() => resolveNote(note.id)}
                        title="Resolve"
                        style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#89a99e', cursor: 'pointer', fontSize: '0.65rem' }}
                      >✓ Resolve</button>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#3a5450', lineHeight: 1.5 }}>{note.text}</p>
                  </div>
                </div>

                {/* Replies */}
                {note.replies.length > 0 && (
                  <div style={{ marginLeft: '1.6rem', marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {note.replies.map(reply => (
                      <div key={reply.id} style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-start' }}>
                        <AuthorChip author={reply.author} size={16} />
                        <div>
                          <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#172f2d' }}>{reply.author.displayName}</span>
                            <span style={{ fontSize: '0.62rem', color: '#89a99e' }}>{fmtTime(reply.createdAt)}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.78rem', color: '#3a5450', lineHeight: 1.5 }}>{reply.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply toggle */}
                {replyTo === note.id ? (
                  <div style={{ marginLeft: '1.6rem', marginTop: '0.4rem' }}>
                    <textarea
                      rows={2}
                      placeholder="Reply…"
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleReply(note) }}
                      style={{ ...textareaStyle, fontSize: '0.78rem' }}
                      autoFocus
                    />
                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.3rem' }}>
                      <button onClick={() => { setReplyTo(null); setReplyText('') }} style={ghostBtnStyle}>Cancel</button>
                      <button onClick={() => handleReply(note)} disabled={!replyText.trim() || saving} style={primaryBtnStyle}>
                        {saving ? '…' : 'Reply'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setReplyTo(note.id)}
                    style={{ marginLeft: '1.6rem', marginTop: '0.3rem', background: 'none', border: 'none', color: '#89a99e', fontSize: '0.7rem', cursor: 'pointer', padding: 0 }}
                  >
                    ↩ Reply
                  </button>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Compose */}
          <div style={{ padding: '0.6rem 0.85rem', borderTop: '1px solid rgba(23,47,45,0.08)' }}>
            {currentUser ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                  <AuthorChip author={currentUser} size={18} />
                  <span style={{ fontSize: '0.73rem', color: '#89a99e' }}>Note as <strong style={{ color: '#172f2d' }}>{currentUser.displayName}</strong></span>
                </div>
                <textarea
                  ref={textareaRef}
                  rows={2}
                  placeholder="Add a note… (⌘↵ to post)"
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePost() }}
                  style={textareaStyle}
                />
                <button
                  onClick={handlePost}
                  disabled={!draft.trim() || saving}
                  style={{ ...primaryBtnStyle, width: '100%', marginTop: '0.4rem', padding: '0.45rem' }}
                >
                  {saving ? 'Posting…' : 'Post note'}
                </button>
              </>
            ) : (
              <p style={{ fontSize: '0.78rem', color: '#89a99e', textAlign: 'center', margin: 0 }}>
                Sign in with Google to leave notes.
              </p>
            )}
          </div>
        </div>
      )}
    </span>
  )
}

const textareaStyle = {
  width: '100%', boxSizing: 'border-box',
  padding: '0.5rem 0.65rem', border: '1.5px solid rgba(23,47,45,0.15)',
  borderRadius: '0.45rem', fontSize: '0.82rem', resize: 'none', outline: 'none',
  fontFamily: "'DM Sans', sans-serif", color: '#172f2d', background: '#fff',
  lineHeight: 1.5,
}
const primaryBtnStyle = {
  background: '#172f2d', color: '#fff', border: 'none',
  padding: '0.35rem 0.75rem', borderRadius: '2rem',
  cursor: 'pointer', fontSize: '0.73rem', fontWeight: 600,
  fontFamily: "'DM Sans', sans-serif",
}
const ghostBtnStyle = {
  background: 'none', color: '#89a99e',
  border: '1px solid rgba(23,47,45,0.15)',
  padding: '0.3rem 0.65rem', borderRadius: '2rem',
  cursor: 'pointer', fontSize: '0.72rem',
  fontFamily: "'DM Sans', sans-serif",
}
