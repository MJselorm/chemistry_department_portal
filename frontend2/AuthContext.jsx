import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth'
import { api, tokenStore } from './client'
import { ENDPOINTS } from './endpoints'
import { firebaseAuth, googleProvider } from './firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [booting, setBooting] = useState(true)

  // Firebase restores its own browser session, then the backend verifies and syncs its ID token.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (!firebaseUser) {
        tokenStore.clear()
        setUser(null)
        setBooting(false)
        return
      }
      try {
        tokenStore.set(await firebaseUser.getIdToken())
        await api.post(ENDPOINTS.sync)
        setUser(await api.get(ENDPOINTS.me))
      } catch {
        tokenStore.clear()
        setUser(null)
      } finally {
        setBooting(false)
      }
    })
    return unsubscribe
  }, [])

  const login = useCallback(async (email, password) => {
    const credential = await signInWithEmailAndPassword(firebaseAuth, email, password)
    tokenStore.set(await credential.user.getIdToken())
    await api.post(ENDPOINTS.sync)
    const profile = await api.get(ENDPOINTS.me)
    setUser(profile)
    return profile
  }, [])

  const loginWithGoogle = useCallback(async () => {
    const credential = await signInWithPopup(firebaseAuth, googleProvider)
    tokenStore.set(await credential.user.getIdToken())
    await api.post(ENDPOINTS.sync)
    const profile = await api.get(ENDPOINTS.me)
    setUser(profile)
    return profile
  }, [])

  const updateProfile = useCallback(async (fullName) => {
    const updated = await api.patch(ENDPOINTS.me, { full_name: fullName })
    setUser(updated)
    return updated
  }, [])

  const logout = useCallback(() => {
    signOut(firebaseAuth)
    tokenStore.clear()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, booting, login, loginWithGoogle, updateProfile, logout }),
    [user, booting, login, loginWithGoogle, updateProfile, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
