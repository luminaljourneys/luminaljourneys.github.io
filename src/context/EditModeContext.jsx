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

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  signOut,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  onAuthStateChanged,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'
import {
  IS_STAGING,
  SITE_CONFIG_COLL,
  AUTHORIZED_EDITORS_DOC,
  SITE_META_DOC,
} from '../lib/collections'

const STORAGE_KEY      = 'lj_edit_session'
const MAGIC_EMAIL_KEY  = 'lj_magic_link_email'
const SESSION_MS       = 30 * 24 * 60 * 60 * 1000 // 30 days
const INACTIVITY_MS    = 15 * 60 * 1000            // 15 minutes
const WARN_SECS        = 60                         // countdown seconds before auto sign-out

// ── Display name lookup for magic-link editors ────────────────────────────────
// Keyed by lowercase email. Falls back to the part before @ if not listed.
const EDITOR_NAMES = {
  'hi@keeya.nl':                'Keeya',
  'drwangjones@gmail.com':      'Tie',
  'cullensarahbetty@gmail.com': 'Sarah',
  'dpendragon@pacbell.net':     'Diane',
  'wouter@keijser.com':         'Wouter',
}

const EditModeContext = createContext({
  isEditMode:        false,
  currentUser:       null,
  hasFirebaseAuth:   false,
  magicLinkPending:  false,
  requestAuth:       () => {},
  unlock:            () => false,
  lock:              () => {},
  signOutFully:      async () => {},
  signInWithGoogle:  async () => ({ error: null }),
  sendMagicLink:     async () => ({ error: null }),
  recordSave:        () => {},
  showModal:         false,
  dismissModal:      () => {},
})

