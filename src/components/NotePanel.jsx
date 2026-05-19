/**
 * NotePanel.jsx — Luminal Journeys
 * Slide-in panel showing ALL notes across the current page.
 * Opened by the speech-bubble icon in StagingBanner.
 * Author identity from currentUser — no name picker.
 */

import { useState } from 'react'
import { useEditMode } from '../context/EditModeContext.jsx'
import { usePageNotes, addReply, resolveNote } from '../hooks/useNotes.js'

const AVATAR_COLORS = ['#4A7C59', '#bf8a3e', '#4A6C8C', '#8C4A6C', '#6C4A8C']
function avatarColor(str = '') {
  let h = 0
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

function AuthorChip({ author, size = 22 }) {
  if (author?.photoURL) {
    return <img src={author.photoURL} alt={author.displayName} style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0 }} />
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: avatarColor(author?.email ?? ''), color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.44, fontWeight: 700,
    }}>
      {author?.displayName?.[0]?.toUpperCase() ?? '?'}
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

function scrollToSection(sectionKey) {
  const el = document.querySelector(`[data-note-key="${sectionKey}"]`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.style.outline = '2px solid #bf8a3e'
    setTimeout(() => { el.style.outline = '' }, 1400)
  }
}

function NoteCard({ note, onClose, currentUser }) {
  const [replyText, setReplyText] = useState('')
  const [replying,  setReplying]  = useState(false)
  const [saving,    setSaving]    = useState(false)

  const handleReply = async () => {
    if (!replyText.trim() || !currentUser) return
    setSaving(true)
    try {
      await addReply(note.id, note.replies, replyText, currentUser)
      setReplyText('')
      setReplying(false)
    } finally { setSaving(false) }
  }

  return (
    <div style={{
      background: '#fff', borderRadius: '0.7rem',
      padding: '0.9rem 1rem', border: '1px solid rgba(23,47,45,0.1)',
      opacity: note.resolved ? 0.5 : 1,
    }}>
      {/* Section key */}
      <div style={{ fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#89a99e', fontFamily: 'var(--font-mono)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{note.sectionKey}</span>
        <button
          onClick={() => { scrollToSection(note.sectionKey); onClose() }}
          style={{ background: 'none', border: 'none', color: '#89a99e', cursor: 'pointer', fontSize: '0.7rem', padding: 0 }}
        >↗ Go to section</button>
      </div>

      {/* Root note */}
      <div style={{ display: 'flex', gap: '0.55rem', alignItems: 'flex-start' }}>
        <AuthorChip author={note.author} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.15rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#172f2d' }}>{note.author?.displayName}</span>
            <span style={{ fontSize: '0.65rem', color: '#89a99e' }}>{fmtTime(note.createdAt)}</span>
            {!note.resolved && (
              <button
                onClick={() => resolveNote(note.id)}
                style={{ marginLeft: 'auto', background: '#e6ddd0', border: 'none', color: '#4A7C59', cursor: 'pointer', fontSize: '0.65rem', borderRadius: '2rem', padding: '0.15rem 0.5rem', fontWeight: 600 }}
              >✓ Resolve</button>
            )}
          </div>
          <p style={{ margin: 0, fontSize: '0.83rem', color: '#3a5450', lineHeight: 1.55 }}>{note.text}</p>
        </div>
      </div>

      {/* Replies */}
      {note.replies.length > 0 && (
        <div style={{ marginLeft: '1.85rem', marginTop: '0.55rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          {note.replies.map(reply => (
            <div key={reply.id} style={{ display: 'flex', gap: '0.45rem' }}>
              <AuthorChip author={reply.author} size={18} />
              <div>
                <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.73rem', fontWeight: 600, color: '#172f2d' }}>{reply.author?.displayName}</span>
                  <span style={{ fontSize: '0.62rem', color: '#89a99e' }}>{fmtTime(reply.createdAt)}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#3a5450', lineHeight: 1.5 }}>{reply.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply */}
      {!note.resolved && (
        replying ? (
          <div style={{ marginLeft: '1.85rem', marginTop: '0.5rem' }}>
            <textarea
              rows={2}
              placeholder="Reply…"
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleReply() }}
              autoFocus
              style={{ ...taStyle, fontSize: '0.78rem' }}
            />
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.3rem' }}>
              <button onClick={() => { setReplying(false); setReplyText('') }} style={ghostBtn}>Cancel</button>
              <button onClick={handleReply} disabled={!replyText.trim() || saving} style={primBtn}>Reply</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setReplying(true)}
            style={{ marginLeft: '1.85rem', marginTop: '0.35rem', background: 'none', border: 'none', color: '#89a99e', fontSize: '0.7rem', cursor: 'pointer', padding: 0 }}
          >
            ↩ Reply
          </button>
        )
      )}
    </div>
  )
}

export default function NotePanel({ onClose }) {
  const { currentUser } = useEditMode()
  const { notes, loading } = usePageNotes()

  const open     = notes.filter(n => !n.resolved)
  const resolved = notes.filter(n => n.resolved)

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9500,
        display: 'flex', justifyContent: 'flex-end',
        background: 'rgba(17,30,28,0.25)',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div style={{
        width: 360, height: '100%', overflowY: 'auto',
        background: '#F9F8F6',
        boxShadow: '-12px 0 40px rgba(0,0,0,0.12)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.2rem 1.4rem',
          borderBottom: '1px solid rgba(23,47,45,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, background: '#F9F8F6', zIndex: 1,
        }}>
          <div>
            <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '1.15rem', color: '#172f2d' }}>Team Notes</div>
            {open.length > 0 && (
              <div style={{ fontSize: '0.72rem', color: '#89a99e', marginTop: '0.1rem' }}>{open.length} open · {resolved.length} resolved</div>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#89a99e', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: '1rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {loading ? (
            <p style={{ color: '#89a99e', fontSize: '0.83rem', textAlign: 'center', marginTop: '2rem' }}>Loading…</p>
          ) : open.length === 0 && resolved.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '3rem' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>💬</div>
              <p style={{ color: '#89a99e', fontSize: '0.85rem' }}>No notes yet.</p>
              <p style={{ color: '#89a99e', fontSize: '0.78rem' }}>Click the speech bubble next to any section to add one.</p>
            </div>
          ) : (
            <>
              {open.length > 0 && (
                <section>
                  <div style={{ fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#89a99e', fontFamily: 'var(--font-mono)', marginBottom: '0.5rem' }}>Open ({open.length})</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {open.map(n => <NoteCard key={n.id} note={n} onClose={onClose} currentUser={currentUser} />)}
                  </div>
                </section>
              )}
              {resolved.length > 0 && (
                <section style={{ marginTop: open.length > 0 ? '1.2rem' : 0 }}>
                  <div style={{ fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#89a99e', fontFamily: 'var(--font-mono)', marginBottom: '0.5rem' }}>Resolved ({resolved.length})</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {resolved.map(n => <NoteCard key={n.id} note={n} onClose={onClose} currentUser={currentUser} />)}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const taStyle = {
  width: '100%', boxSizing: 'border-box',
  padding: '0.45rem 0.6rem',
  border: '1.5px solid rgba(23,47,45,0.15)',
  borderRadius: '0.4rem', resize: 'none', outline: 'none',
  fontFamily: "'DM Sans', sans-serif", color: '#172f2d', background: '#fff', lineHeight: 1.5,
}
const primBtn = {
  background: '#172f2d', color: '#fff', border: 'none',
  padding: '0.3rem 0.7rem', borderRadius: '2rem',
  cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600,
}
const ghostBtn = {
  background: 'none', color: '#89a99e', border: '1px solid rgba(23,47,45,0.15)',
  padding: '0.28rem 0.6rem', borderRadius: '2rem',
  cursor: 'pointer', fontSize: '0.71rem',
}
