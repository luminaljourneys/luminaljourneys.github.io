/**
 * EditModeContext.jsx — Luminal Journeys
 *
 * Auth system for the entire site. Three paths into edit mode:
 *
 *   1. Google Sign-In   — checks Firestore site_config/authorized_editors
 *      { emails: [...] } before granting access.
 *      Identity (displayName, email, photoURL) preserved as currentUser.
 *
 *   2. Email magic link — passwordless sign-in via Firebase Email Link.
 *      For non-Gmail authorized editors (e.g. wouter@keijser.com).
 *      User enters email → receives link → clicks it → lands back signed in.
 *      Same authorized_editors check as Google path.
 *
 *   3. Password login   — username "admin" + VITE_EDIT_PASSWORD, for QA.
 *      currentUser = { displayName: 'Admin', email: 'admin', photoURL: null }
 *
 * Exports:
 *   isEditMode        — boolean
 *   currentUser       — { displayName, email, photoURL } | null
 *   requestAuth()     — show login modal from anywhere
 *   lock()            — exit edit mode
 *   recordSave()      — write site_config/meta with last-saved timestamp + author
 *   signInWithGoogle()
 *   sendMagicLink(email) → { error }
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  onAuthStateChanged,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'
import {
  SITE_CONFIG_COLL,
  AUTHORIZED_EDITORS_DOC,
  SITE_META_DOC,
} from '../lib/collections'

const STORAGE_KEY      = 'lj_edit_session'
const MAGIC_EMAIL_KEY  = 'lj_magic_link_email'
const SESSION_MS       = 30 * 24 * 60 * 60 * 1000 // 30 days

const EditModeContext = createContext({
  isEditMode:       false,
  currentUser:      null,
  requestAuth:      () => {},
  unlock:           () => false,
  lock:             () => {},
  signInWithGoogle: async () => ({ error: null }),
  sendMagicLink:    async () => ({ error: null }),
  recordSave:       () => {},
  showModal:        false,
  dismissModal:     () => {},
})

export function EditModeProvider({ children }) {
  const [isEditMode,  setIsEditMode]  = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [showModal,   setShowModal]   = useState(false)
  const [onSuccess,   setOnSuccess]   = useState(null)

  // ── Restore session on mount ─────────────────────────────────────────────
  useEffect(() => {
    // ── 1. Magic link ALWAYS takes priority — process before localStorage ───
    // If we checked localStorage first, an existing admin session would
    // early-return and the magic link would never be completed, leaving
    // auth.currentUser null and all Firestore writes permission-denied.
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = localStorage.getItem(MAGIC_EMAIL_KEY)
      if (!email) {
        email = window.prompt('Please confirm your email to complete sign-in:')
      }
      if (email) {
        signInWithEmailLink(auth, email, window.location.href)
          .then(async (result) => {
            localStorage.removeItem(MAGIC_EMAIL_KEY)
            window.history.replaceState({}, '', window.location.pathname)

            const fbUser   = result.user
            const rawEmail = (fbUser.email || email).trim().toLowerCase()

            const snap = await getDoc(doc(db, SITE_CONFIG_COLL, AUTHORIZED_EDITORS_DOC))
            const authorized = snap.exists()
              ? (snap.data().emails ?? []).filter(Boolean).map(e => e.trim().toLowerCase())
              : []

            if (!authorized.includes(rawEmail)) {
              await signOut(auth)
              console.warn('[EditMode] Magic link — email not authorized:', rawEmail)
              return
            }

            const user = {
              displayName: fbUser.displayName || rawEmail.split('@')[0],
              email:       fbUser.email || email,
              photoURL:    fbUser.photoURL || null,
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
              expiry: Date.now() + SESSION_MS,
              user,
            }))
            setCurrentUser(user)
            setIsEditMode(true)
          })
          .catch(e => {
            console.error('[EditMode] Magic link completion error:', e.code, e.message)
            localStorage.removeItem(MAGIC_EMAIL_KEY)
          })
      }
      return  // don't restore stale localStorage session on top of fresh auth
    }

    // ── 2. Restore localStorage session (admin or previous Google/magic) ────
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const { expiry, user } = JSON.parse(raw)
        if (Date.now() < expiry) {
          setIsEditMode(true)
          setCurrentUser(user ?? null)
        } else {
          localStorage.removeItem(STORAGE_KEY)
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync Firebase Auth state → keeps auth.currentUser fresh for Firestore ─
  // Without this, a page reload after Google/magic-link sign-in would show
  // the user as logged in (via localStorage) but have no Firebase Auth token,
  // causing every Firestore write to fail with permission-denied.
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        console.log('[EditMode] Firebase Auth restored:', fbUser.email)
      } else {
        console.log('[EditMode] Firebase Auth: no user (password session or signed out)')
      }
    })
    return unsub
  }, [])

  // ── Start a session (shared by all auth paths) ───────────────────────────
  const startSession = useCallback((user) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      expiry: Date.now() + SESSION_MS,
      user,
    }))
    setCurrentUser(user)
    setIsEditMode(true)
    setShowModal(false)
  }, [])

  // ── Password login (admin / QA path) ─────────────────────────────────────
  const unlock = useCallback((username, password) => {
    const correct = import.meta.env.VITE_EDIT_PASSWORD ?? 'luminal2026'
    if (username === 'admin' && password === correct) {
      const user = { displayName: 'Admin', email: 'admin', photoURL: null }
      startSession(user)
      onSuccess?.()
      setOnSuccess(null)
      return true
    }
    return false
  }, [onSuccess, startSession])

  // ── Google Sign-In ────────────────────────────────────────────────────────
  const signInWithGoogle = useCallback(async () => {
    try {
      const provider = new GoogleAuthProvider()
      provider.addScope('email')
      provider.addScope('profile')
      const result = await signInWithPopup(auth, provider)
      const fbUser = result.user

      const rawEmail = fbUser.email || fbUser.providerData?.[0]?.email || ''
      console.log('[EditMode] Google sign-in user:', {
        email:         fbUser.email,
        providerEmail: fbUser.providerData?.[0]?.email,
        displayName:   fbUser.displayName,
      })

      const snap = await getDoc(doc(db, SITE_CONFIG_COLL, AUTHORIZED_EDITORS_DOC))
      const authorized = snap.exists()
        ? (snap.data().emails ?? []).filter(Boolean).map(e => e.trim().toLowerCase())
        : []

      const userEmail = rawEmail.trim().toLowerCase()
      if (!userEmail || !authorized.includes(userEmail)) {
        await signOut(auth)
        const who = rawEmail || 'This account'
        return { error: `${who} is not authorized. Ask your admin to add you.` }
      }

      const user = {
        displayName: fbUser.displayName || userEmail.split('@')[0],
        email:       rawEmail,
        photoURL:    fbUser.photoURL || null,
      }
      startSession(user)
      onSuccess?.()
      setOnSuccess(null)
      return { error: null }
    } catch (e) {
      console.error('[EditMode] Google sign-in error:', e.code, e.message)
      if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') return { error: null }
      if (e.code === 'auth/unauthorized-domain') return { error: 'Domain not authorized. Add this domain in Firebase Console → Auth → Settings → Authorized Domains.' }
      if (e.code === 'auth/operation-not-allowed') return { error: 'Google sign-in is not enabled. Enable it in Firebase Console → Auth → Sign-in method.' }
      if (e.code === 'auth/popup-blocked') return { error: 'Popup blocked. Allow popups for this site and try again.' }
      return { error: `Sign-in failed (${e.code ?? e.message}). Check the browser console for details.` }
    }
  }, [onSuccess, startSession])

  // ── Email magic link (passwordless) ──────────────────────────────────────
  const sendMagicLink = useCallback(async (email) => {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) return { error: 'Please enter your email address.' }

    // Block Gmail — those users must use Google Sign-In (also blocks googlemail.com)
    const gmailDomains = ['gmail.com', 'googlemail.com']
    const domain = trimmed.split('@')[1] ?? ''
    if (gmailDomains.includes(domain)) {
      return { error: 'Gmail accounts must use "Continue with Google" above.' }
    }

    // ── Rate limiting ────────────────────────────────────────────────────────
    // Max 3 attempts per 10 minutes. Stored in localStorage per email.
    const RL_KEY     = 'lj_rl_magic'
    const RL_WINDOW  = 10 * 60 * 1000  // 10 minutes
    const RL_MAX     = 3
    const now        = Date.now()
    let rl           = {}
    try { rl = JSON.parse(localStorage.getItem(RL_KEY) ?? '{}') } catch { /* ignore */ }

    const entry = rl[trimmed] ?? { count: 0, first: now }
    if (now - entry.first > RL_WINDOW) {
      // Window expired — reset
      entry.count = 0
      entry.first = now
    }
    if (entry.count >= RL_MAX) {
      const wait = Math.ceil((RL_WINDOW - (now - entry.first)) / 60000)
      return { error: `Too many attempts. Try again in ${wait} minute${wait !== 1 ? 's' : ''}.` }
    }
    entry.count += 1
    rl[trimmed] = entry
    try { localStorage.setItem(RL_KEY, JSON.stringify(rl)) } catch { /* ignore */ }
    // ────────────────────────────────────────────────────────────────────────

    try {
      const actionCodeSettings = {
        url:             window.location.origin + window.location.pathname,
        handleCodeInApp: true,
      }

      await sendSignInLinkToEmail(auth, trimmed, actionCodeSettings)

      // Save email so completion works on same device without prompting
      localStorage.setItem(MAGIC_EMAIL_KEY, trimmed)

      // Deliberately ambiguous — don't confirm whether email is on the list.
      // The real authorization check happens when they complete sign-in.
      return { error: null }
    } catch (e) {
      console.error('[EditMode] Magic link send error:', e.code, e.message)
      if (e.code === 'auth/invalid-email')          return { error: 'Invalid email address.' }
      if (e.code === 'auth/too-many-requests')       return { error: 'Too many requests from this device. Try again later.' }
      if (e.code === 'auth/operation-not-allowed')   return { error: 'Email link sign-in is not enabled. Contact your admin.' }
      return { error: 'Could not send link. Try again or contact your admin.' }
    }
  }, [])

  // ── Show the login modal ──────────────────────────────────────────────────
  const requestAuth = useCallback((cb) => {
    if (isEditMode) { cb?.(); return }
    setOnSuccess(() => cb ?? null)
    setShowModal(true)
  }, [isEditMode])

  // ── Exit edit mode ────────────────────────────────────────────────────────
  const lock = useCallback(async () => {
    setIsEditMode(false)
    setCurrentUser(null)
    localStorage.removeItem(STORAGE_KEY)
    try { await signOut(auth) } catch { /* ignore */ }
  }, [])

  const dismissModal = useCallback(() => {
    setShowModal(false)
    setOnSuccess(null)
  }, [])

  // ── Record last-saved metadata to Firestore ───────────────────────────────
  const recordSave = useCallback(async (userOverride) => {
    const u = userOverride ?? currentUser
    if (!u) return
    try {
      await setDoc(doc(db, SITE_CONFIG_COLL, SITE_META_DOC), {
        lastSavedAt: serverTimestamp(),
        lastSavedBy: { displayName: u.displayName, email: u.email },
      }, { merge: true })
    } catch { /* non-critical */ }
  }, [currentUser])

  return (
    <EditModeContext.Provider value={{
      isEditMode,
      currentUser,
      showModal,
      requestAuth,
      unlock,
      signInWithGoogle,
      sendMagicLink,
      lock,
      dismissModal,
      recordSave,
    }}>
      {children}
      {showModal && <LoginModal />}
    </EditModeContext.Provider>
  )
}

