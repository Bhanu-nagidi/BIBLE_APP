import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'

const AuthContext = createContext(null)

// Export so App.jsx can show a setup screen
export { supabaseConfigured }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isGuest, setIsGuest] = useState(false)
  const [loading, setLoading] = useState(true)

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
        // Valid logged-in user — go straight to home
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

    // 2. Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
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
    if (data.session) {
      setUser(data.user)
      setIsGuest(false)
    }
    return data.user
  }

  // Sign in with email + password
  const login = async (email, password) => {
    if (!supabaseConfigured) throw new Error('Supabase is not configured. Please add your .env file.')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      if (error.message.toLowerCase().includes('invalid')) {
        throw new Error('Invalid email or password. Please try again.')
      }
      throw new Error(error.message)
    }
    setUser(data.user)
    setIsGuest(false)
    sessionStorage.removeItem('bible_guest')
    return data.user
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
    sessionStorage.removeItem('bible_guest')
  }

  // Helper: get the display name from Supabase user_metadata or email
  const getDisplayName = () => {
    if (!user) return ''
    return user.user_metadata?.name || user.email?.split('@')[0] || 'User'
  }

  return (
    <AuthContext.Provider value={{ user, isGuest, loading, login, register, continueAsGuest, logout, getDisplayName }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
