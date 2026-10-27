import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  onIdTokenChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { api, tokenStore } from './client'
import { ENDPOINTS } from './endpoints'
import { firebaseAuth, googleProvider } from './firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [booting, setBooting] = useState(true)
  // Signing in triggers onIdTokenChanged as well as the explicit login call.
  // Share the in-flight profile request so those two paths cannot race each other.
  const profileRequests = useRef(new Map())

  const syncProfile = useCallback(async (firebaseUser) => {
    const token = await firebaseUser.getIdToken()
    const requestKey = `${firebaseUser.uid}:${token}`
    const existingRequest = profileRequests.current.get(requestKey)
    if (existingRequest) return existingRequest

    const request = (async () => {
      tokenStore.set(token)
      // The sync endpoint already returns the current profile. Reuse it so
      // session restoration and sign-in need one backend round trip, not two.
      return api.post(ENDPOINTS.sync)
    })()
    profileRequests.current.set(requestKey, request)
    try {
      return await request
    } finally {
      profileRequests.current.delete(requestKey)
    }
  }, [])

  // Firebase restores its own browser session, then the backend verifies and syncs its ID token.
  useEffect(() => {
    const unsubscribe = onIdTokenChanged(firebaseAuth, async (firebaseUser) => {
      if (!firebaseUser) {
        tokenStore.clear()
        setUser(null)
        setBooting(false)
        return
      }
      try {
        setUser(await syncProfile(firebaseUser))
      } catch {
        tokenStore.clear()
        setUser(null)
      } finally {
        setBooting(false)
      }
    })
    return unsubscribe
  }, [syncProfile])

  useEffect(() => {
    const expireSession = async () => {
      tokenStore.clear()
      setUser(null)
      try { await signOut(firebaseAuth) } catch { /* Local session is already cleared. */ }
    }
    window.addEventListener('chemhub:session-expired', expireSession)
    return () => window.removeEventListener('chemhub:session-expired', expireSession)
  }, [])

  const login = useCallback(async (email, password, keepSignedIn = true) => {
    await setPersistence(
      firebaseAuth,
      keepSignedIn ? browserLocalPersistence : browserSessionPersistence
    )
    let authenticatedUser = null
    try {
      const credential = await signInWithEmailAndPassword(firebaseAuth, email, password)
      authenticatedUser = credential.user
      const profile = await syncProfile(credential.user)
      setUser(profile)
      return profile
    } catch (error) {
      // A Firebase session without a portal profile is not a usable login.
      // Clear it so retrying after a backend/configuration fix starts cleanly.
      tokenStore.clear()
      setUser(null)
      if (firebaseAuth.currentUser?.uid === authenticatedUser?.uid) await signOut(firebaseAuth)
      throw error
    }
  }, [syncProfile])

  const loginWithGoogle = useCallback(async (keepSignedIn = true) => {
    await setPersistence(
      firebaseAuth,
      keepSignedIn ? browserLocalPersistence : browserSessionPersistence
    )
    let authenticatedUser = null
    try {
      const credential = await signInWithPopup(firebaseAuth, googleProvider)
      authenticatedUser = credential.user
      const profile = await syncProfile(credential.user)
      setUser(profile)
      return profile
    } catch (error) {
      tokenStore.clear()
      setUser(null)
      if (firebaseAuth.currentUser?.uid === authenticatedUser?.uid) await signOut(firebaseAuth)
      throw error
    }
  }, [syncProfile])

  const register = useCallback(async (email, password) => {
    const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password)
    try {
      try {
        await sendEmailVerification(credential.user)
      } catch (error) {
        const verificationError = new Error('Verification email delivery failed.', { cause: error })
        verificationError.code = error.code
        verificationError.emailVerificationFailed = true
        throw verificationError
      }
    } finally {
      if (firebaseAuth.currentUser?.uid === credential.user.uid) {
        tokenStore.clear()
        setUser(null)
        await signOut(firebaseAuth)
      }
    }
  }, [])

  const resendVerificationEmail = useCallback(async (email, password) => {
    const credential = await signInWithEmailAndPassword(firebaseAuth, email, password)
    try {
      await sendEmailVerification(credential.user)
    } finally {
      if (firebaseAuth.currentUser?.uid === credential.user.uid) {
        tokenStore.clear()
        setUser(null)
        await signOut(firebaseAuth)
      }
    }
  }, [])

  const updateProfile = useCallback(async (fullName) => {
    const updated = await api.patch(ENDPOINTS.me, { full_name: fullName })
    setUser(updated)
    return updated
  }, [])

  const requestPasswordReset = useCallback(async (email) => {
    await sendPasswordResetEmail(firebaseAuth, email)
  }, [])

  const logout = useCallback(async () => {
    try {
      await signOut(firebaseAuth)
    } finally {
      tokenStore.clear()
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      booting,
      login,
      loginWithGoogle,
      register,
      resendVerificationEmail,
      requestPasswordReset,
      updateProfile,
      logout,
    }),
    [user, booting, login, loginWithGoogle, register, resendVerificationEmail, requestPasswordReset, updateProfile, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
