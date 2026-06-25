import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

// ─── Self-contained toast ────────────────────────────────────────────────────
function AuthToast({ toasts }) {
  return (
    <div style={{
      position: 'fixed', bottom: '28px', left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px',
      alignItems: 'center', pointerEvents: 'none'
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '13px 20px',
          borderRadius: '14px',
          background: t.type === 'success'
            ? 'linear-gradient(135deg, #166534, #15803d)'
            : 'linear-gradient(135deg, #7f1d1d, #b91c1c)',
          boxShadow: t.type === 'success'
            ? '0 8px 32px rgba(21,128,61,0.45), 0 2px 8px rgba(0,0,0,0.3)'
            : '0 8px 32px rgba(185,28,28,0.45), 0 2px 8px rgba(0,0,0,0.3)',
          border: `1px solid ${t.type === 'success' ? 'rgba(74,222,128,0.3)' : 'rgba(252,165,165,0.3)'}`,
          color: '#fff',
          fontSize: '0.9rem',
          fontWeight: 500,
          whiteSpace: 'nowrap',
          maxWidth: '340px',
          animation: 'toastSlideUp 0.35s cubic-bezier(0.34,1.56,0.64,1) both',
        }}>
          <span style={{ fontSize: '1.2rem' }}>
            {t.type === 'success' ? '✅' : '❌'}
          </span>
          {t.message}
        </div>
      ))}
      <style>{`
        @keyframes toastSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.92); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}

function useToasts() {
  const [toasts, setToasts] = useState([])

  const addToast = (message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }

  return { toasts, addToast }
}

// ─── Main AuthScreen ──────────────────────────────────────────────────────────
export default function AuthScreen() {
  const [mode, setMode] = useState('welcome') // welcome | login | register
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register, continueAsGuest } = useAuth()
  const { toasts, addToast } = useToasts()

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        const user = await login(form.email, form.password)
        const name = user?.user_metadata?.name || user?.email?.split('@')[0] || 'back'
        addToast(`Welcome back, ${name}! 🙏`, 'success')
      } else {
        if (!form.name.trim()) throw new Error('Name is required')
        if (form.password.length < 6) throw new Error('Password must be at least 6 characters')
        await register(form.name, form.email, form.password)
        addToast(`Account created! Welcome, ${form.name.split(' ')[0]}! 🎉`, 'success')
      }
    } catch (err) {
      setError(err.message)
      // Error shown inline in the form — no bottom toast for failures
    } finally {
      setLoading(false)
    }
  }

  if (mode === 'welcome') {
    return (
      <div className="auth-welcome page-enter">
        <div className="auth-bg" />
        <div className="auth-content">
          <div className="auth-logo">
            <div className="auth-cross">✝</div>
            <h1 className="serif" style={{ fontSize: '2.4rem', fontWeight: 300, letterSpacing: '0.04em', marginTop: '8px' }}>Sacred Word</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px', letterSpacing: '0.08em' }}>MULTILINGUAL BIBLE</p>
          </div>

          <div className="auth-tagline serif">
            <em>"Thy word is a lamp unto my feet,<br />and a light unto my path."</em>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>— Psalm 119:105</p>
          </div>

          <div className="auth-buttons">
            <button className="btn-gold w-full" onClick={() => setMode('register')}>
              Create Account
            </button>
            <button className="btn-ghost w-full" onClick={() => setMode('login')}>
              Sign In
            </button>
            <div className="cross-divider">or</div>
            <button
              onClick={continueAsGuest}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '0.9rem', cursor: 'pointer', padding: '4px' }}
            >
              Continue as Guest
            </button>
          </div>

          <div className="auth-features">
            {['📖 66 Books of the Bible', '🌍 10+ Languages', '🔖 Bookmarks & Notes', '🎵 Audio Bible', '🔥 Daily Streaks'].map(f => (
              <span key={f} className="feature-pill">{f}</span>
            ))}
          </div>
        </div>

        <AuthToast toasts={toasts} />

        <style>{`
          .auth-welcome {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            position: relative;
            overflow: hidden;
          }
          .auth-bg {
            position: absolute;
            inset: 0;
            background: radial-gradient(ellipse at top, rgba(var(--accent-rgb),0.12) 0%, transparent 60%),
                        radial-gradient(ellipse at bottom, rgba(var(--accent-rgb),0.06) 0%, transparent 50%);
          }
          .auth-content {
            position: relative;
            width: 100%;
            max-width: 360px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 40px;
          }
          .auth-logo { text-align: center; }
          .auth-cross {
            font-size: 3.5rem;
            color: var(--accent-gold);
            filter: drop-shadow(0 0 20px rgba(var(--accent-rgb),0.5));
            line-height: 1;
          }
          .auth-tagline {
            text-align: center;
            font-size: 1.1rem;
            line-height: 1.7;
            color: var(--text-secondary);
            max-width: 280px;
          }
          .auth-buttons {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 12px;
            align-items: center;
          }
          .auth-features {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            justify-content: center;
          }
          .feature-pill {
            background: rgba(255,255,255,0.04);
            border: 1px solid var(--border-subtle);
            border-radius: 20px;
            padding: 5px 12px;
            font-size: 0.75rem;
            color: var(--text-muted);
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="auth-form-page page-enter">
      <div style={{ maxWidth: '400px', margin: '0 auto', padding: '40px 24px' }}>
        <button
          onClick={() => { setMode('welcome'); setError('') }}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}
        >
          ← Back
        </button>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✝</div>
          <h2 className="serif" style={{ fontSize: '1.8rem', fontWeight: 400 }}>
            {mode === 'login' ? 'Welcome Back' : 'Join Sacred Word'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            {mode === 'login' ? 'Sign in to your account' : 'Create your free account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {mode === 'register' && (
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Full Name</label>
              <input
                className="input-field"
                name="name"
                placeholder="Your name"
                value={form.name}
                onChange={handle}
                required
              />
            </div>
          )}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Email</label>
            <input
              className="input-field"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handle}
              required
            />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Password</label>
            <input
              className="input-field"
              name="password"
              type="password"
              placeholder={mode === 'register' ? 'Min. 6 characters' : 'Your password'}
              value={form.password}
              onChange={handle}
              required
            />
          </div>

          {error && (
            <div style={{ background: 'rgba(224,85,85,0.1)', border: '1px solid rgba(224,85,85,0.3)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--error)', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          <button className="btn-gold w-full" type="submit" disabled={loading} style={{ marginTop: '8px' }}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          </span>
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
            style={{ background: 'none', border: 'none', color: 'var(--accent-gold)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
          >
            {mode === 'login' ? 'Sign Up' : 'Sign In'}
          </button>
        </div>

        <div className="cross-divider" style={{ margin: '20px 0' }}>or</div>
        <button className="btn-ghost w-full" onClick={continueAsGuest} style={{ textAlign: 'center' }}>
          Continue as Guest
        </button>
      </div>

      <AuthToast toasts={toasts} />
    </div>
  )
}
