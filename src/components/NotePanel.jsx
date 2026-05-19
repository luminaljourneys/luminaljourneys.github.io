/**
 * NotePanel.jsx — Luminal Journeys
 * Right-side panel: scrollable notes list + pinned compose at the bottom.
 * Section-specific notes come from NoteMarker bubbles next to each field.
 * General page notes are posted from the bottom compose bar here.
 */

import { useState, useRef, useEffect } from 'react'
import { useEditMode } from '../context/EditModeContext.jsx'
import { usePageNotes, addNote, addReply, resolveNote } from '../hooks/useNotes.js'

// ── Avatars ───────────────────────────────────────────────────────────────────
const PALETTE = ['#4A7C59', '#bf8a3e', '#4A6C8C', '#8C4A6C', '#6C4A8C', '#5C7A4A']
function avatarColor(str = '') {
  let h = 0
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
  return PALETTE[Math.abs(h) % PALETTE.length]
}

function Avatar({ author, size = 24 }) {
  if (author?.photoURL) {
    return <img src={author.photoURL} alt={author.displayName} style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, objectFit: 'cover' }} />
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: avatarColor(author?.email ?? ''), color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.42, fontWeight: 700,
    }}>
      {author?.displayName?.[0]?.toUpperCase() ?? '?'}
    </div>
  )
}

