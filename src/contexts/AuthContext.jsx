import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'
import { syncService } from '../services/syncService'

const AuthContext = createContext(null)

// Export so App.jsx can show a setup screen
export { supabaseConfigured }

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Single place to translate raw Supabase / network errors into friendly messages.
// Previously this logic was copy-pasted (inconsistently) into 5 functions.
function normalizeAuthError(error, context = 'generic') {
  const msg = (error?.message || '').toLowerCase()

  if (msg.includes('failed to fetch') || msg.includes('network error') || msg.includes('load failed')) {
    return new Error('Connection error: Unable to reach the server. Please check your internet connection.')
  }
  if (msg.includes('rate limit') || msg.includes('rate_limit') || msg.includes('too many') || msg.includes('exceeded')) {
    return context === 'register'
      ? new Error('Rate limit exceeded: Too many signup requests. Please wait a few minutes, use another email, or continue as a Guest.')
      : new Error('Too many requests. Please wait a few minutes before trying again.')
  }
  if (context === 'login') {
    if (msg.includes('invalid login') || msg.includes('invalid credentials') || msg.includes('invalid email') || msg.includes('wrong password')) {
      return new Error('Incorrect email or password. Please check and try again.')
    }
    if (msg.includes('email not confirmed')) {
      return new Error('Please verify your email address before signing in. Check your inbox.')
    }
    if (msg.includes('user not found') || msg.includes('no user')) {
      return new Error('No account found with this email. Please register first.')
    }
  }
  return error instanceof Error ? error : new Error(error?.message || 'Something went wrong. Please try again.')
}