export const useEditMode = () => useContext(EditModeContext)

// ── Login Modal ───────────────────────────────────────────────────────────────
function LoginModal() {
  const { unlock, signInWithGoogle, sendMagicLink, dismissModal } = useEditMode()

  const [username,    setUsername]    = useState('')
  const [password,    setPassword]    = useState('')
  const [linkEmail,   setLinkEmail]   = useState('')
  const [error,       setError]       = useState('')
  const [loading,     setLoading]     = useState(false)
  const [linkSent,    setLinkSent]    = useState(false)
  const [linkLoading, setLinkLoading] = useState(false)

  const handlePassword = (e) => {
    e.preventDefault()
    setError('')
    const ok = unlock(username, password)
    if (!ok) setError('Incorrect credentials.')
  }

  const handleGoogle = async () => {
    setLoading(true)
    setError('')
    const { error: err } = await signInWithGoogle()
    setLoading(false)
    if (err) setError(err)
  }

  const handleMagicLink = async (e) => {
    e.preventDefault()
    setLinkLoading(true)
    setError('')
    const { error: err } = await sendMagicLink(linkEmail)
    setLinkLoading(false)
    if (err) {
      setError(err)
    } else {
      setLinkSent(true)
    }
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) dismissModal() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(17,30,28,0.65)', backdropFilter: 'blur(4px)',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div style={{
        background: '#F9F8F6', borderRadius: '1.1rem',
        padding: '2.4rem 2.5rem', width: 380, maxWidth: '92vw',
        boxShadow: '0 24px 80px rgba(0,0,0,0.22)',
        border: '1px solid rgba(23,47,45,0.12)',
        maxHeight: '92vh', overflowY: 'auto',
      }}>
        <div
          role="heading"
          aria-level={2}
          style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: '1.5rem', color: '#172f2d', marginBottom: '0.3rem',
          }}
        >
          Editor Access
        </div>
        <p style={{ fontSize: '0.83rem', color: '#89a99e', marginBottom: '1.6rem', lineHeight: 1.5 }}>
          Sign in to edit content on this page.
        </p>

        {/* ── 1. Google Sign-In ── */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          style={{
            width: '100%', padding: '0.7rem 1rem',
            border: '1.5px solid rgba(23,47,45,0.2)',
            borderRadius: '0.6rem', background: '#fff',
            cursor: loading ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem',
            fontSize: '0.9rem', fontWeight: 500, color: '#172f2d',
            fontFamily: "'DM Sans', sans-serif",
            transition: 'border-color 0.15s',
            marginBottom: '1.2rem',
          }}
        >
          <GoogleIcon />
          {loading ? 'Signing in…' : 'Continue with Google'}
        </button>

        <Divider />

        {/* ── 2. Email magic link ── */}
        {linkSent ? (
          <div style={{
            background: 'rgba(44,95,74,0.08)', borderRadius: '0.6rem',
            padding: '1rem 1.1rem', marginBottom: '1.2rem', textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.4rem', marginBottom: '0.4rem' }}>✉️</div>
            <p style={{ fontSize: '0.88rem', color: '#172f2d', margin: 0, lineHeight: 1.6 }}>
              If <strong>{linkEmail}</strong> is on the access list, you'll receive a sign-in link shortly.<br />
              <span style={{ color: '#89a99e', fontSize: '0.8rem' }}>The link expires in 1 hour and works once.</span>
            </p>
            <button
              onClick={() => { setLinkSent(false); setLinkEmail('') }}
              style={{
                marginTop: '0.8rem', background: 'none', border: 'none',
                color: '#89a99e', fontSize: '0.78rem', cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleMagicLink} style={{ marginBottom: '1.2rem' }}>
            <label style={{ fontSize: '0.75rem', color: '#89a99e', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
              Sign in with email link
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="email"
                placeholder="your@email.com"
                value={linkEmail}
                onChange={e => setLinkEmail(e.target.value)}
                autoComplete="email"
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                type="submit"
                disabled={linkLoading || !linkEmail.trim()}
                style={{
                  background: linkLoading || !linkEmail.trim() ? '#89a99e' : '#2C5F4A',
                  color: '#fff', border: 'none', borderRadius: '0.5rem',
                  padding: '0 1rem', cursor: linkLoading || !linkEmail.trim() ? 'default' : 'pointer',
                  fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap',
                  fontFamily: "'DM Sans', sans-serif", transition: 'background 0.15s',
                }}
              >
                {linkLoading ? '…' : 'Send link'}
              </button>
            </div>
          </form>
        )}

        <Divider />

        {/* ── 3. Password login (admin / QA) ── */}
        <form onSubmit={handlePassword} style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
          <label style={{ fontSize: '0.75rem', color: '#89a99e', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Admin password
          </label>
          <input
            type="text" placeholder="Username" value={username}
            onChange={e => setUsername(e.target.value)}
            autoComplete="username"
            style={inputStyle}
          />
          <input
            type="password" placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            style={inputStyle}
          />
          {error && (
            <p style={{ fontSize: '0.8rem', color: '#C4604A', margin: 0 }}>{error}</p>
          )}
          <button type="submit" style={{
            background: '#172f2d', color: '#fff', border: 'none',
            padding: '0.7rem', borderRadius: '0.6rem', cursor: 'pointer',
            fontSize: '0.9rem', fontWeight: 600, marginTop: '0.2rem',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Sign in
          </button>
        </form>
      </div>
    </div>
  )
}

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.2rem' }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(23,47,45,0.12)' }} />
      <span style={{ fontSize: '0.72rem', color: '#89a99e', letterSpacing: '0.06em', textTransform: 'uppercase' }}>or</span>
      <div style={{ flex: 1, height: 1, background: 'rgba(23,47,45,0.12)' }} />
    </div>
  )
}

const inputStyle = {
  padding: '0.65rem 0.9rem',
  border: '1.5px solid rgba(23,47,45,0.18)',
  borderRadius: '0.5rem',
  fontSize: '0.88rem',
  outline: 'none',
  fontFamily: "'DM Sans', sans-serif",
  color: '#172f2d',
  background: '#fff',
  width: '100%',
  boxSizing: 'border-box',
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  )
}
