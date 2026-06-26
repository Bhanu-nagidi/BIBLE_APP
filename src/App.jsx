import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth, supabaseConfigured } from './contexts/AuthContext'

// Restore saved theme & accent before first render
const savedTheme  = localStorage.getItem('app_theme')  || 'light'
const savedAccent = localStorage.getItem('app_accent') || 'teal'
if (savedTheme !== 'light') document.documentElement.setAttribute('data-theme', savedTheme)
document.documentElement.setAttribute('data-accent', savedAccent)

import { BibleProvider, useBible } from './contexts/BibleContext'
import AuthScreen from './pages/AuthScreen'
import HomeScreen from './pages/HomeScreen'
import BibleReader from './pages/BibleReader'
import BookmarksScreen from './pages/BookmarksScreen'
import SearchScreen from './pages/SearchScreen'
import SettingsScreen from './pages/SettingsScreen'
import ReadingPlanScreen from './pages/ReadingPlanScreen'
import NotesScreen from './pages/NotesScreen'
import Sidebar from './components/Sidebar'
import BottomNav from './components/BottomNav'
import Toast from './components/Toast'

// Shown when .env file is missing — app still loads, just nudges the user to configure
function SetupBanner() {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      background: 'linear-gradient(90deg, #b45309, #d97706)',
      color: '#fff', padding: '10px 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      fontSize: '0.82rem', gap: '12px', flexWrap: 'wrap',
      boxShadow: '0 2px 12px rgba(0,0,0,0.3)'
    }}>
      <span>
        ⚠️ <strong>Supabase not configured.</strong> Create a <code style={{ background: 'rgba(0,0,0,0.2)', padding: '1px 6px', borderRadius: '4px' }}>.env</code> file with your{' '}
        <code style={{ background: 'rgba(0,0,0,0.2)', padding: '1px 6px', borderRadius: '4px' }}>VITE_SUPABASE_URL</code> and{' '}
        <code style={{ background: 'rgba(0,0,0,0.2)', padding: '1px 6px', borderRadius: '4px' }}>VITE_SUPABASE_ANON_KEY</code>.{' '}
        Auth is disabled — you can still browse as Guest.
      </span>
      <a
        href="https://supabase.com/dashboard"
        target="_blank"
        rel="noreferrer"
        style={{ color: '#fff', fontWeight: 700, textDecoration: 'underline', whiteSpace: 'nowrap' }}
      >
        Open Supabase →
      </a>
    </div>
  )
}

function AppRoutes() {
  const { user, isGuest, loading } = useAuth()
  const { toast } = useBible()

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>✝️</div>
          <p style={{ color: 'var(--text-muted)', fontFamily: 'Crimson Pro, serif', fontSize: '1.1rem' }}>Loading Sacred Word...</p>
        </div>
      </div>
    )
  }

  const isAuthenticated = user || isGuest

  return (
    <>
      {!supabaseConfigured && <SetupBanner />}
      <div style={!supabaseConfigured ? { paddingTop: '42px' } : {}}>
        <Routes>
          {!isAuthenticated ? (
            <>
              <Route path="/auth" element={<AuthScreen />} />
              <Route path="*" element={<Navigate to="/auth" replace />} />
            </>
          ) : (
            <>
              <Route path="/" element={<HomeScreen />} />
              <Route path="/bible" element={<BibleReader />} />
              <Route path="/search" element={<SearchScreen />} />
              <Route path="/bookmarks" element={<BookmarksScreen />} />
              <Route path="/settings" element={<SettingsScreen />} />
              <Route path="/plans" element={<ReadingPlanScreen />} />
              <Route path="/notes" element={<NotesScreen />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </div>
      {isAuthenticated && <Sidebar />}
      {isAuthenticated && <BottomNav />}
      {toast && <Toast message={toast} />}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BibleProvider>
          <AppRoutes />
        </BibleProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