function validateEmail(email) {
  if (!email || !EMAIL_REGEX.test(email.trim())) {
    throw new Error('Please enter a valid email address.')
  }
  return email.trim()
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isGuest, setIsGuest] = useState(false)
  const [loading, setLoading] = useState(true)
  const [passwordRecoveryMode, setPasswordRecoveryMode] = useState(() => {
    const hash = window.location.hash || ''
    const search = window.location.search || ''
    return hash.includes('type=recovery') || search.includes('type=recovery')
  })

  // Tracks which user id we've already pulled data for, so the auth listener
  // and login()/register() don't trigger a duplicate sync.
  const syncedUserIdRef = useRef(null)

  // Pull remote data exactly once per signed-in user
  const pullUserData = async (userId) => {
    if (!userId || syncedUserIdRef.current === userId) return
    syncedUserIdRef.current = userId
    try {
      await syncService.pull(userId)
    } catch (err) {
      // Sync failure must never block auth — log it and let the app load local data
      console.error('Data sync failed:', err)
    }
  }

  useEffect(() => {
    // Clear any old permanent guest flag from localStorage (migration fix)
    localStorage.removeItem('bible_guest')

    let mounted = true

    if (!supabaseConfigured) {
      // No env vars — check sessionStorage for guest (clears on tab/browser close)
      if (sessionStorage.getItem('bible_guest')) setIsGuest(true)
      setLoading(false)
      return
    }

    // 1. Restore existing Supabase session on mount
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!mounted) return

        if (session?.user) {
          await pullUserData(session.user.id)
          if (!mounted) return
          setUser(session.user)
          setIsGuest(false)
        } else if (sessionStorage.getItem('bible_guest')) {
          // No real session — guest mode is active for THIS browser session only
          setIsGuest(true)
        }
        // Otherwise: stay unauthenticated → shows auth screen
      } catch (err) {
        console.error('Auth initialization failed:', err)
      } finally {
        // CRITICAL: always resolve loading, even if getSession/sync throws,
        // otherwise the app hangs on the loading screen forever.
        if (mounted) setLoading(false)
      }
    }

    initAuth()

    // 2. Listen for auth state changes (login, logout, token refresh, password recovery)
    // NOTE: Do NOT await Supabase calls directly inside this callback — it can
    // deadlock the auth client. Defer async work with setTimeout(..., 0).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return

      if (event === 'PASSWORD_RECOVERY') {
        // User clicked the reset link in their email — enter recovery mode
        setPasswordRecoveryMode(true)
        setUser(session?.user ?? null)
        setIsGuest(false)
        sessionStorage.removeItem('bible_guest')
      } else if (session?.user) {
        setUser(session.user)
        setIsGuest(false)
        sessionStorage.removeItem('bible_guest')
        // Covers OAuth, magic links, email-confirmation links, cross-tab sign-in —
        // paths that previously never synced the user's remote data.
        const userId = session.user.id
        setTimeout(() => { pullUserData(userId) }, 0)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        syncedUserIdRef.current = null
      } else {
        setUser(null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Sign up with email + password, storing name in user_metadata
  const register = async (name, email, password) => {
    if (!supabaseConfigured) throw new Error('Supabase is not configured. Please add your .env file.')
    const cleanEmail = validateEmail(email)

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: { name: name?.trim() || '' },
          emailRedirectTo: window.location.origin
        }
      })
      if (error) throw error

      // data.session exists only when email confirmation is disabled
      if (data.session && data.user) {
        await pullUserData(data.user.id)
        setUser(data.user)
        setIsGuest(false)
        sessionStorage.removeItem('bible_guest')
      }
      return data.user
    } catch (err) {
      throw normalizeAuthError(err, 'register')
    }
  }

  // Sign in with email + password
  const login = async (email, password) => {
    if (!supabaseConfigured) throw new Error('Supabase is not configured. Please add your .env file.')
    const cleanEmail = validateEmail(email)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password })
      if (error) throw error

      if (data.user) {
        await pullUserData(data.user.id)
        setUser(data.user)
        setIsGuest(false)
      }
      sessionStorage.removeItem('bible_guest')
      return data.user
    } catch (err) {
      throw normalizeAuthError(err, 'login')
    }
  }

  // Send a password reset email
  const resetPassword = async (email) => {
    if (!supabaseConfigured) throw new Error('Supabase is not configured.')
    const cleanEmail = validateEmail(email)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: window.location.origin + window.location.pathname
      })
      if (error) throw error
    } catch (err) {
      throw normalizeAuthError(err, 'reset')
    }
  }

  // Update password (used after user clicks reset link in email)
  const updatePassword = async (newPassword) => {
    if (!supabaseConfigured) throw new Error('Supabase is not configured.')
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error

      // Log out to clear session and require sign-in with the new password
      await supabase.auth.signOut()
      setUser(null)
      setPasswordRecoveryMode(false)
      syncedUserIdRef.current = null
    } catch (err) {
      throw normalizeAuthError(err, 'update')
    }
  }

  // Continue without an account — only lasts for this browser session (tab)
  const continueAsGuest = () => {
    setIsGuest(true)
    setUser(null)
    sessionStorage.setItem('bible_guest', 'true')
  }

  // Sign out from Supabase
  const logout = async () => {
    try {
      if (supabaseConfigured && supabase) {
        await supabase.auth.signOut()
      }
    } catch (err) {
      // Even if the network call fails, clear local state so the user is logged out
      console.error('Sign out request failed:', err)
    } finally {
      setUser(null)
      setIsGuest(false)
      setPasswordRecoveryMode(false)
      syncedUserIdRef.current = null
      sessionStorage.removeItem('bible_guest')
    }
  }

  // Helper: get the display name from Supabase user_metadata or email
  const getDisplayName = () => {
    if (!user) return ''
    return user.user_metadata?.name || user.email?.split('@')[0] || 'User'
  }

  return (
    <AuthContext.Provider value={{ user, isGuest, loading, passwordRecoveryMode, login, register, continueAsGuest, logout, getDisplayName, resetPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (ctx === null) {
    throw new Error('useAuth must be used within an <AuthProvider>')
  }
  return ctx
}