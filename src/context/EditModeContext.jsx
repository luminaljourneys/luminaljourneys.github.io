/**
 * EditModeContext.jsx — Luminal Journeys
 *
 * Single auth system for the entire site.
 * One login (username + password) unlocks:
 *   • Inline content editing (EditableContent pencil icons)
 *   • Admin dashboard (form builder, pages, publish)
 *   • Staging banner + Publish Live button
 *
 * Session persists 30 days in localStorage.
 * Call requestAuth() from anywhere to show the login modal.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'lj_edit_session'
const SESSION_MS  = 30 * 24 * 60 * 60 * 1000 // 30 days
const ADMIN_USER  = 'admin'

const EditModeContext = createContext({
  isEditMode:   false,
  requestAuth:  () => {},   // show the login modal from anywhere
  unlock:       () => false,
  lock:         () => {},
})

export function EditModeProvider({ children }) {
  const [isEditMode,  setIsEditMode]  = useState(false)
  const [showModal,   setShowModal]   = useState(false)
  const [onSuccess,   setOnSuccess]   = useState(null) // optional callback after login

  // On mount: restore a valid session automatically
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const { expiry } = JSON.parse(raw)
        if (Date.now() < expiry) {
          setIsEditMode(true)
        } else {
          localStorage.removeItem(STORAGE_KEY)
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  // Show the login modal. Optional callback fires after successful login.
  const requestAuth = useCallback((cb) => {
    if (isEditMode) {
      cb?.()
      return
    }
    setOnSuccess(() => cb ?? null)
    setShowModal(true)
  }, [isEditMode])

  // Verify username + password and start session
  const unlock = useCallback((username, password) => {
    const correct = import.meta.env.VITE_EDIT_PASSWORD ?? 'luminal2026'
    if (username === ADMIN_USER && password === correct) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ expiry: Date.now() + SESSION_MS }))
      setIsEditMode(true)
      setShowModal(false)
      onSuccess?.()
      setOnSuccess(null)
      return true
    }
    return false
  }, [onSuccess])

  // Exit edit mode — session stays alive for next visit
  const lock = useCallback(() => {
    setIsEditMode(false)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const dismissModal = useCallback(() => {
    setShowModal(false)
    setOnSuccess(null)
  }, [])

  return (
    <EditModeContext.Provider value={{
      isEditMode,
      showModal,
      requestAuth,
      unlock,
      lock,
      dismissModal,
    }}>
      {children}
    </EditModeContext.Provider>
  )
}

export const useEditMode = () => useContext(EditModeContext)
