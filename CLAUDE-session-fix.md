# Claude Code — Session Persistence Fix
## Luminal Journeys · `/Users/springsparrow/01-tie-babeh-apps/luminaljourneys`

## The Bug
Magic link editors (Tie, Sarah, Diane, Wouter) must re-authenticate every time they exit
edit mode and try to re-enter. The session should persist — they should click "Edit Site"
and be back in edit mode immediately without a new magic link.

## Root Cause
`src/context/EditModeContext.jsx` — the `requestAuth` function:

```js
if (currentUser && hasFirebaseAuth) { setIsEditMode(true); cb?.(); return }
```

This correctly re-enters without a modal IF `hasFirebaseAuth` is true. But `hasFirebaseAuth`
starts as `false` and only becomes true after `onAuthStateChanged` fires. Firebase Auth
rehydrates from IndexedDB asynchronously — it takes ~300-500ms on page load.

If the editor clicks "Edit Site" before `onAuthStateChanged` fires, `hasFirebaseAuth` is
still false, the check fails, and the modal shows unnecessarily.

## The Fix
Add an `authReady` flag that becomes true once `onAuthStateChanged` fires its first event.
Block `requestAuth` from showing the modal until auth is ready. If auth becomes ready and
the user is already authenticated, re-enter edit mode automatically.

### 1. Add `authReady` state (after `hasFirebaseAuth` declaration):
```js
const [authReady, setAuthReady] = useState(false)
```

### 2. Update the `onAuthStateChanged` effect to set `authReady`:
```js
useEffect(() => {
  const unsub = onAuthStateChanged(auth, (fbUser) => {
    setHasFirebaseAuth(!!fbUser)
    setAuthReady(true)  // ← ADD THIS LINE
    if (fbUser) {
      // If user is Firebase-authenticated and has a valid localStorage session,
      // restore edit mode automatically without requiring modal
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const { expiry, user } = JSON.parse(raw)
          if (Date.now() < expiry && user) {
            setCurrentUser(user)
            setIsEditMode(true)  // ← auto-restore edit mode
          }
        }
      } catch { /* ignore */ }
    }
  })
  return unsub
}, [])
```

### 3. Update `requestAuth` to wait for auth ready:
```js
const requestAuth = useCallback((cb) => {
  if (isEditMode) { cb?.(); return }
  if (magicLinkPending) return
  // Wait for Firebase Auth to rehydrate before showing modal
  if (!authReady) return
  // Firebase Auth session alive → re-enter instantly, no modal
  if (currentUser && hasFirebaseAuth) { setIsEditMode(true); cb?.(); return }
  setOnSuccess(() => cb ?? null)
  setShowModal(true)
}, [isEditMode, currentUser, hasFirebaseAuth, magicLinkPending, authReady])
```

### 4. Export `authReady` from the provider:
```jsx
<EditModeContext.Provider value={{
  isEditMode,
  currentUser,
  hasFirebaseAuth,
  authReady,         // ← ADD
  magicLinkPending,
  ...
}}>
```

## Also Fix: SESSION_MS
Currently set to 30 days. That's correct — do not reduce it.
The `INACTIVITY_MS` is 15 minutes — also correct, leave it.

## Test After Fix
1. Open admin.luminaljourneys.com
2. Click "Edit Site" → send magic link → click link → verify in edit mode
3. Click "Exit Edit Mode" (the lock/exit button)
4. Click "Edit Site" again
5. Should re-enter edit mode IMMEDIATELY — no modal, no new magic link
6. Repeat steps 3-5 several times to confirm persistence

## What NOT to change
- The 30-day SESSION_MS — correct
- The 15-min INACTIVITY_MS — correct  
- The `lock()` function logic — correct
- The magic link flow itself — correct
- Platform UI buttons (Edit Site, Publish Live, Sign Out) — these are NEVER
  wrapped in EditableContent and must never be editable by the client
