import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBible, BIBLE_BOOKS } from '../contexts/BibleContext'
import { READING_PLANS_LIST } from '../utils/readingPlanGenerator'

export default function ReadingPlanScreen() {
  const navigate = useNavigate()
  const { 
    activePlan, startPlan, toggleReadingComplete, quitPlan, 
    setCurrentBook, setCurrentChapter, selectedLanguage, changeLanguage,
    streak
  } = useBible()
  
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [duration, setDuration] = useState(90) // default 90 days
  const [showConfirmQuit, setShowConfirmQuit] = useState(false)
  const [showDurationModal, setShowDurationModal] = useState(false)

  const handleReadingClick = (bookId, chapterNum) => {
    const book = BIBLE_BOOKS.find(b => b.id === bookId)
    if (book) {
      setCurrentBook(book)
      setCurrentChapter(chapterNum)
      navigate('/bible')
    }
  }

  // Calculate plan metrics
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

  const handleStartPlanClick = (plan) => {
    console.log('[ReadingPlanScreen] handleStartPlanClick for:', plan);
    if (plan.id === 'topical') {
      try {
        startPlan(plan.id, 30)
      } catch (err) {
        console.error('[ReadingPlanScreen] error starting topical plan:', err);
      }
    } else {
      setSelectedPlan(plan)
      setShowDurationModal(true)
    }
  }

  const confirmStartPlan = () => {
    console.log('[ReadingPlanScreen] confirmStartPlan clicked. selectedPlan:', selectedPlan, 'duration:', duration);
    if (selectedPlan) {
      try {
        startPlan(selectedPlan.id, duration)
        console.log('[ReadingPlanScreen] startPlan succeeded');
        setShowDurationModal(false)
        setSelectedPlan(null)
      } catch (err) {
        console.error('[ReadingPlanScreen] error in confirmStartPlan:', err);
      }
    } else {
      console.warn('[ReadingPlanScreen] confirmStartPlan called with null selectedPlan');
    }
  }

  return (
    <div className="content-wrapper page-enter">
      {/* Header */}
      <div className="app-header">
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>←</button>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 600 }}>
          {activePlan ? 'Active Reading Plan' : 'Bible Reading Plans'}
        </h2>
        <span style={{ fontSize: '1.3rem' }}>📅</span>
      </div>

      <div style={{ padding: '20px' }}>
        {!activePlan ? (
          /* Catalog Mode */
          <>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '20px' }}>
              Choose a reading plan below to help guide your daily study. You can select your preferred duration to pace yourself.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {READING_PLANS_LIST.map(plan => (
                <div 
                  key={plan.id}
                  className="card"
                  onClick={() => handleStartPlanClick(plan)}
                  style={{ 
                    display: 'flex', 
                    gap: '16px', 
                    border: '1px solid var(--border-subtle)', 
                    background: 'var(--bg-card)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(var(--accent-rgb),0.35)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                >
                  <div style={{ fontSize: '2.2rem', padding: '6px', background: 'rgba(var(--accent-rgb),0.04)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60px', width: '60px', flexShrink: 0 }}>
                    {plan.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <h4 style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{plan.name}</h4>
                      <span className="badge badge-gold">{plan.badge}</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '12px' }}>
                      {plan.desc}
                    </p>
                    <button
                      type="button"
                      className="btn-gold"
                      style={{ padding: '6px 16px', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                    >
                      {plan.id === 'topical' ? 'Start 30-Day Plan' : 'Choose Speed & Start'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Active Plan Dashboard Mode */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Overview Card */}
            <div className="card" style={{ background: 'linear-gradient(135deg, var(--bg-card), var(--bg-secondary))', border: '1px solid var(--border)', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ fontSize: '2rem' }}>{activePlan.icon}</span>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{activePlan.planName}</h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Started on {new Date(activePlan.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
                <span className="badge badge-gold">{activePlan.badge}</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '16px' }}>
                {/* Visual Progress ring */}
                <div style={{ position: 'relative', width: '70px', height: '70px', borderRadius: '50%', background: `conic-gradient(var(--accent-gold) ${planProgressPercent}%, var(--border) ${planProgressPercent}%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
                    {planProgressPercent}%
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Overall Progress</p>
                  <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 600, marginTop: '2px' }}>
                    {daysCompleted} of {totalPlanDays} days completed
                  </p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Speed: {activePlan.duration} Days
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>🔥 Reading Streak: <strong style={{ color: 'var(--accent-gold)' }}>{streak.count} days</strong></span>
                <button 
                  onClick={() => setShowConfirmQuit(true)} 
                  style={{ background: 'none', border: 'none', color: 'var(--error)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  Quit Plan
                </button>
              </div>
            </div>

            {/* Today's Reading Details */}
            <div>
              <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>Today's Readings</h3>
              <div className="card" style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}>
                {activePlan.readings[currentPlanDay - 1]?.languageLabel && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(var(--accent-rgb),0.06)', padding: '8px 12px', borderRadius: '8px', marginBottom: '14px', border: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                      🗣️ Suggested Script: <strong style={{ color: 'var(--accent-gold)' }}>{activePlan.readings[currentPlanDay - 1].languageLabel}</strong>
                    </span>
                    <button
                      onClick={() => {
                        const code = activePlan.readings[currentPlanDay - 1].languageCode
                        const selected = code === 'te' ? { code: 'te', name: 'Telugu (తెలుగు)', flag: '🇮🇳', version: 'BSI' } : { code: 'en', name: 'English', flag: '🇺🇸', version: 'KJV' }
                        changeLanguage(selected)
                      }}
                      style={{ background: 'var(--accent-gold)', color: 'var(--text-on-accent)', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Set Lang
                    </button>
                  </div>
                )}

                {todayReadings.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>🎉</span>
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                      {activePlan.readings[currentPlanDay - 1]?.isRestDay 
                        ? activePlan.readings[currentPlanDay - 1].restLabel 
                        : 'Day Complete!'}
                    </p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {activePlan.readings[currentPlanDay - 1]?.isRestDay ? 'Take some time to rest and meditate on what you read this week.' : 'Great job! Come back tomorrow for the next portion.'}
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {todayReadings.map((reading, idx) => {
                      const isCompleted = !!activePlan.completedReadings[`${currentPlanDay}-${idx}`]
                      return (
                        <div 
                          key={idx}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', background: 'var(--bg-primary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', transition: 'opacity 0.2s', opacity: isCompleted ? 0.7 : 1 }}
                        >
                          <div style={{ flex: 1 }}>
                            {reading.label && (
                              <span className="badge badge-gold" style={{ fontSize: '0.62rem', padding: '2px 6px', marginBottom: '4px' }}>{reading.label}</span>
                            )}
                            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: isCompleted ? 'line-through' : 'none' }}>
                              {reading.bookName} {reading.startChapter}{reading.endChapter !== reading.startChapter ? ` - ${reading.endChapter}` : ''}
                            </h4>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                              onClick={() => handleReadingClick(reading.bookId, reading.startChapter)}
                              style={{ background: 'rgba(var(--accent-rgb),0.1)', color: 'var(--accent-gold)', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 12px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                              Read
                            </button>
                            <button
                              onClick={() => toggleReadingComplete(currentPlanDay, idx)}
                              style={{
                                background: isCompleted ? 'var(--accent-gold)' : 'transparent',
                                border: `2px solid ${isCompleted ? 'var(--accent-gold)' : 'var(--border)'}`,
                                borderRadius: '50%', width: '26px', height: '26px',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'var(--text-on-accent)', fontSize: '0.85rem', fontWeight: 700, padding: 0
                              }}
                            >
                              {isCompleted ? '✓' : ''}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Timeline of Readings */}
            <div>
              <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>Plan Readings Timeline</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '40vh', overflowY: 'auto', paddingRight: '4px' }}>
                {activePlan.readings.map(rDay => {
                  const isDayComplete = rDay.isRestDay || (rDay.readings.length > 0 && rDay.readings.every((_, idx) => 
                    activePlan.completedReadings[`${rDay.day}-${idx}`]
                  ))
                  const isCurrent = rDay.day === currentPlanDay
                  
                  return (
                    <div 
                      key={rDay.day}
                      className="card"
                      style={{ 
                        padding: '12px 16px', 
                        border: '1px solid',
                        borderColor: isCurrent ? 'var(--accent-gold)' : 'var(--border-subtle)',
                        background: isCurrent ? 'rgba(var(--accent-rgb),0.02)' : isDayComplete ? 'rgba(var(--success),0.02)' : 'var(--bg-card)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: isCurrent ? 'var(--accent-gold)' : 'var(--text-primary)' }}>Day {rDay.day}</span>
                          {isCurrent && <span className="badge badge-gold" style={{ fontSize: '0.6rem', padding: '1px 4px' }}>Active</span>}
                          {isDayComplete && <span className="badge badge-green" style={{ fontSize: '0.6rem', padding: '1px 4px', background: 'rgba(56,158,138,0.1)' }}>Completed</span>}
                        </div>
                        <div style={{ marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {rDay.isRestDay ? (
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>☕ {rDay.restLabel}</span>
                          ) : (
                            rDay.readings.map((r, i) => (
                              <span 
                                key={i}
                                style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}
                              >
                                {r.bookName} {r.startChapter}{r.endChapter !== r.startChapter ? `-${r.endChapter}` : ''}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                      
                      {!rDay.isRestDay && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {rDay.readings.map((_, idx) => {
                            const isCheck = !!activePlan.completedReadings[`${rDay.day}-${idx}`]
                            return (
                              <button
                                key={idx}
                                onClick={() => toggleReadingComplete(rDay.day, idx)}
                                style={{
                                  background: isCheck ? 'var(--accent-gold)' : 'transparent',
                                  border: `1px solid ${isCheck ? 'var(--accent-gold)' : 'var(--border)'}`,
                                  borderRadius: '4px', width: '16px', height: '16px',
                                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  color: 'var(--text-on-accent)', fontSize: '0.65rem', padding: 0
                                }}
                                title={`Mark portion ${idx + 1} complete`}
                              >
                                {isCheck ? '✓' : ''}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Speed / Duration Selector Modal */}
      {showDurationModal && selectedPlan && (
        <div className="modal-overlay" onClick={() => setShowDurationModal(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontWeight: 600, fontSize: '1.1rem' }}>Plan Setup: {selectedPlan.name}</h3>
              <button onClick={() => setShowDurationModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
                Select your reading speed. We will divide the chapters dynamically to fit this schedule.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { value: 30, label: 'Express (30 Days)', desc: 'Fast pace (approx. 40 chapters/day). Best for a rapid overview.' },
                  { value: 90, label: 'Medium (90 Days)', desc: 'Moderate pace (approx. 13 chapters/day). Great for a quarter-year study.' },
                  { value: 365, label: 'Deep (365 Days)', desc: 'Standard pace (approx. 3-4 chapters/day). Great for a daily year-long habit.' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setDuration(opt.value)}
                    style={{
                      display: 'flex', flexDirection: 'column', textAlign: 'left',
                      padding: '12px 16px', borderRadius: 'var(--radius)',
                      background: duration === opt.value ? 'rgba(var(--accent-rgb),0.12)' : 'rgba(var(--accent-rgb),0.02)',
                      border: `1px solid ${duration === opt.value ? 'var(--accent-gold)' : 'var(--border-subtle)'}`,
                      cursor: 'pointer', width: '100%'
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{opt.label}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowDurationModal(false)}>Cancel</button>
              <button className="btn-gold" style={{ flex: 1 }} onClick={confirmStartPlan}>Start Plan</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Quit Modal */}
      {showConfirmQuit && (
        <div className="modal-overlay" onClick={() => setShowConfirmQuit(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: 600, marginBottom: '12px' }}>Quit Reading Plan?</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
              Are you sure you want to stop this plan? Your current progress will be lost and cannot be recovered.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowConfirmQuit(false)}>Keep Plan</button>
              <button className="btn-gold" style={{ flex: 1, background: 'var(--error)' }} onClick={() => { quitPlan(); setShowConfirmQuit(false) }}>Yes, Quit Plan</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
