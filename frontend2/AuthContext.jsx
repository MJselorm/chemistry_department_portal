import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  getMultiFactorResolver,
  onIdTokenChanged,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  TotpMultiFactorGenerator,
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

  const refreshProfile = useCallback(async () => {
    const firebaseUser = firebaseAuth.currentUser
    if (!firebaseUser) return null
    tokenStore.set(await firebaseUser.getIdToken())
    const profile = await api.get(ENDPOINTS.me)
    setUser(profile)
    return profile
  }, [])

  useEffect(() => {
    const refreshWhenActive = () => {
      if (!document.hidden && firebaseAuth.currentUser) refreshProfile().catch(() => {})
    }
    window.addEventListener('focus', refreshWhenActive)
    document.addEventListener('visibilitychange', refreshWhenActive)
    return () => {
      window.removeEventListener('focus', refreshWhenActive)
      document.removeEventListener('visibilitychange', refreshWhenActive)
    }
  }, [refreshProfile])

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

  const reauthenticateForRoleApproval = useCallback(async () => {
    const firebaseUser = firebaseAuth.currentUser
    if (!firebaseUser) throw new Error('Your session has expired. Sign in again.')

    const providers = firebaseUser.providerData.map((provider) => provider.providerId)
    if (providers.includes('password')) {
      throw new Error('Enter your password in the approval form to continue.')
    }
    if (!providers.includes('google.com')) {
      throw new Error('Re-authentication is not supported for this sign-in provider.')
    }
    let mfaError
    try {
      await reauthenticateWithPopup(firebaseUser, googleProvider)
    } catch (error) {
      if (error?.code !== 'auth/multi-factor-auth-required') throw error
      mfaError = error
    }
    if (!mfaError) {
      throw new Error('Enroll a Firebase phone or authenticator-app MFA factor before approving role changes.')
    }
    const resolver = getMultiFactorResolver(firebaseAuth, mfaError)
    return { resolver, hints: resolver.hints }
  }, [])

  const reauthenticateWithPasswordForRoleApproval = useCallback(async (password) => {
    const firebaseUser = firebaseAuth.currentUser
    if (!firebaseUser?.email) throw new Error('Your session has expired. Sign in again.')
    try {
      await reauthenticateWithCredential(
        firebaseUser,
        EmailAuthProvider.credential(firebaseUser.email, password),
      )
    } catch (error) {
      if (error?.code !== 'auth/multi-factor-auth-required') throw error
      const resolver = getMultiFactorResolver(firebaseAuth, error)
      return { resolver, hints: resolver.hints }
    }
    throw new Error('Enroll a Firebase phone or authenticator-app MFA factor before approving role changes.')
  }, [])

  const sendRoleApprovalSms = useCallback(async (resolver, factorUid) => {
    const hint = resolver.hints.find((item) => item.uid === factorUid)
    if (!hint || hint.factorId !== 'phone') throw new Error('The selected MFA method is unavailable.')
    const recaptchaContainer = document.createElement('div')
    document.body.appendChild(recaptchaContainer)
    const recaptcha = new RecaptchaVerifier(firebaseAuth, recaptchaContainer, { size: 'invisible' })
    try {
      return await new PhoneAuthProvider(firebaseAuth).verifyPhoneNumber(
        { multiFactorHint: hint, session: resolver.session },
        recaptcha,
      )
    } finally {
      recaptcha.clear()
      recaptchaContainer.remove()
    }
  }, [])

  const completeRoleApprovalMfa = useCallback(async (resolver, factorUid, code, verificationId) => {
    const hint = resolver.hints.find((item) => item.uid === factorUid)
    if (!hint) throw new Error('The selected MFA method is unavailable.')
    let assertion
    if (hint.factorId === 'totp') {
      assertion = TotpMultiFactorGenerator.assertionForSignIn(hint.uid, code.trim())
    } else if (hint.factorId === 'phone' && verificationId) {
      assertion = PhoneMultiFactorGenerator.assertion(
        PhoneAuthProvider.credential(verificationId, code.trim()),
      )
    } else {
      throw new Error('The selected MFA method is not supported.')
    }
    await resolver.resolveSignIn(assertion)
    const firebaseUser = firebaseAuth.currentUser
    if (!firebaseUser) throw new Error('Your session has expired. Sign in again.')
    tokenStore.set(await firebaseUser.getIdToken(true))
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
      reauthenticateForRoleApproval,
      reauthenticateWithPasswordForRoleApproval,
      sendRoleApprovalSms,
      completeRoleApprovalMfa,
      requestPasswordReset,
      updateProfile,
      refreshProfile,
      logout,
    }),
    [user, booting, login, loginWithGoogle, register, resendVerificationEmail, reauthenticateForRoleApproval, reauthenticateWithPasswordForRoleApproval, sendRoleApprovalSms, completeRoleApprovalMfa, requestPasswordReset, updateProfile, refreshProfile, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
