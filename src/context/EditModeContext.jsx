/**
 * EditModeContext.jsx — Luminal Journeys
 * Provides password-gated edit mode for client content editing.
 * Session persists 30 days in localStorage so the client doesn't
 * have to re-enter the password on every visit.
 */

import { createContext, useContext, useState, useEffect } from 'react'

const STORAGE_KEY = 'lj_edit_session'
const SESSION_MS  = 30 * 24 * 60 * 60 * 1000 // 30 days

const EditModeContext = createContext({
  isEditMode:            false,
  showPasswordPrompt:    false,
  setShowPasswordPrompt: () => {},
  unlock:                () => false,
  resumeSession:         () => false,
  lock:                  () => {},
})

export function EditModeProvider({ children }) {
  const [isEditMode,         setIsEditMode]         = useState(false)
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false)

  // On mount: clean up expired sessions only.
  // User must click "Edit" to enter — no auto-enter.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const { expiry } = JSON.parse(raw)
        if (Date.now() >= expiry) localStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  // Verify password and start session
  const unlock = (password) => {
    const correct = import.meta.env.VITE_EDIT_PASSWORD ?? 'luminal2026'
    if (password === correct) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ expiry: Date.now() + SESSION_MS }))
      setIsEditMode(true)
      setShowPasswordPrompt(false)
      return true
    }
    return false
  }

  // Re-enter edit mode using an existing valid session (no password re-entry)
  const resumeSession = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const { expiry } = JSON.parse(raw)
        if (Date.now() < expiry) {
          setIsEditMode(true)
          return true
        }
      }
    } catch { /* ignore */ }
    return false
  }

  // Exit edit mode but keep session alive for next visit
  const lock = () => setIsEditMode(false)

  return (
    <EditModeContext.Provider value={{
      isEditMode, showPasswordPrompt, setShowPasswordPrompt,
      unlock, resumeSession, lock,
    }}>
      {children}
    </EditModeContext.Provider>
  )
}

export const useEditMode = () => useContext(EditModeContext)
