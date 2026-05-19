/**
 * NotePanel.jsx — Luminal Journeys
 * Right-side slide panel for team notes on the current page.
 * Compose + threaded replies. Identity from currentUser (Gmail login).
 */

import { useState, useRef, useEffect } from 'react'
import { useEditMode } from '../context/EditModeContext.jsx'
import { usePageNotes, addNote, addReply, resolveNote } from '../hooks/useNotes.js'

// ── Avatar helpers ────────────────────────────────────────────────────────────
const PALETTE = ['#4A7C59', '#bf8a3e', '#4A6C8C', '#8C4A6C', '#6C4A8C', '#5C7A4A']
function avatarColor(str = '') {
  let h = 0
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
  return PALETTE[Math.abs(h) % PALETTE.length]
}

function Avatar({ author, size = 24 }) {
  if (author?.photoURL) {
    return (
      <img
        src={author.photoURL} alt={author.displayName}
        style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, objectFit: 'cover' }}
      />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: avatarColor(author?.email ?? ''),
      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.42, fontWeight: 700, letterSpacing: 0,
    }}>
      {author?.displayName?.[0]?.toUpperCase() ?? '?'}
    </div>
  )
}

function fmtTime(ts) {
  if (!ts) return ''
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    const now = new Date()
    const diffMin = Math.floor((now - d) / 60000)
    if (diffMin < 1)  return 'just now'
    if (diffMin < 60) return `${diffMin}m ago`
    const diffH = Math.floor(diffMin / 60)
    if (diffH < 24)   return `${diffH}h ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch { return '' }
}

// ── Single note card with reply thread ───────────────────────────────────────
function NoteCard({ note, currentUser, onScrollTo }) {
  const [showReply, setShowReply] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [saving,    setSaving]    = useState(false)
  const replyRef = useRef(null)

  useEffect(() => {
    if (showReply) setTimeout(() => replyRef.current?.focus(), 50)
  }, [showReply])

  const handleReply = async () => {
    if (!replyText.trim() || !currentUser) return
    setSaving(true)
    try {
      await addReply(note.id, note.replies ?? [], replyText, currentUser)
      setReplyText('')
      setShowReply(false)
    } finally { setSaving(false) }
  }

  return (
    <div style={{
      background: '#fff',
      border: '1px solid rgba(23,47,45,0.09)',
      borderRadius: '0.75rem',
      padding: '0.85rem 0.95rem',
      opacity: note.resolved ? 0.45 : 1,
      transition: 'opacity 0.2s',
    }}>
      {/* Section tag + go-to */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '0.55rem',
      }}>
        <span style={{
          fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase',
          color: '#89a99e', fontFamily: 'var(--font-mono)',
          background: 'rgba(137,169,158,0.12)', borderRadius: '0.25rem',
          padding: '0.1rem 0.4rem',
        }}>
          {note.sectionKey === 'general' ? 'General' : note.sectionKey}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {note.sectionKey !== 'general' && (
            <button onClick={onScrollTo} style={linkBtnStyle} title="Scroll to section">
              ↗ Go to section
            </button>
          )}
          {!note.resolved && (
            <button onClick={() => resolveNote(note.id)} style={linkBtnStyle}>
              ✓ Resolve
            </button>
          )}
          {note.resolved && (
            <span style={{ fontSize: '0.65rem', color: '#74c9a0', fontWeight: 600 }}>✓ Resolved</span>
          )}
        </div>
      </div>

      {/* Root note */}
      <div style={{ display: 'flex', gap: '0.55rem' }}>
        <Avatar author={note.author} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.2rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#172f2d' }}>
              {note.author?.displayName}
            </span>
            <span style={{ fontSize: '0.65rem', color: '#89a99e' }}>
              {fmtTime(note.createdAt)}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.84rem', color: '#3a5450', lineHeight: 1.55, wordBreak: 'break-word' }}>
            {note.text}
          </p>
        </div>
      </div>

      {/* Reply thread */}
      {(note.replies ?? []).length > 0 && (
        <div style={{
          marginTop: '0.65rem', marginLeft: '2rem',
          paddingLeft: '0.75rem',
          borderLeft: '2px solid rgba(23,47,45,0.08)',
          display: 'flex', flexDirection: 'column', gap: '0.5rem',
        }}>
          {note.replies.map(reply => (
            <div key={reply.id} style={{ display: 'flex', gap: '0.45rem' }}>
              <Avatar author={reply.author} size={18} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginBottom: '0.1rem' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#172f2d' }}>
                    {reply.author?.displayName}
                  </span>
                  <span style={{ fontSize: '0.62rem', color: '#89a99e' }}>
                    {fmtTime(reply.createdAt)}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.79rem', color: '#3a5450', lineHeight: 1.5, wordBreak: 'break-word' }}>
                  {reply.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply composer */}
      {!note.resolved && (
        <div style={{ marginTop: '0.55rem', marginLeft: '2rem' }}>
          {showReply ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-start' }}>
                {currentUser && <Avatar author={currentUser} size={18} />}
                <textarea
                  ref={replyRef}
                  rows={2}
                  placeholder="Write a reply… (⌘↵ to post)"
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleReply() }}
                  style={{ ...taStyle, flex: 1, fontSize: '0.78rem' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                <button onClick={() => { setShowReply(false); setReplyText('') }} style={ghostBtnStyle}>
                  Cancel
                </button>
                <button
                  onClick={handleReply}
                  disabled={!replyText.trim() || saving || !currentUser}
                  style={{ ...primBtnStyle, opacity: !replyText.trim() || saving ? 0.5 : 1 }}
                >
                  {saving ? 'Posting…' : 'Reply'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowReply(true)}
              style={linkBtnStyle}
            >
              ↩ Reply
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Panel ─────────────────────────────────────────────────────────────────────
export default function NotePanel({ onClose }) {
  const { currentUser } = useEditMode()
  const { notes, loading, pageId } = usePageNotes()

  const [showCompose, setShowCompose] = useState(false)
  const [draft,       setDraft]       = useState('')
  const [section,     setSection]     = useState('general')
  const [posting,     setPosting]     = useState(false)
  const composeRef = useRef(null)

  const open     = notes.filter(n => !n.resolved)
  const resolved = notes.filter(n => n.resolved)

  // Auto-open compose when panel first opens and there are no notes
  useEffect(() => {
    if (!loading && notes.length === 0) setShowCompose(true)
  }, [loading])

  useEffect(() => {
    if (showCompose) setTimeout(() => composeRef.current?.focus(), 60)
  }, [showCompose])

  const handlePost = async () => {
    if (!draft.trim() || !currentUser) return
    setPosting(true)
    try {
      await addNote(section || 'general', pageId, draft, currentUser)
      setDraft('')
      setSection('general')
      setShowCompose(false)
    } finally { setPosting(false) }
  }

  const scrollToSection = (key) => {
    const el = document.querySelector(`[data-note-key="${key}"]`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.style.outline = '2px solid #bf8a3e'
      setTimeout(() => { el.style.outline = '' }, 1400)
    }
    onClose()
  }

  // Unique section keys from existing notes (for the section picker)
  const sectionKeys = [...new Set(notes.map(n => n.sectionKey).filter(k => k && k !== 'general'))]

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9500,
        display: 'flex', justifyContent: 'flex-end',
        background: 'rgba(17,30,28,0.2)',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div style={{
        width: 380, height: '100%',
        background: '#F9F8F6',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.12)',
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: '1.1rem 1.3rem 0.9rem',
          borderBottom: '1px solid rgba(23,47,45,0.1)',
          position: 'sticky', top: 0, background: '#F9F8F6', zIndex: 2,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
            <div>
              <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '1.1rem', color: '#172f2d' }}>
                Team Notes
              </div>
              <div style={{ fontSize: '0.7rem', color: '#89a99e', marginTop: '0.1rem' }}>
                {loading ? 'Loading…' : open.length === 0 ? 'No open notes' : `${open.length} open · ${resolved.length} resolved`}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {!showCompose && currentUser && (
                <button
                  onClick={() => setShowCompose(true)}
                  style={{
                    background: '#172f2d', color: '#fff', border: 'none',
                    padding: '0.42rem 0.9rem', borderRadius: '2rem',
                    cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                  }}
                >
                  + New Note
                </button>
              )}
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#89a99e', cursor: 'pointer', fontSize: '1rem', padding: '0.2rem' }}>
                ✕
              </button>
            </div>
          </div>

          {/* ── Compose area ── */}
          {showCompose && (
            <div style={{
              background: '#fff', borderRadius: '0.75rem',
              border: '1.5px solid rgba(23,47,45,0.15)',
              padding: '0.85rem',
              marginTop: '0.1rem',
            }}>
              {currentUser ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                    <Avatar author={currentUser} size={22} />
                    <span style={{ fontSize: '0.75rem', color: '#89a99e' }}>
                      Noting as <strong style={{ color: '#172f2d' }}>{currentUser.displayName}</strong>
                    </span>
                  </div>

                  {/* Section selector */}
                  <div style={{ marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#89a99e', fontFamily: 'var(--font-mono)' }}>
                      Section (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. hero-heading, intake-step-2, general"
                      value={section}
                      onChange={e => setSection(e.target.value)}
                      list="section-suggestions"
                      style={{ ...taStyle, marginTop: '0.25rem', padding: '0.4rem 0.6rem', fontSize: '0.78rem', resize: 'none', height: 'auto' }}
                    />
                    {sectionKeys.length > 0 && (
                      <datalist id="section-suggestions">
                        <option value="general" />
                        {sectionKeys.map(k => <option key={k} value={k} />)}
                      </datalist>
                    )}
                  </div>

                  <textarea
                    ref={composeRef}
                    rows={3}
                    placeholder="What do you want to note? (⌘↵ to post)"
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePost() }}
                    style={{ ...taStyle, marginBottom: '0.5rem' }}
                  />
                  <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                    <button onClick={() => { setShowCompose(false); setDraft('') }} style={ghostBtnStyle}>
                      Cancel
                    </button>
                    <button
                      onClick={handlePost}
                      disabled={!draft.trim() || posting}
                      style={{ ...primBtnStyle, opacity: !draft.trim() || posting ? 0.5 : 1 }}
                    >
                      {posting ? 'Posting…' : 'Post note'}
                    </button>
                  </div>
                </>
              ) : (
                <p style={{ fontSize: '0.83rem', color: '#89a99e', textAlign: 'center', padding: '0.5rem 0' }}>
                  Sign in with Google to leave notes.
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Notes list ── */}
        <div style={{ flex: 1, padding: '0.85rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>

          {loading && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#89a99e', fontSize: '0.83rem' }}>
              Loading notes…
            </div>
          )}

          {!loading && open.length === 0 && resolved.length === 0 && !showCompose && (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.6rem' }}>💬</div>
              <p style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '1rem', color: '#172f2d', margin: '0 0 0.4rem' }}>
                No notes yet
              </p>
              <p style={{ fontSize: '0.8rem', color: '#89a99e', lineHeight: 1.5, margin: '0 0 1.2rem' }}>
                Use notes to leave feedback, flag issues, or coordinate changes with your team.
              </p>
              {currentUser && (
                <button
                  onClick={() => setShowCompose(true)}
                  style={{ ...primBtnStyle, padding: '0.55rem 1.4rem', fontSize: '0.82rem' }}
                >
                  + Write the first note
                </button>
              )}
            </div>
          )}

          {/* Open notes */}
          {!loading && open.length > 0 && (
            <div>
              <div style={{ fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#89a99e', fontFamily: 'var(--font-mono)', marginBottom: '0.5rem' }}>
                Open · {open.length}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {open.map(n => (
                  <NoteCard
                    key={n.id}
                    note={n}
                    currentUser={currentUser}
                    onScrollTo={() => scrollToSection(n.sectionKey)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Resolved notes (collapsed by default) */}
          {!loading && resolved.length > 0 && (
            <ResolvedSection notes={resolved} currentUser={currentUser} onScrollTo={scrollToSection} />
          )}
        </div>
      </div>
    </div>
  )
}

function ResolvedSection({ notes, currentUser, onScrollTo }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div style={{ marginTop: '0.5rem' }}>
      <button
        onClick={() => setExpanded(v => !v)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '0.35rem',
          fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase',
          color: '#89a99e', fontFamily: 'var(--font-mono)', padding: '0.2rem 0',
        }}
      >
        <span style={{ display: 'inline-block', transition: 'transform 0.15s', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
        Resolved · {notes.length}
      </button>
      {expanded && (
        <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {notes.map(n => (
            <NoteCard key={n.id} note={n} currentUser={currentUser} onScrollTo={() => onScrollTo(n.sectionKey)} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const taStyle = {
  width: '100%', boxSizing: 'border-box',
  padding: '0.5rem 0.65rem',
  border: '1.5px solid rgba(23,47,45,0.13)',
  borderRadius: '0.5rem', resize: 'vertical', outline: 'none',
  fontFamily: "'DM Sans', sans-serif", fontSize: '0.83rem',
  color: '#172f2d', background: '#fff', lineHeight: 1.5,
}
const primBtnStyle = {
  background: '#172f2d', color: '#fff', border: 'none',
  padding: '0.38rem 0.85rem', borderRadius: '2rem',
  cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
  fontFamily: "'DM Sans', sans-serif", transition: 'opacity 0.15s',
}
const ghostBtnStyle = {
  background: 'none', color: '#89a99e',
  border: '1px solid rgba(23,47,45,0.15)',
  padding: '0.36rem 0.8rem', borderRadius: '2rem',
  cursor: 'pointer', fontSize: '0.74rem',
  fontFamily: "'DM Sans', sans-serif",
}
const linkBtnStyle = {
  background: 'none', border: 'none',
  color: '#89a99e', cursor: 'pointer',
  fontSize: '0.7rem', padding: 0,
  fontFamily: "'DM Sans', sans-serif",
  textDecoration: 'underline', textDecorationColor: 'transparent',
  transition: 'color 0.15s',
}
