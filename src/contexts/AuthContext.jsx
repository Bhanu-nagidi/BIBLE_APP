import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'
import { syncService } from '../services/syncService'

const AuthContext = createContext(null)

// Export so App.jsx can show a setup screen
export { supabaseConfigured }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isGuest, setIsGuest] = useState(false)
  const [loading, setLoading] = useState(true)
  const [passwordRecoveryMode, setPasswordRecoveryMode] = useState(() => {
    const hash = window.location.hash || ''
    const search = window.location.search || ''
    return hash.includes('type=recovery') || search.includes('type=recovery')
  })

  useEffect(() => {
    // Clear any old permanent guest flag from localStorage (migration fix)
    localStorage.removeItem('bible_guest')

    if (!supabaseConfigured) {
      // No env vars — check sessionStorage for guest (clears on tab/browser close)
      const savedGuest = sessionStorage.getItem('bible_guest')
      if (savedGuest) setIsGuest(true)
      setLoading(false)
      return
    }

    // 1. Restore existing Supabase session on mount
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        // Sync user data from remote DB to local storage
        await syncService.pull(session.user.id)
        setUser(session.user)
        setIsGuest(false)
      } else {
        // No real session — check if guest mode is active for THIS browser session only
        const savedGuest = sessionStorage.getItem('bible_guest')
        if (savedGuest) setIsGuest(true)
        // Otherwise: stay unauthenticated → shows auth screen
      }
      setLoading(false)
    }

    initAuth()

    // 2. Listen for auth state changes (login, logout, token refresh, password recovery)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
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
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Sign up with email + password, storing name in user_metadata
  const register = async (name, email, password) => {
    if (!supabaseConfigured) throw new Error('Supabase is not configured. Please add your .env file.')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    })
    if (error) throw new Error(error.message)
    if (data.session && data.user) {
      await syncService.pull(data.user.id)
      setUser(data.user)
      setIsGuest(false)
    }
    return data.user
  }

  // Sign in with email + password
  const login = async (email, password) => {
    if (!supabaseConfigured) throw new Error('Supabase is not configured. Please add your .env file.')

    // Basic email format validation before hitting the network
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email.trim())) {
      throw new Error('Please enter a valid email address.')
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) {
      const msg = error.message.toLowerCase()
      if (msg.includes('invalid login') || msg.includes('invalid credentials') || msg.includes('invalid email') || msg.includes('wrong password')) {
        throw new Error('Incorrect email or password. Please check and try again.')
      }
      if (msg.includes('email not confirmed')) {
        throw new Error('Please verify your email address before signing in. Check your inbox.')
      }
      if (msg.includes('user not found') || msg.includes('no user')) {
        throw new Error('No account found with this email. Please register first.')
      }
      throw new Error(error.message)
    }
    if (data.user) {
      await syncService.pull(data.user.id)
      setUser(data.user)
      setIsGuest(false)
    }
    sessionStorage.removeItem('bible_guest')
    return data.user
  }


  // Send a password reset email
  const resetPassword = async (email) => {
    if (!supabaseConfigured) throw new Error('Supabase is not configured.')

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email.trim())) {
      throw new Error('Please enter a valid email address.')
    }

    const redirectTo = window.location.origin + window.location.pathname
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo
    })
    // Supabase returns success even for unregistered emails (security by design),
    // but does surface errors for invalid format, rate limits, etc.
    if (error) {
      const msg = error.message.toLowerCase()
      if (msg.includes('rate limit') || msg.includes('too many')) {
        throw new Error('Too many requests. Please wait a few minutes before trying again.')
      }
      throw new Error(error.message)
    }
  }

  // Update password (used after user clicks reset link in email)
  const updatePassword = async (newPassword) => {
    if (!supabaseConfigured) throw new Error('Supabase is not configured.')
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw new Error(error.message)
    
    // Log out to clear session and require them to sign in with their new password
    if (supabaseConfigured && supabase) {
      await supabase.auth.signOut()
    }
    setUser(null)
    setPasswordRecoveryMode(false)
  }

  // Continue without an account — only lasts for this browser session (tab)
  const continueAsGuest = () => {
    setIsGuest(true)
    setUser(null)
    sessionStorage.setItem('bible_guest', 'true')
  }

  // Sign out from Supabase
  const logout = async () => {
    if (supabaseConfigured && supabase) {
      await supabase.auth.signOut()
    }
    setUser(null)
    setIsGuest(false)
    setPasswordRecoveryMode(false)
    sessionStorage.removeItem('bible_guest')
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
  return useContext(AuthContext)
}
