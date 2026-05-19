/**
 * EditModeContext.jsx — Luminal Journeys
 *
 * Auth system for the entire site. Two paths into edit mode:
 *
 *   1. Google Sign-In  — checks Firestore site_config/authorized_editors
 *      { emails: ["keeya@...", "user@..."] } before granting access.
 *      Identity (displayName, email, photoURL) is preserved as currentUser.
 *
 *   2. Password login  — username "admin" + VITE_EDIT_PASSWORD, for QA.
 *      currentUser = { displayName: 'Admin', email: 'admin', photoURL: null }
 *
 * Exports:
 *   isEditMode      — boolean
 *   currentUser     — { displayName, email, photoURL } | null
 *   requestAuth()   — show login modal from anywhere
 *   lock()          — exit edit mode
 *   recordSave()    — write site_config/meta with last-saved timestamp + author
 *   signInWithGoogle()
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'
import {
  SITE_CONFIG_COLL,
  AUTHORIZED_EDITORS_DOC,
  SITE_META_DOC,
} from '../lib/collections'

const STORAGE_KEY = 'lj_edit_session'
const SESSION_MS  = 30 * 24 * 60 * 60 * 1000 // 30 days

const EditModeContext = createContext({
  isEditMode:       false,
  currentUser:      null,
  requestAuth:      () => {},
  unlock:           () => false,
  lock:             () => {},
  signInWithGoogle: async () => ({ error: null }),
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
  }, [])

  // ── Start a session (shared by both auth paths) ──────────────────────────
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
      const result   = await signInWithPopup(auth, provider)
      const fbUser   = result.user

      // Check authorized editors list in Firestore
      const snap = await getDoc(doc(db, SITE_CONFIG_COLL, AUTHORIZED_EDITORS_DOC))
      const authorized = snap.exists()
        ? (snap.data().emails ?? []).map(e => e.toLowerCase())
        : []

      if (!authorized.includes(fbUser.email.toLowerCase())) {
        await signOut(auth)
        return { error: `${fbUser.email} is not authorized. Ask your admin to add you.` }
      }

      const user = {
        displayName: fbUser.displayName || fbUser.email.split('@')[0],
        email:       fbUser.email,
        photoURL:    fbUser.photoURL || null,
      }
      startSession(user)
      onSuccess?.()
      setOnSuccess(null)
      return { error: null }
    } catch (e) {
      console.error('[EditMode] Google sign-in error:', e.code, e.message)
      if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') return { error: null }
      if (e.code === 'auth/unauthorized-domain') return { error: 'Domain not authorized. In Firebase Console → Auth → Settings → Authorized Domains, add luminaljourneys-staging.web.app' }
      if (e.code === 'auth/operation-not-allowed') return { error: 'Google sign-in is not enabled. In Firebase Console → Auth → Sign-in method, enable Google.' }
      if (e.code === 'auth/popup-blocked') return { error: 'Popup was blocked by your browser. Allow popups for this site and try again.' }
      return { error: `Sign-in failed (${e.code ?? e.message}). Check the browser console for details.` }
    }
  }, [onSuccess, startSession])

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
  const { unlock, signInWithGoogle, dismissModal } = useEditMode()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handlePassword = (e) => {
    e.preventDefault()
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
        padding: '2.4rem 2.5rem', width: 360, maxWidth: '92vw',
        boxShadow: '0 24px 80px rgba(0,0,0,0.22)',
        border: '1px solid rgba(23,47,45,0.12)',
      }}>
        <div style={{
          fontFamily: "'DM Serif Display', Georgia, serif",
          fontSize: '1.5rem', color: '#172f2d', marginBottom: '0.3rem',
        }}>
          Editor Access
        </div>
        <p style={{ fontSize: '0.83rem', color: '#89a99e', marginBottom: '1.6rem', lineHeight: 1.5 }}>
          Sign in to edit content on this page.
        </p>

        {/* ── Google Sign-In ── */}
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

        {/* ── Divider ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.2rem' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(23,47,45,0.12)' }} />
          <span style={{ fontSize: '0.72rem', color: '#89a99e', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            or
          </span>
          <div style={{ flex: 1, height: 1, background: 'rgba(23,47,45,0.12)' }} />
        </div>

        {/* ── Password login ── */}
        <form onSubmit={handlePassword} style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
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
          }}>
            Sign in
          </button>
        </form>
      </div>
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
