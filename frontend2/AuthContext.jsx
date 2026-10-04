import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  browserLocalPersistence,
  browserSessionPersistence,
  onIdTokenChanged,
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
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null)
  const [photoRevision, setPhotoRevision] = useState(0)
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
      await api.post(ENDPOINTS.sync)
      return api.get(ENDPOINTS.me)
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
    if (!user?.has_profile_photo) {
      setProfilePhotoUrl(null)
      return undefined
    }
    const controller = new AbortController()
    let objectUrl = null
    api.blob(ENDPOINTS.myProfilePhoto, { signal: controller.signal })
      .then(({ blob }) => {
        objectUrl = URL.createObjectURL(blob)
        setProfilePhotoUrl(objectUrl)
      })
      .catch((error) => {
        if (error?.name !== 'AbortError') setProfilePhotoUrl(null)
      })
    return () => {
      controller.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [user?.id, user?.has_profile_photo, photoRevision])

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

  const updateProfile = useCallback(async (changes) => {
    const updated = await api.patch(ENDPOINTS.me, changes)
    setUser(updated)
    return updated
  }, [])

  const uploadProfilePhoto = useCallback(async (file) => {
    const updated = await api.upload(ENDPOINTS.myProfilePhoto, file)
    setUser(updated)
    setPhotoRevision((value) => value + 1)
    return updated
  }, [])

  const removeProfilePhoto = useCallback(async () => {
    await api.del(ENDPOINTS.myProfilePhoto)
    setUser((current) => current ? { ...current, has_profile_photo: false } : current)
    setPhotoRevision((value) => value + 1)
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
    () => ({ user, booting, profilePhotoUrl, login, loginWithGoogle, requestPasswordReset, updateProfile, uploadProfilePhoto, removeProfilePhoto, logout }),
    [user, booting, profilePhotoUrl, login, loginWithGoogle, requestPasswordReset, updateProfile, uploadProfilePhoto, removeProfilePhoto, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
