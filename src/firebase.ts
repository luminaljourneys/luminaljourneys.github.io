import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { initializeFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

const app = initializeApp(firebaseConfig)
export const analytics = getAnalytics(app)

// In development, force REST-based transport (long polling) instead of
// WebChannel (gRPC streaming). This lets Playwright intercept Firestore
// requests at the network layer — WebChannel responses are too complex to
// mock correctly. Has no effect on production (PROD uses WebChannel).
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: import.meta.env.DEV,
})

export const auth = getAuth(app)
export default app