function fmtTime(ts) {
  if (!ts) return ''
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    const diffMin = Math.floor((Date.now() - d) / 60000)
    if (diffMin < 1)  return 'just now'
    if (diffMin < 60) return `${diffMin}m ago`
    const diffH = Math.floor(diffMin / 60)
    if (diffH < 24)   return `${diffH}h ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch { return '' }
}

// ── Note card (root + replies) ────────────────────────────────────────────────
function NoteCard({ note, currentUser, onScrollTo }) {
  const [showReply, setShowReply] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [saving,    setSaving]    = useState(false)
  const replyRef = useRef(null)

  useEffect(() => { if (showReply) setTimeout(() => replyRef.current?.focus(), 50) }, [showReply])

  const handleReply = async () => {
    if (!replyText.trim() || !currentUser) return
    setSaving(true)
    try {
      await addReply(note.id, note.replies ?? [], replyText, currentUser)
      setReplyText('')
      setShowReply(false)
    } finally { setSaving(false) }
  }

  const isGeneral = note.sectionKey === 'general'

  return (
    <div style={{
      background: '#fff', border: '1px solid rgba(23,47,45,0.09)',
      borderRadius: '0.75rem', padding: '0.8rem 0.9rem',
      opacity: note.resolved ? 0.45 : 1,
    }}>
      {/* Section tag row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{
          fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase',
          color: isGeneral ? '#89a99e' : '#bf8a3e',
          background: isGeneral ? 'rgba(137,169,158,0.1)' : 'rgba(191,138,62,0.1)',
          borderRadius: '0.25rem', padding: '0.1rem 0.4rem',
          fontFamily: 'var(--font-mono)',
        }}>
          {isGeneral ? 'Page' : note.sectionKey.replace('field-', '')}
        </span>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {!isGeneral && !note.resolved && (
            <button onClick={onScrollTo} style={linkBtn}>↗ Go to field</button>
          )}
          {!note.resolved
            ? <button onClick={() => resolveNote(note.id)} style={linkBtn}>✓ Resolve</button>
            : <span style={{ fontSize: '0.62rem', color: '#74c9a0', fontWeight: 600 }}>✓ Resolved</span>
          }
        </div>
      </div>

      {/* Root message */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Avatar author={note.author} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginBottom: '0.15rem' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 600, color: '#172f2d' }}>{note.author?.displayName}</span>
            <span style={{ fontSize: '0.63rem', color: '#89a99e' }}>{fmtTime(note.createdAt)}</span>
          </div>
          <p style={{ margin: 0, fontSize: '0.83rem', color: '#3a5450', lineHeight: 1.55, wordBreak: 'break-word' }}>{note.text}</p>
        </div>
      </div>

      {/* Reply thread */}
      {(note.replies ?? []).length > 0 && (
        <div style={{ marginTop: '0.6rem', marginLeft: '2rem', paddingLeft: '0.7rem', borderLeft: '2px solid rgba(23,47,45,0.07)', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          {note.replies.map(r => (
            <div key={r.id} style={{ display: 'flex', gap: '0.4rem' }}>
              <Avatar author={r.author} size={18} />
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginBottom: '0.1rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#172f2d' }}>{r.author?.displayName}</span>
                  <span style={{ fontSize: '0.61rem', color: '#89a99e' }}>{fmtTime(r.createdAt)}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#3a5450', lineHeight: 1.5, wordBreak: 'break-word' }}>{r.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply composer */}
      {!note.resolved && (
        <div style={{ marginTop: '0.5rem', marginLeft: '2rem' }}>
          {showReply ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'flex-start' }}>
                {currentUser && <Avatar author={currentUser} size={18} />}
                <textarea
                  ref={replyRef} rows={2}
                  placeholder="Reply… (⌘↵ to post)"
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleReply() }}
                  style={{ ...taStyle, flex: 1, fontSize: '0.78rem' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                <button onClick={() => { setShowReply(false); setReplyText('') }} style={ghostBtn}>Cancel</button>
                <button onClick={handleReply} disabled={!replyText.trim() || saving} style={{ ...primBtn, opacity: !replyText.trim() ? 0.45 : 1 }}>
                  {saving ? '…' : 'Reply'}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowReply(true)} style={linkBtn}>↩ Reply</button>
          )}
        </div>
      )}
    </div>
  )
}

function ResolvedSection({ notes, currentUser, onScrollTo }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div style={{ marginTop: '0.5rem' }}>
      <button
        onClick={() => setExpanded(v => !v)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#89a99e', fontFamily: 'var(--font-mono)', padding: '0.2rem 0' }}
      >
        <span style={{ display: 'inline-block', transition: 'transform 0.15s', transform: expanded ? 'rotate(90deg)' : 'none' }}>▶</span>
        Resolved · {notes.length}
      </button>
      {expanded && (
        <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          {notes.map(n => <NoteCard key={n.id} note={n} currentUser={currentUser} onScrollTo={() => onScrollTo(n.sectionKey)} />)}
        </div>
      )}
    </div>
  )
}

// ── Panel ─────────────────────────────────────────────────────────────────────
export default function NotePanel({ onClose }) {
  const { currentUser } = useEditMode()
  const { notes, loading, pageId } = usePageNotes()

  const [draft,   setDraft]   = useState('')
  const [posting, setPosting] = useState(false)
  const bottomRef   = useRef(null)
  const composeRef  = useRef(null)
  const listRef     = useRef(null)

  const open     = notes.filter(n => !n.resolved)
  const resolved = notes.filter(n => n.resolved)

  // Scroll list to bottom when new notes arrive
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [notes.length])

  const handlePost = async () => {
    if (!draft.trim() || !currentUser) return
    setPosting(true)
    try {
      await addNote('general', pageId, draft, currentUser)
      setDraft('')
    } finally { setPosting(false) }
  }

  const scrollToSection = (sectionKey) => {
    const el = document.querySelector(`[data-note-key="${sectionKey}"]`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.style.outline = '2px solid #bf8a3e'
      setTimeout(() => { el.style.outline = '' }, 1400)
    }
    onClose()
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9500,
        display: 'flex', justifyContent: 'flex-end',
        background: 'rgba(17,30,28,0.18)',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div style={{
        width: 360, height: '100%',
        background: '#F9F8F6',
        boxShadow: '-6px 0 28px rgba(0,0,0,0.1)',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: '1rem 1.2rem 0.8rem',
          borderBottom: '1px solid rgba(23,47,45,0.09)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '1.05rem', color: '#172f2d' }}>
              Team Notes
            </div>
            <div style={{ fontSize: '0.68rem', color: '#89a99e', marginTop: '0.05rem' }}>
              {loading ? 'Loading…' : open.length === 0 ? 'No open notes' : `${open.length} open · ${resolved.length} resolved`}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#89a99e', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
        </div>

        {/* ── Scrollable notes list ── */}
        <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '0.8rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>

          {loading && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#89a99e', fontSize: '0.82rem' }}>Loading…</div>
          )}

          {!loading && open.length === 0 && resolved.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>💬</div>
              <p style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '0.95rem', color: '#172f2d', margin: '0 0 0.35rem' }}>No notes yet</p>
              <p style={{ fontSize: '0.78rem', color: '#89a99e', lineHeight: 1.55, margin: 0 }}>
                Leave a note below, or click the <strong style={{ color: '#172f2d' }}>💬</strong> icon next to any form field to comment on it specifically.
              </p>
            </div>
          )}

          {!loading && open.length > 0 && (
            <div>
              <div style={{ fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#89a99e', fontFamily: 'var(--font-mono)', marginBottom: '0.45rem' }}>
                Open · {open.length}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {open.map(n => <NoteCard key={n.id} note={n} currentUser={currentUser} onScrollTo={() => scrollToSection(n.sectionKey)} />)}
              </div>
            </div>
          )}

          {!loading && resolved.length > 0 && (
            <ResolvedSection notes={resolved} currentUser={currentUser} onScrollTo={scrollToSection} />
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── Pinned compose bar at the bottom ── */}
        <div style={{
          flexShrink: 0,
          borderTop: '1px solid rgba(23,47,45,0.1)',
          padding: '0.75rem 1rem',
          background: '#F9F8F6',
        }}>
          {currentUser ? (
            <>
              {/* Author line */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.5rem' }}>
                <Avatar author={currentUser} size={20} />
                <span style={{ fontSize: '0.7rem', color: '#89a99e' }}>
                  Comment as <strong style={{ color: '#172f2d' }}>{currentUser.displayName}</strong>
                </span>
              </div>

              {/* Textarea + Send */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                <textarea
                  ref={composeRef}
                  rows={2}
                  placeholder="Leave a note about this page… (⌘↵ to post)"
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePost() }}
                  style={{ ...taStyle, flex: 1, resize: 'none' }}
                />
                <button
                  onClick={handlePost}
                  disabled={!draft.trim() || posting}
                  style={{
                    ...primBtn,
                    flexShrink: 0, padding: '0.55rem 0.9rem',
                    opacity: !draft.trim() || posting ? 0.45 : 1,
                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                  }}
                >
                  {posting ? '…' : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M1 8l14-7-5 7 5 7L1 8z"/>
                      </svg>
                      Post
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <p style={{ fontSize: '0.78rem', color: '#89a99e', textAlign: 'center', margin: 0 }}>
              Sign in with Google to leave notes.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const taStyle = {
  width: '100%', boxSizing: 'border-box',
  padding: '0.5rem 0.65rem',
  border: '1.5px solid rgba(23,47,45,0.13)',
  borderRadius: '0.5rem', outline: 'none',
  fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem',
  color: '#172f2d', background: '#fff', lineHeight: 1.5,
}
const primBtn = {
  background: '#172f2d', color: '#fff', border: 'none',
  padding: '0.38rem 0.85rem', borderRadius: '2rem',
  cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
  fontFamily: "'DM Sans', sans-serif",
}
const ghostBtn = {
  background: 'none', color: '#89a99e', border: '1px solid rgba(23,47,45,0.15)',
  padding: '0.32rem 0.7rem', borderRadius: '2rem',
  cursor: 'pointer', fontSize: '0.72rem', fontFamily: "'DM Sans', sans-serif",
}
const linkBtn = {
  background: 'none', border: 'none', color: '#89a99e',
  cursor: 'pointer', fontSize: '0.68rem', padding: 0,
  fontFamily: "'DM Sans', sans-serif",
}