export function EditModeProvider({ children }) {
  // ── Synchronous session restore ──────────────────────────────────────────
  // Read localStorage in the useState initializer so isEditMode / currentUser
  // are already correct on the VERY FIRST RENDER — before any useEffect fires.
  // This prevents AdminGate from ever mounting (and calling requestAuth →
  // showModal = true) when a valid session exists in localStorage.
  // Magic link URLs always take priority: don't restore a stale session
  // on top of an incoming fresh auth flow.
  const [isEditMode, setIsEditMode] = useState(() => {
    // Production: editing only happens on admin.luminaljourneys.com.
    // Clear any stale localStorage sessions so edit UI never leaks to public visitors.
    if (!IS_STAGING) {
      localStorage.removeItem(STORAGE_KEY)
      return false
    }
    if (isSignInWithEmailLink(auth, window.location.href)) return false
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const { expiry } = JSON.parse(raw)
        if (Date.now() < expiry) return true
      }
    } catch { /* ignore */ }
    return false
  })
  const [currentUser, setCurrentUser] = useState(() => {
    if (!IS_STAGING) return null
    if (isSignInWithEmailLink(auth, window.location.href)) return null
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const { expiry, user } = JSON.parse(raw)
        if (Date.now() < expiry) return user ?? null
      }
    } catch { /* ignore */ }
    return null
  })
  const [hasFirebaseAuth,   setHasFirebaseAuth]   = useState(false) // true = Google or magic link
  const [showModal,         setShowModal]          = useState(false)
  const [onSuccess,         setOnSuccess]          = useState(null)
  const [inactivityWarning, setInactivityWarning] = useState(false)
  const [warnCountdown,     setWarnCountdown]      = useState(WARN_SECS)
  const inactivityTimer  = useRef(null)
  const countdownTimer   = useRef(null)

  // True while an incoming magic link is being processed — prevents AdminGate
  // from firing requestAuth() and showing the modal before the async completes.
  const [magicLinkPending, setMagicLinkPending] = useState(
    () => isSignInWithEmailLink(auth, window.location.href)
  )

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
              setMagicLinkPending(false)
              return
            }

            const user = {
              displayName: EDITOR_NAMES[rawEmail] ?? rawEmail.split('@')[0],
              email:       fbUser.email || email,
              photoURL:    null,
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
              expiry: Date.now() + SESSION_MS,
              user,
            }))
            setCurrentUser(user)
            setIsEditMode(true)
            setMagicLinkPending(false)
          })
          .catch(e => {
            console.error('[EditMode] Magic link completion error:', e.code, e.message)
            localStorage.removeItem(MAGIC_EMAIL_KEY)
            setMagicLinkPending(false)
          })
      } else {
        setMagicLinkPending(false)
      }
      return  // don't restore stale localStorage session on top of fresh auth
    }

    // ── 2. No-op: localStorage session already restored synchronously ────────
    // isEditMode and currentUser were initialized from localStorage in their
    // useState lazy initializers above, so nothing more to do here.
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync Firebase Auth state → drives hasFirebaseAuth ────────────────────
  // hasFirebaseAuth = true  → Google or magic link session (can write to Firestore)
  // hasFirebaseAuth = false → password/admin session or signed out (read-only)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      setHasFirebaseAuth(!!fbUser)
      if (fbUser) {
        console.log('[EditMode] Firebase Auth active:', fbUser.email)
      } else {
        console.log('[EditMode] Firebase Auth: none (password session or signed out)')
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
      // Sign in anonymously so Firestore rules (request.auth != null) pass
      // for admin reads — intake submissions, etc. — even in password mode.
      signInAnonymously(auth).catch(() => {})
      onSuccess?.()
      setOnSuccess(null)
      return true
    }
    return false
  }, [onSuccess, startSession])

  // ── Google Sign-In ────────────────────────────────────────────────────────
  const signInWithGoogle = useCallback(async () => {
    console.log('[Google] 1 — opening popup')
    try {
      const provider = new GoogleAuthProvider()
      provider.addScope('email')
      provider.addScope('profile')
      const result = await signInWithPopup(auth, provider)
      const fbUser = result.user
      console.log('[Google] 2 — popup resolved, uid:', fbUser.uid, 'email:', fbUser.email)

      const rawEmail = fbUser.email || fbUser.providerData?.[0]?.email || ''

      console.log('[Google] 3 — forcing token refresh')
      await fbUser.getIdToken(true)
      console.log('[Google] 4 — token refreshed, reading authorized_editors')

      const snap = await getDoc(doc(db, SITE_CONFIG_COLL, AUTHORIZED_EDITORS_DOC))
      console.log('[Google] 5 — authorized_editors read, exists:', snap.exists())
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
      console.log('[Google] 6 — starting session for', user.email)
      startSession(user)
      onSuccess?.()
      setOnSuccess(null)
      console.log('[Google] 7 — sign-in complete ✓')
      return { error: null }
    } catch (e) {
      console.error('[Google] ✗ caught error — code:', e.code, '| message:', e.message, '| full:', e)
      if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') return { error: null }
      if (e.code === 'auth/unauthorized-domain') return { error: 'Domain not authorized. Add this domain in Firebase Console → Auth → Settings → Authorized Domains.' }
      if (e.code === 'auth/operation-not-allowed') return { error: 'Google sign-in is not enabled. Enable it in Firebase Console → Auth → Sign-in method.' }
      if (e.code === 'auth/popup-blocked') return { error: 'Popup blocked. Allow popups for this site and try again.' }
      if (e.code === 'permission-denied') return { error: 'Firestore permission denied reading the editors list. Make sure Firestore rules are deployed: firebase deploy --only firestore:rules' }
      return { error: `Sign-in failed (${e.code ?? e.message}). Check the browser console for details.` }
    }
  }, [onSuccess, startSession])

  // ── Email magic link (passwordless) ──────────────────────────────────────
  const sendMagicLink = useCallback(async (email) => {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) return { error: 'Please enter your email address.' }

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
    // Magic link is still completing — don't interrupt with the login modal.
    // isEditMode will flip to true once the async resolves, which unmounts AdminGate.
    if (magicLinkPending) return
    // Firebase Auth session still alive → re-enter instantly, no modal
    if (currentUser && hasFirebaseAuth) { setIsEditMode(true); cb?.(); return }
    setOnSuccess(() => cb ?? null)
    setShowModal(true)
  }, [isEditMode, currentUser, hasFirebaseAuth, magicLinkPending])

  // ── Full sign-out (clears everything — used by inactivity timer + manual) ─
  // MUST be declared before `lock` — lock's dependency array references it,
  // and const declarations are in the TDZ until their initializer runs.
  const signOutFully = useCallback(async () => {
    clearTimeout(inactivityTimer.current)
    clearInterval(countdownTimer.current)
    setIsEditMode(false)
    setCurrentUser(null)
    setInactivityWarning(false)
    localStorage.removeItem(STORAGE_KEY)
    try { await signOut(auth) } catch { /* ignore */ }
  }, [])

  // ── Exit edit mode ────────────────────────────────────────────────────────
  // Firebase Auth sessions (Google / magic link): keep session alive so the
  // editor can preview the site and resume without re-authenticating.
  // Password/admin sessions: sign out fully (QA role, no persistent session).
  const lock = useCallback(() => {
    if (hasFirebaseAuth) {
      setIsEditMode(false)   // just toggle the UI — session stays alive
    } else {
      signOutFully()         // admin/password: clean exit
    }
  }, [hasFirebaseAuth, signOutFully])

  // ── Inactivity timer — 15 min no activity → warning → 60s → auto sign-out ─
  const resetInactivity = useCallback(() => {
    clearTimeout(inactivityTimer.current)
    clearInterval(countdownTimer.current)
    setInactivityWarning(false)
    inactivityTimer.current = setTimeout(() => {
      setInactivityWarning(true)
      setWarnCountdown(WARN_SECS)
      let secs = WARN_SECS
      countdownTimer.current = setInterval(() => {
        secs -= 1
        setWarnCountdown(secs)
        if (secs <= 0) {
          clearInterval(countdownTimer.current)
          signOutFully()
        }
      }, 1000)
    }, INACTIVITY_MS)
  }, [signOutFully])

  // Start/stop inactivity tracking — Firebase Auth sessions only
  // Admin/password sessions don't get the timer (QA role, short-lived by design)
  useEffect(() => {
    if (!currentUser || !hasFirebaseAuth) {
      clearTimeout(inactivityTimer.current)
      clearInterval(countdownTimer.current)
      return
    }
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart']
    // Throttle to avoid hammering resetInactivity on every mouse move
    let throttle = null
    const handler = () => {
      if (throttle) return
      throttle = setTimeout(() => { throttle = null }, 2000)
      resetInactivity()
    }
    events.forEach(e => window.addEventListener(e, handler, { passive: true }))
    resetInactivity() // start the initial timer
    return () => {
      events.forEach(e => window.removeEventListener(e, handler))
      clearTimeout(inactivityTimer.current)
      clearInterval(countdownTimer.current)
    }
  }, [currentUser, hasFirebaseAuth, resetInactivity])

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
      hasFirebaseAuth,
      magicLinkPending,
      showModal,
      requestAuth,
      unlock,
      signInWithGoogle,
      sendMagicLink,
      lock,
      signOutFully,
      dismissModal,
      recordSave,
    }}>
      {children}
      {showModal && <LoginModal />}
      {inactivityWarning && (
        <InactivityWarning
          countdown={warnCountdown}
          onStay={() => resetInactivity()}
          onSignOut={signOutFully}
        />
      )}
    </EditModeContext.Provider>
  )
}

