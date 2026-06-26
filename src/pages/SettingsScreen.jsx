import React, { useState, useEffect } from 'react'
import { useBible, BIBLE_LANGUAGES } from '../contexts/BibleContext'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function SettingsScreen() {
  const { selectedLanguage, changeLanguage, fontSize, changeFontSize, streak, bookmarks, showToast,
          reminderOn, reminderTime, toggleReminder, changeReminderTime, formatTimeAMPM } = useBible()
  const { user, isGuest, logout } = useAuth()
  const navigate = useNavigate()

  const [showLangPicker, setShowLangPicker]       = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showRating, setShowRating]               = useState(false)
  const [ratingValue, setRatingValue]             = useState(0)
  const [hoverRating, setHoverRating]             = useState(0)
  const [ratingDone, setRatingDone]               = useState(false)

  // Reading prefs
  const [theme, setTheme]                 = useState(() => localStorage.getItem('app_theme') || 'light')
  const [fontStyle,     setFontStyle]     = useState(() => localStorage.getItem('font_style') || 'sans')
  const [lineSpacing,   setLineSpacing]   = useState(() => localStorage.getItem('line_spacing') || 'normal')
  const [dailyVerse,    setDailyVerse]    = useState(() => localStorage.getItem('daily_verse') !== 'false')

  const notifPerm = typeof Notification !== 'undefined' ? Notification.permission : 'default'

  const changeTheme = (newTheme) => {
    setTheme(newTheme)
    localStorage.setItem('app_theme', newTheme)
    if (newTheme === 'light') {
      document.documentElement.removeAttribute('data-theme')
    } else {
      document.documentElement.setAttribute('data-theme', newTheme)
    }
  }

  const changeFontStyle = (s) => {
    setFontStyle(s)
    localStorage.setItem('font_style', s)
    document.documentElement.style.setProperty('--reader-font',
      s === 'serif' ? "'Crimson Pro', serif" : "'Inter', sans-serif")
  }

  const changeLineSpacing = (s) => {
    setLineSpacing(s)
    localStorage.setItem('line_spacing', s)
    showToast('Line spacing updated')
  }

  const toggleDailyVerse = () => {
    const next = !dailyVerse
    setDailyVerse(next)
    localStorage.setItem('daily_verse', String(next))
    showToast(next ? 'Daily verse enabled' : 'Daily verse disabled')
  }

  const submitRating = (stars) => {
    setRatingValue(stars)
    setRatingDone(true)
    showToast(stars >= 4 ? '🙏 Thank you for your love!' : '🙏 Thanks for your feedback!')
  }

  const handleReminderTimeChange = (e) => {
    changeReminderTime(e.target.value)
  }

  // ── Sub-components ──────────────────────────────────────────────────────────
  const Section = ({ title, children }) => (
    <div style={{ marginBottom: '24px' }}>
      <h4 style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase',
        letterSpacing: '0.14em', marginBottom: '10px', paddingLeft: '2px' }}>{title}</h4>
      <div className="card" style={{ border: '1px solid var(--border-subtle)', padding: 0, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  )

  const Row = ({ icon, label, value, onClick, danger, last, children }) => (
    <div style={{ borderBottom: last ? 'none' : '1px solid var(--border-subtle)' }}>
      <button
        onClick={onClick}
        disabled={!onClick && !children}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '14px',
          padding: '14px 18px', background: 'none', border: 'none',
          cursor: onClick ? 'pointer' : 'default', textAlign: 'left', transition: 'background 0.15s' }}
        onMouseEnter={e => onClick && (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <span style={{ fontSize: '1.1rem', width: '22px', textAlign: 'center' }}>{icon}</span>
        <span style={{ flex: 1, color: danger ? 'var(--error)' : 'var(--text-primary)', fontSize: '0.93rem' }}>{label}</span>
        {value && <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{value}</span>}
        {onClick && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '4px' }}>›</span>}
      </button>
      {children}
    </div>
  )

  const Toggle = ({ on, onToggle }) => (
    <div onClick={onToggle} style={{
      width: '44px', height: '24px', borderRadius: '12px', flexShrink: 0,
      background: on ? 'var(--accent-gold)' : 'var(--border)',
      position: 'relative', cursor: 'pointer', transition: 'background 0.25s'
    }}>
      <div style={{
        position: 'absolute', top: '3px',
        left: on ? '23px' : '3px',
        width: '18px', height: '18px', borderRadius: '50%',
        background: '#fff', transition: 'left 0.25s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.25)'
      }} />
    </div>
  )

  // Only two themes: App Theme (default teal-green) + Glass Blue (modern light glassmorphic)
  const THEMES = [
    { id: 'light', label: 'App Theme', bg: '#f3f6f5', card: '#fff',    text: '#2b3533', icon: '✝️' },
    { id: 'white', label: 'Glass Blue', bg: '#eef3f9', card: '#ffffff', text: '#1e293b', icon: '💎' },
  ]

  const displayName = isGuest ? 'Guest User' : (user?.user_metadata?.name || user?.email?.split('@')[0] || 'User')
  const avatarLetter = isGuest ? '👤' : (displayName[0]?.toUpperCase() || 'U')

  return (
    <div className="content-wrapper page-enter" style={{ paddingBottom: '40px' }}>
      <div className="app-header">
        <h2 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Settings</h2>
      </div>

      <div style={{ padding: '16px 20px 0' }}>

        {/* ── LOGO / BRAND CARD ─────────────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, var(--accent-amber) 0%, var(--accent-gold) 50%, var(--accent-gold-light) 100%)',
          borderRadius: '18px', padding: '24px 20px', marginBottom: '20px',
          display: 'flex', alignItems: 'center', gap: '18px',
          boxShadow: 'var(--shadow-gold)', position: 'relative', overflow: 'hidden'
        }}>
          {/* decorative circles */}
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px',
            borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'absolute', bottom: '-30px', right: '60px', width: '80px', height: '80px',
            borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

          {/* logo cross */}
          <div style={{
            width: '60px', height: '60px', borderRadius: '16px', flexShrink: 0,
            background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
          }}>✝</div>

          <div style={{ flex: 1, position: 'relative' }}>
            <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', letterSpacing: '0.02em' }}>Sacred Word</p>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.75)', letterSpacing: '0.1em', marginTop: '2px' }}>
              MULTILINGUAL BIBLE · v1.0.0
            </p>
          </div>

          {/* avatar */}
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
            background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: isGuest ? '1.4rem' : '1.2rem', fontWeight: 700, color: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}>
            {avatarLetter}
          </div>
        </div>

        {/* ── USER INFO ─────────────────────────────────────────────────── */}
        <div className="card" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '14px',
          border: '1px solid var(--border-subtle)' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-amber))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: isGuest ? '1.3rem' : '1.1rem', fontWeight: 700, color: '#fff' }}>
            {avatarLetter}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{displayName}</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {isGuest ? 'Not signed in · Guest Mode' : user?.email}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-gold)' }}>🔥 {streak.count}</p>
            <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>day streak</p>
          </div>
        </div>

        {/* ── STATS ─────────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '24px' }}>
          {[
            { label: 'Bookmarks', value: bookmarks.length, icon: '🔖' },
            { label: 'Streak',    value: `${streak.count}d`,            icon: '🔥' },
            { label: 'Days Active', value: streak.history?.length || 0, icon: '📅' },
          ].map(s => (
            <div key={s.label} className="card" style={{ textAlign: 'center', border: '1px solid var(--border-subtle)', padding: '14px 8px' }}>
              <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{s.icon}</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--accent-gold)' }}>{s.value}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── THEME ─────────────────────────────────────────────────────── */}
        <Section title="🎨 Theme">
          <div style={{ padding: '16px 18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(78px, 1fr))', gap: '10px' }}>
            {THEMES.map(t => {
              const isActive = theme === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => changeTheme(t.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '12px 6px',
                    borderRadius: 'var(--radius)',
                    background: t.card,
                    border: isActive ? '2px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: isActive ? 'var(--shadow-gold)' : 'none',
                    minWidth: '74px'
                  }}
                >
                  <span style={{ fontSize: '1.3rem' }}>{t.icon}</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--accent-gold)' : 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {t.label}
                  </span>
                </button>
              )
            })}
          </div>
        </Section>

        {/* ── BIBLE READING ─────────────────────────────────────────────── */}
        <Section title="📖 Bible Reading">
          <Row icon="🌍" label="Language & Version"
            value={`${selectedLanguage.flag} ${selectedLanguage.version}`}
            onClick={() => setShowLangPicker(true)} />

          {/* Font Size */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
              <span style={{ fontSize: '1.1rem', width: '22px', textAlign: 'center' }}>📝</span>
              <span style={{ flex: 1, fontSize: '0.93rem', color: 'var(--text-primary)' }}>Font Size</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', background: 'var(--bg-secondary)',
                padding: '2px 10px', borderRadius: '20px' }}>{fontSize}px</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '36px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>A</span>
              <input type="range" min="14" max="28" value={fontSize}
                onChange={e => changeFontSize(Number(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--accent-gold)' }} />
              <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>A</span>
            </div>
            <p className="serif" style={{ fontSize: `${fontSize}px`, color: 'var(--text-secondary)',
              marginTop: '8px', lineHeight: 1.6, fontStyle: 'italic', paddingLeft: '36px' }}>
              "The Lord is my shepherd."
            </p>
          </div>

          {/* Font Style */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ fontSize: '1.1rem', width: '22px', textAlign: 'center' }}>🔤</span>
              <span style={{ fontSize: '0.93rem', color: 'var(--text-primary)' }}>Font Style</span>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['sans', 'serif'].map(s => (
                <button key={s} onClick={() => changeFontStyle(s)} style={{
                  padding: '5px 14px', borderRadius: '20px', border: '1px solid var(--border)',
                  background: fontStyle === s ? 'var(--accent-gold)' : 'transparent',
                  color: fontStyle === s ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                  fontFamily: s === 'serif' ? 'Crimson Pro, serif' : 'Inter, sans-serif',
                  transition: 'all 0.2s', whiteSpace: 'nowrap'
                }}>
                  {s === 'sans' ? 'Sans' : 'Serif'}
                </button>
              ))}
            </div>
          </div>

          {/* Line Spacing */}
          <div style={{ padding: '14px 18px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ fontSize: '1.1rem', width: '22px', textAlign: 'center' }}>↕️</span>
              <span style={{ fontSize: '0.93rem', color: 'var(--text-primary)' }}>Line Spacing</span>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[['compact','Compact'],['normal','Normal'],['relaxed','Relaxed']].map(([s, label]) => (
                <button key={s} onClick={() => changeLineSpacing(s)} style={{
                  padding: '5px 10px', borderRadius: '20px', border: '1px solid var(--border)',
                  background: lineSpacing === s ? 'var(--accent-gold)' : 'transparent',
                  color: lineSpacing === s ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}>{label}</button>
              ))}
            </div>
          </div>
        </Section>

        <Section title="⚙️ Preferences">

          {/* Daily Reminder */}
          <div style={{ padding: '14px 18px', borderBottom: reminderOn ? '1px solid var(--border-subtle)' : 'none',
            display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '1.1rem', width: '22px', textAlign: 'center' }}>⏰</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.93rem', color: 'var(--text-primary)' }}>Daily Reminder</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {reminderOn
                  ? `Reminder set for ${formatTimeAMPM(reminderTime)} every day`
                  : 'Get a daily notification to read the Bible'}
              </p>
            </div>
            <Toggle on={reminderOn} onToggle={toggleReminder} />
          </div>

          {/* Reminder time picker — only shown when reminder is on */}
          {reminderOn && (
            <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(var(--accent-rgb),0.04)' }}>
              <span style={{ fontSize: '1.1rem', width: '22px', textAlign: 'center' }}>🕐</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Reminder Time <span style={{ color: 'var(--accent-gold)', fontWeight: 600, marginLeft: '4px' }}>({formatTimeAMPM(reminderTime)})</span>
                </p>
                <input
                  id="reminder-time-input"
                  type="time"
                  value={reminderTime}
                  onChange={handleReminderTimeChange}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    padding: '6px 12px',
                    fontFamily: 'Inter, sans-serif',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                />
              </div>
              {notifPerm !== 'granted' && (
                <p style={{ fontSize: '0.72rem', color: 'var(--error)', maxWidth: '120px', textAlign: 'right' }}>
                  Allow notifications in browser
                </p>
              )}
            </div>
          )}
        </Section>

        {/* ── APP INFO ──────────────────────────────────────────────────── */}
        <Section title="ℹ️ App">
          <Row icon="✝️" label="Sacred Word Bible" value="v1.0.0" />

          {/* Dynamic Star Rating */}
          <div style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setShowRating(r => !r)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '14px',
                padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontSize: '1.1rem', width: '22px', textAlign: 'center' }}>⭐</span>
              <span style={{ flex: 1, fontSize: '0.93rem', color: 'var(--text-primary)' }}>Rate the App</span>
              {ratingDone
                ? <span style={{ color: 'var(--accent-gold)', fontSize: '0.82rem', fontWeight: 600 }}>
                    {'★'.repeat(ratingValue)}{'☆'.repeat(5 - ratingValue)}
                  </span>
                : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{showRating ? '▲' : '▼'}</span>
              }
            </button>

            {showRating && (
              <div style={{ padding: '0 18px 16px 54px' }}>
                {ratingDone ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {ratingValue >= 4 ? '🙏 Thank you! Your support means the world to us.' : '🙏 Thank you for your honest feedback!'}
                    </p>
                    <button onClick={() => { setRatingDone(false); setRatingValue(0) }}
                      style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', background: 'none',
                        border: 'none', cursor: 'pointer', padding: 0 }}>Change rating</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>How would you rate Sacred Word?</p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {[1,2,3,4,5].map(star => (
                        <button key={star}
                          onClick={() => submitRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer',
                            fontSize: '2rem', lineHeight: 1, padding: '2px',
                            color: star <= (hoverRating || ratingValue) ? '#f59e0b' : 'var(--border)',
                            transition: 'color 0.15s, transform 0.15s',
                            transform: star <= hoverRating ? 'scale(1.25)' : 'scale(1)'
                          }}>★</button>
                      ))}
                    </div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {hoverRating === 1 ? '😞 Poor' : hoverRating === 2 ? '😐 Fair' :
                       hoverRating === 3 ? '🙂 Good' : hoverRating === 4 ? '😊 Great' :
                       hoverRating === 5 ? '🤩 Excellent!' : 'Tap a star to rate'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <Row icon="📤" label="Share with Friends" onClick={() => {
            if (navigator.share) navigator.share({ title: 'Sacred Word', text: 'Read the Bible in multiple languages!', url: window.location.origin })
            else { navigator.clipboard.writeText(window.location.origin); showToast('Link copied! 📋') }
          }} />
          <Row icon="📖" label="About Scripture" value="godlytalias API" last />
        </Section>

        {/* ── ACCOUNT ───────────────────────────────────────────────────── */}
        <Section title="👤 Account">
          <Row icon="🚪" label="Sign Out" onClick={() => setShowLogoutConfirm(true)} danger last />
        </Section>

      </div>

      {/* ── LANGUAGE PICKER MODAL ─────────────────────────────────────── */}
      {showLangPicker && (
        <div className="modal-overlay" onClick={() => setShowLangPicker(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Language & Version</h3>
              <button onClick={() => setShowLangPicker(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {BIBLE_LANGUAGES.map(lang => (
                <button key={lang.code}
                  onClick={() => { changeLanguage(lang); setShowLangPicker(false) }}
                  style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '13px 16px',
                    background: selectedLanguage.code === lang.code ? 'rgba(var(--accent-rgb),0.1)' : 'rgba(var(--accent-rgb),0.03)',
                    border: `1px solid ${selectedLanguage.code === lang.code ? 'rgba(var(--accent-rgb),0.4)' : 'var(--border-subtle)'}`,
                    borderRadius: '10px', cursor: 'pointer', textAlign: 'left' }}>
                  <span style={{ fontSize: '1.4rem' }}>{lang.flag}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{lang.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '1px' }}>{lang.version}</div>
                  </div>
                  {selectedLanguage.code === lang.code && <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── LOGOUT CONFIRM MODAL ──────────────────────────────────────── */}
      {showLogoutConfirm && (
        <div className="modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🚪</div>
              <h3 style={{ marginBottom: '8px' }}>Sign Out?</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Your bookmarks and streak are saved and will be here when you return.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
              <button onClick={logout} style={{ flex: 1, background: 'rgba(224,85,85,0.15)',
                border: '1px solid var(--error)', borderRadius: 'var(--radius)', padding: '12px',
                color: 'var(--error)', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
