import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBible, BIBLE_LANGUAGES, BIBLE_BOOKS } from '../contexts/BibleContext'
import { useAuth } from '../contexts/AuthContext'

export default function HomeScreen() {
  const navigate = useNavigate()
  const { selectedLanguage, changeLanguage, streak, verseOfTheDay, addBookmark, isBookmarked, activePlan, toggleReadingComplete, setCurrentBook, setCurrentChapter, setSelectedVerse } = useBible()
  const { user, isGuest, logout } = useAuth()
  const [showLangPicker, setShowLangPicker] = useState(false)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [homeSearchQuery, setHomeSearchQuery] = useState('')

  const handleSearchSubmit = () => {
    if (homeSearchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(homeSearchQuery.trim())}`)
    }
  }

  const handleReadingClick = (bookId, chapterNum) => {
    const book = BIBLE_BOOKS.find(b => b.id === bookId)
    if (book) {
      setCurrentBook(book)
      setCurrentChapter(chapterNum)
      navigate('/bible')
    }
  }

  const handleReadVotd = (verseRef) => {
    if (!verseRef) return

    // Try to parse reference e.g., "John 3:16" or "1 John 3"
    const clean = verseRef.trim().replace(/\s+/g, ' ')
    const match = clean.match(/^(.+?)\s+(\d+)(?:\s*:\s*(\d+))?$/)
    
    let resolvedBook = null
    let chapterNum = 1
    let verseNum = null

    if (match) {
      const bookPart = match[1].trim().toLowerCase()
      chapterNum = parseInt(match[2], 10)
      verseNum = match[3] ? parseInt(match[3], 10) : null
      
      resolvedBook = BIBLE_BOOKS.find(b => 
        b.name.toLowerCase() === bookPart || 
        b.id.toLowerCase() === bookPart
      )
    } else {
      // Just book name
      resolvedBook = BIBLE_BOOKS.find(b => b.name.toLowerCase() === clean.toLowerCase())
    }

    if (resolvedBook) {
      setCurrentBook(resolvedBook)
      setCurrentChapter(chapterNum)
      if (verseNum) {
        setSelectedVerse(String(verseNum))
      } else {
        setSelectedVerse(null)
      }
      navigate('/bible')
    }
  }

  // Calculate completed percent
  let planProgressPercent = 0
  let todayReadings = []
  let daysCompleted = 0
  let totalPlanDays = 0
  let currentPlanDay = 1

  if (activePlan) {
    totalPlanDays = activePlan.readings.length
    
    // Find current plan day: first day that is not fully completed
    let foundCurrentDay = false
    activePlan.readings.forEach(rDay => {
      const isDayComplete = rDay.isRestDay || (rDay.readings.length > 0 && rDay.readings.every((_, idx) => 
        activePlan.completedReadings[`${rDay.day}-${idx}`]
      ))
      if (isDayComplete) {
        daysCompleted++
      } else if (!foundCurrentDay) {
        currentPlanDay = rDay.day
        todayReadings = rDay.readings
        foundCurrentDay = true
      }
    })

    if (!foundCurrentDay) {
      // All days are completed
      currentPlanDay = totalPlanDays
      todayReadings = []
    }

    // Percentage of completed readings
    let totalReadingsCount = 0
    let completedReadingsCount = 0
    activePlan.readings.forEach(rDay => {
      if (rDay.isRestDay) return
      rDay.readings.forEach((_, idx) => {
        totalReadingsCount++
        if (activePlan.completedReadings[`${rDay.day}-${idx}`]) {
          completedReadingsCount++
        }
      })
    })

    planProgressPercent = totalReadingsCount > 0 
      ? Math.round((completedReadingsCount / totalReadingsCount) * 100) 
      : 100
  }

  const votd = verseOfTheDay()
  const displayName = (user?.user_metadata?.name || user?.email?.split('@')[0])?.split(' ')[0] || (isGuest ? 'Friend' : 'Beloved')
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const streakDays = streak?.history || []
  const today = new Date().toDateString()
  const [selectedDayInfo, setSelectedDayInfo] = useState(null)

  // Build the Sun–Sat grid for the CURRENT week
  const buildWeekGrid = () => {
    const now = new Date()
    const dayOfWeek = now.getDay() // 0=Sun, 6=Sat
    // Start of current week (Sunday)
    const sunday = new Date(now)
    sunday.setDate(now.getDate() - dayOfWeek)
    sunday.setHours(0, 0, 0, 0)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday)
      d.setDate(sunday.getDate() + i)
      const ds = d.toDateString()
      const isActive = streakDays.includes(ds)
      const isToday = ds === today
      const isFuture = d > now
      const details = streak?.dailyDetails?.[ds] || null
      return { date: d, dateString: ds, isActive, isToday, isFuture, details, dayIndex: i }
    })
  }
  const weekGrid = buildWeekGrid()

  return (
    <div className="content-wrapper page-enter">
      {/* Header */}
      <div className="app-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <div style={{ flexShrink: 0 }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{greeting}</p>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600 }}>{displayName}</h2>
        </div>

        {/* Middle: Search Bar (Desktop) */}
        <div className="header-search-container" style={{ flex: 1, maxWidth: '400px', margin: '0 24px' }}>
          <div className="search-bar" style={{ borderRadius: '50px', width: '100%', padding: '6px 14px' }}>
            <span style={{ color: 'var(--text-muted)' }}>🔍</span>
            <input
              placeholder="Search verses, topics, or references..."
              value={homeSearchQuery}
              onChange={e => setHomeSearchQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearchSubmit() }}
              style={{ width: '100%' }}
            />
            {homeSearchQuery && (
              <button 
                onClick={() => setHomeSearchQuery('')} 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginRight: '8px' }}
              >
                ✕
              </button>
            )}
            <button
              onClick={handleSearchSubmit}
              style={{ background: 'var(--accent-gold)', border: 'none', borderRadius: '20px', padding: '6px 14px', color: 'var(--text-on-accent)', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem', flexShrink: 0 }}
            >
              Search
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Language Picker Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowLangPicker(!showLangPicker)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(var(--accent-rgb),0.1)', border: '1px solid var(--border)', borderRadius: '50px', padding: '7px 14px', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '0.85rem' }}
            >
              <span>{selectedLanguage.flag}</span>
              <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>{selectedLanguage.version}</span>
            </button>
            {showLangPicker && (
              <>
                <div
                  onClick={() => setShowLangPicker(false)}
                  style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 998,
                    background: 'transparent',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 8px)',
                    zIndex: 999,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    boxShadow: 'var(--shadow)',
                    width: '240px',
                    maxHeight: '320px',
                    overflowY: 'auto',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    animation: 'fadeSlideIn 0.2s ease forwards',
                  }}
                >
                  {BIBLE_LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => { changeLanguage(lang); setShowLangPicker(false) }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: selectedLanguage.code === lang.code ? 'rgba(var(--accent-rgb),0.1)' : 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s',
                        width: '100%',
                        color: 'var(--text-primary)',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(var(--accent-rgb),0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = selectedLanguage.code === lang.code ? 'rgba(var(--accent-rgb),0.1)' : 'transparent'}
                    >
                      <span style={{ fontSize: '1.2rem' }}>{lang.flag}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{lang.name}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{lang.version}</div>
                      </div>
                      {selectedLanguage.code === lang.code && <span style={{ color: 'var(--accent-gold)', fontSize: '0.85rem' }}>✓</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Profile Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                width: '36px', height: '36px', borderRadius: '50%', 
                background: 'rgba(var(--accent-rgb),0.1)', border: '1px solid var(--border)', 
                cursor: 'pointer', color: 'var(--accent-gold)', fontSize: '1.1rem' 
              }}
            >
              👤
            </button>
            {showProfileDropdown && (
              <>
                <div
                  onClick={() => setShowProfileDropdown(false)}
                  style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 998,
                    background: 'transparent',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 8px)',
                    zIndex: 999,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    boxShadow: 'var(--shadow)',
                    width: '220px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    animation: 'fadeSlideIn 0.2s ease forwards',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ 
                      width: '38px', height: '38px', borderRadius: '50%', 
                      background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-amber))', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      fontSize: '1rem', fontWeight: 700, color: 'var(--text-on-accent)', flexShrink: 0 
                    }}>
                      {isGuest ? '👤' : (user?.user_metadata?.name || user?.email || 'U')[0]?.toUpperCase() || 'U'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {isGuest ? 'Guest User' : (user?.user_metadata?.name || user?.email?.split('@')[0] || 'User')}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px' }}>
                        {isGuest ? 'Guest Account' : user?.email}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ height: '1px', background: 'var(--border-subtle)' }} />
                  
                  <button
                    type="button"
                    onClick={() => { logout(); setShowProfileDropdown(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)',
                      background: 'rgba(224,85,85,0.1)', border: '1px solid rgba(224,85,85,0.2)',
                      color: 'var(--error)', fontWeight: 600, fontSize: '0.82rem',
                      cursor: 'pointer', transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(224,85,85,0.15)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(224,85,85,0.1)'}
                  >
                    🚪 Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        {/* Mobile Search Bar (hidden on desktop) */}
        <div className="mobile-search-container" style={{ marginBottom: '20px' }}>
          <div className="search-bar" style={{ borderRadius: '50px', padding: '6px 14px' }}>
            <span style={{ color: 'var(--text-muted)' }}>🔍</span>
            <input
              placeholder="Search verses, topics, or references..."
              value={homeSearchQuery}
              onChange={e => setHomeSearchQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearchSubmit() }}
              style={{ width: '100%' }}
            />
            {homeSearchQuery && (
              <button 
                onClick={() => setHomeSearchQuery('')} 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginRight: '8px' }}
              >
                ✕
              </button>
            )}
            <button
              onClick={handleSearchSubmit}
              style={{ background: 'var(--accent-gold)', border: 'none', borderRadius: '20px', padding: '6px 14px', color: 'var(--text-on-accent)', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem', flexShrink: 0 }}
            >
              Search
            </button>
          </div>
        </div>


        {/* Streak Card — Sun to Sat weekly grid */}
        <div className="card" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, var(--bg-card), var(--bg-secondary))', border: '1px solid var(--border)', overflow: 'hidden' }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>Daily Streak</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                <span style={{ fontSize: '1.9rem', fontWeight: 700, color: 'var(--accent-gold)' }}>{streak.count}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>day{streak.count !== 1 ? 's' : ''}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="streak-ring"><span style={{ fontSize: '1.4rem' }}>🔥</span></div>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Sun – Sat grid */}
          <div style={{ display: 'flex', gap: '5px' }}>
            {weekGrid.map((day, i) => {
              const isSelected = selectedDayInfo?.dateString === day.dateString
              const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDayInfo(isSelected ? null : day)}
                  style={{
                    flex: 1, textAlign: 'center', background: 'none', border: 'none',
                    cursor: day.isFuture ? 'default' : 'pointer', padding: '2px 0',
                  }}
                >
                  {/* Day label */}
                  <div style={{
                    fontSize: '0.58rem', fontWeight: day.isToday ? 700 : 400,
                    color: day.isToday ? 'var(--accent-gold)' : 'var(--text-muted)',
                    marginBottom: '5px', letterSpacing: '0.03em',
                  }}>
                    {DAY_LABELS[i]}
                  </div>
                  {/* Day circle */}
                  <div style={{
                    height: '36px', borderRadius: '10px',
                    background: day.isActive
                      ? 'linear-gradient(135deg, var(--accent-gold), var(--accent-amber))'
                      : day.isFuture
                        ? 'rgba(var(--accent-rgb),0.03)'
                        : 'rgba(var(--accent-rgb),0.06)',
                    border: isSelected
                      ? '2px solid var(--accent-gold)'
                      : day.isToday
                        ? '2px solid rgba(var(--accent-rgb),0.5)'
                        : '2px solid transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.8rem',
                    color: day.isActive ? 'var(--text-on-accent)' : day.isFuture ? 'var(--border)' : 'var(--text-muted)',
                    fontWeight: day.isActive ? 700 : 400,
                    transition: 'all 0.18s ease',
                    transform: isSelected ? 'scale(0.93)' : 'scale(1)',
                  }}>
                    {day.isActive ? '✓' : day.isFuture ? '·' : day.date.getDate()}
                  </div>
                  {/* Date number below */}
                  <div style={{
                    fontSize: '0.6rem', marginTop: '4px',
                    color: day.isToday ? 'var(--accent-gold)' : 'transparent',
                    fontWeight: 700,
                  }}>
                    ▲
                  </div>
                </button>
              )
            })}
          </div>

          {/* Day Detail Panel — slides in when a day is clicked */}
          {selectedDayInfo && (
            <div style={{
              marginTop: '14px',
              padding: '14px',
              background: 'rgba(var(--accent-rgb),0.04)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              animation: 'fadeSlideIn 0.22s ease forwards',
            }}>
              {/* Day Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    {selectedDayInfo.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                    {selectedDayInfo.isToday ? 'Today' : selectedDayInfo.isFuture ? 'Upcoming' : 'Past day'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDayInfo(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1rem', cursor: 'pointer', padding: '2px 6px' }}
                >✕</button>
              </div>

              {/* Status badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '4px 10px', borderRadius: '20px', marginBottom: '14px',
                background: selectedDayInfo.isActive
                  ? 'rgba(var(--accent-rgb),0.12)'
                  : selectedDayInfo.isFuture
                    ? 'rgba(100,100,120,0.1)'
                    : 'rgba(224,85,85,0.08)',
                border: `1px solid ${selectedDayInfo.isActive ? 'rgba(var(--accent-rgb),0.25)' : selectedDayInfo.isFuture ? 'var(--border-subtle)' : 'rgba(224,85,85,0.15)'}`,
              }}>
                <span style={{ fontSize: '0.85rem' }}>
                  {selectedDayInfo.isActive ? '✅' : selectedDayInfo.isFuture ? '📅' : '❌'}
                </span>
                <span style={{
                  fontSize: '0.75rem', fontWeight: 600,
                  color: selectedDayInfo.isActive ? 'var(--accent-gold)' : selectedDayInfo.isFuture ? 'var(--text-muted)' : 'var(--error)',
                }}>
                  {selectedDayInfo.isActive ? 'Completed' : selectedDayInfo.isFuture ? 'Not yet' : 'Missed'}
                </span>
              </div>

              {/* Stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                {[
                  {
                    icon: '⏱',
                    label: 'Time Spent',
                    value: (() => {
                      const secs = selectedDayInfo.details?.timeSpent || 0
                      if (secs === 0) return selectedDayInfo.isActive ? '< 1 min' : '—'
                      if (secs < 60) return `${secs}s`
                      return `${Math.round(secs / 60)} min`
                    })(),
                  },
                  {
                    icon: '📖',
                    label: 'Chapters',
                    value: selectedDayInfo.details?.chaptersRead
                      ? `${selectedDayInfo.details.chaptersRead}`
                      : selectedDayInfo.isActive ? '1+' : '—',
                  },
                  {
                    icon: '🕐',
                    label: 'First Visit',
                    value: selectedDayInfo.details?.firstVisit
                      ? new Date(selectedDayInfo.details.firstVisit).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                      : selectedDayInfo.isActive ? 'Today' : '—',
                  },
                ].map(stat => (
                  <div key={stat.label} style={{
                    background: 'rgba(var(--accent-rgb),0.04)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px', padding: '10px 8px', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{stat.icon}</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>{stat.value}</div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Motivational message */}
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', fontStyle: 'italic' }}>
                {selectedDayInfo.isToday && selectedDayInfo.isActive
                  ? '🙏 Great job reading today! Keep the streak alive.'
                  : selectedDayInfo.isToday && !selectedDayInfo.isActive
                    ? '✨ Open the Bible and start reading to mark today complete!'
                    : selectedDayInfo.isFuture
                      ? '📅 This day is coming — stay consistent!'
                      : selectedDayInfo.isActive
                        ? '🌟 You were faithful on this day. Well done!'
                        : '💪 Every new day is a fresh start. Keep going!'}
              </p>
            </div>
          )}
        </div>


        {/* Verse of the Day */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <span className="badge badge-gold">✨ Verse of the Day</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
          <div className="card" style={{ background: 'linear-gradient(135deg, var(--bg-card), var(--bg-secondary))', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, var(--accent-gold), var(--accent-gold-light))' }} />
            <p className="serif" style={{ fontSize: '1.25rem', lineHeight: '1.75', color: 'var(--text-primary)', marginBottom: '16px', fontStyle: 'italic' }}>
              "{votd.text}"
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--accent-gold)', fontSize: '0.85rem', fontWeight: 600 }}>— {votd.reference}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className={`bookmark-btn ${isBookmarked(votd.reference) ? 'saved' : ''}`}
                  onClick={() => addBookmark({ id: votd.reference, reference: votd.reference, text: votd.text })}
                >
                  {isBookmarked(votd.reference) ? '🔖' : '🕮'}
                </button>
                <button
                  onClick={() => handleReadVotd(votd.reference)}
                  style={{ background: 'rgba(var(--accent-rgb),0.1)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 14px', color: 'var(--accent-gold)', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Read →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Access */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Quick Access</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { icon: '📖', label: 'Read Bible', desc: 'Continue reading', action: () => navigate('/bible') },
              { icon: '🔍', label: 'Search', desc: 'Find verses', action: () => navigate('/search') },
              { icon: '🔖', label: 'Bookmarks', desc: 'Saved verses', action: () => navigate('/bookmarks') },
              { icon: '🎵', label: 'Audio Bible', desc: 'Listen now', action: () => navigate('/bible?audio=1') },
            ].map(item => (
              <button
                key={item.label}
                onClick={item.action}
                className="card"
                style={{ textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid var(--border-subtle)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(var(--accent-rgb),0.3)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{item.icon}</div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '2px' }}>{item.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Reading Plan Preview */}
        {!activePlan ? (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Reading Plan</h3>
            <div 
              onClick={() => navigate('/plans')}
              className="card" 
              style={{ 
                border: '1px solid var(--border-subtle)', 
                cursor: 'pointer',
                background: 'linear-gradient(135deg, var(--bg-card), rgba(var(--accent-rgb),0.03))',
                position: 'relative',
                overflow: 'hidden',
                transition: 'border-color 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(var(--accent-rgb),0.3)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ fontSize: '2rem' }}>📅</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Start a Reading Plan</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>Stay consistent with daily guided readings</p>
                </div>
                <span style={{ color: 'var(--accent-gold)', fontWeight: 700, fontSize: '1.1rem' }}>→</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Reading Plan</h3>
              <button 
                onClick={() => navigate('/plans')} 
                style={{ background: 'none', border: 'none', color: 'var(--accent-gold)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Open Plan →
              </button>
            </div>
            <div className="card" style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <span style={{ fontSize: '1.2rem', marginRight: '6px' }}>{activePlan.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{activePlan.planName}</span>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Day {currentPlanDay} of {totalPlanDays}</p>
                </div>
                <span className="badge badge-gold">{activePlan.badge}</span>
              </div>
              
              <div className="progress-bar" style={{ marginBottom: '16px' }}>
                <div className="progress-fill" style={{ width: `${planProgressPercent}%` }} />
              </div>

              <div style={{ background: 'rgba(var(--accent-rgb),0.02)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '8px', letterSpacing: '0.04em' }}>Today's Passage</span>
                {todayReadings.length === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.1rem' }}>🎉</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      {activePlan.readings[currentPlanDay - 1]?.isRestDay 
                        ? activePlan.readings[currentPlanDay - 1].restLabel 
                        : 'All readings done for today!'}
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {todayReadings.map((reading, idx) => {
                      const isCompleted = !!activePlan.completedReadings[`${currentPlanDay}-${idx}`]
                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <button
                            onClick={() => handleReadingClick(reading.bookId, reading.startChapter)}
                            style={{
                              background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer',
                              color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)',
                              textDecoration: isCompleted ? 'line-through' : 'none',
                              fontSize: '0.85rem', fontWeight: 600, flex: 1, padding: 0
                            }}
                          >
                            📖 {reading.label ? `[${reading.label}] ` : ''}{reading.bookName} {reading.startChapter}{reading.endChapter !== reading.startChapter ? ` - ${reading.endChapter}` : ''}
                          </button>
                          <button
                            onClick={() => toggleReadingComplete(currentPlanDay, idx)}
                            style={{
                              background: isCompleted ? 'var(--accent-gold)' : 'transparent',
                              border: `1px solid ${isCompleted ? 'var(--accent-gold)' : 'var(--border)'}`,
                              borderRadius: '4px', width: '20px', height: '20px',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: 'var(--text-on-accent)', fontSize: '0.75rem', fontWeight: 700, padding: 0
                            }}
                          >
                            {isCompleted ? '✓' : ''}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '12px' }}>
                <span>{planProgressPercent}% complete</span>
                <span>{daysCompleted} / {totalPlanDays} days done</span>
              </div>
            </div>
          </div>
        )}

        {/* Scripture gems */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Scripture Gems</h3>
          {[
            { ref: 'Matthew 5:6', text: 'Blessed are those who hunger and thirst for righteousness, for they will be filled.', topic: 'Blessing' },
            { ref: 'Proverbs 3:5', text: 'Trust in the Lord with all your heart and lean not on your own understanding.', topic: 'Trust' },
          ].map(v => (
            <div key={v.ref} className="card" style={{ marginBottom: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--accent-gold)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{v.topic}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.ref}</span>
              </div>
              <p className="serif" style={{ fontSize: '1rem', lineHeight: '1.6', color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{v.text}"</p>
            </div>
          ))}
        </div>
      </div>


    </div>
  )
}