export const useEditMode = () => useContext(EditModeContext)

// ── Login Modal ───────────────────────────────────────────────────────────────
function LoginModal() {
  const { unlock, sendMagicLink, dismissModal } = useEditMode()

  const [username,    setUsername]    = useState('')
  const [password,    setPassword]    = useState('')
  const [pwError,     setPwError]     = useState('')
  const [linkEmail,   setLinkEmail]   = useState('')
  const [linkError,   setLinkError]   = useState('')
  const [linkSent,    setLinkSent]    = useState(false)
  const [linkLoading, setLinkLoading] = useState(false)

  const handlePassword = (e) => {
    e.preventDefault()
    setPwError('')
    const ok = unlock(username, password)
    if (!ok) setPwError('Incorrect credentials.')
  }

  const handleMagicLink = async (e) => {
    e.preventDefault()
    setLinkLoading(true)
    setLinkError('')
    const { error: err } = await sendMagicLink(linkEmail)
    setLinkLoading(false)
    if (err) {
      setLinkError(err)
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

        {/* ── 1. Email magic link ── */}
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
            {linkError && (
              <p style={{ fontSize: '0.8rem', color: '#C4604A', margin: '0.5rem 0 0' }}>{linkError}</p>
            )}
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
          {pwError && (
            <p style={{ fontSize: '0.8rem', color: '#C4604A', margin: 0 }}>{pwError}</p>
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

// ── Inactivity Warning Modal ──────────────────────────────────────────────────
function InactivityWarning({ countdown, onStay, onSignOut }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(17,30,28,0.7)', backdropFilter: 'blur(4px)',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        background: '#F9F8F6', borderRadius: '1rem',
        padding: '2rem 2.2rem', width: 340, maxWidth: '90vw',
        boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
        border: '1px solid rgba(23,47,45,0.12)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.6rem' }}>⏱</div>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.3rem', color: '#172f2d', marginBottom: '0.5rem' }}>
          Still there?
        </div>
        <p style={{ fontSize: '0.9rem', color: '#5a7a76', marginBottom: '1.4rem', lineHeight: 1.5 }}>
          You'll be signed out automatically in{' '}
          <strong style={{ color: countdown <= 10 ? '#c0392b' : '#172f2d' }}>{countdown}s</strong>{' '}
          due to inactivity.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            onClick={onSignOut}
            style={{
              padding: '0.55rem 1.1rem', borderRadius: '0.5rem',
              border: '1.5px solid #d0c9c0', background: 'transparent',
              color: '#5a7a76', fontSize: '0.85rem', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Sign out
          </button>
          <button
            onClick={onStay}
            style={{
              padding: '0.55rem 1.4rem', borderRadius: '0.5rem',
              border: 'none', background: '#224e4a',
              color: '#fff', fontSize: '0.85rem', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Stay signed in
          </button>
        </div>
      </div>
    </div>
  )
}

