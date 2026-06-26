import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBible, BIBLE_BOOKS, BIBLE_LANGUAGES } from '../contexts/BibleContext'
import { useBibleAPI } from '../hooks/useBibleAPI'
import AudioPlayer from '../components/AudioPlayer'
import { ChevronLeft } from 'lucide-react'


export default function BibleReader() {
  const navigate = useNavigate()
  const { selectedLanguage, changeLanguage, currentBook, setCurrentBook, currentChapter, setCurrentChapter, addBookmark, isBookmarked, fontSize, showToast, selectedVerse, setSelectedVerse, recordChapterRead } = useBible()
  const { getChapter } = useBibleAPI(selectedLanguage.code)

  const [verses, setVerses] = useState([])
  const [loading, setLoading] = useState(true)
  const [copyright, setCopyright] = useState('')
  const [showAudio, setShowAudio] = useState(false)
  

  // Navigator step variables
  const [showNavigator, setShowNavigator] = useState(false)
  const [navigatorStep, setNavigatorStep] = useState('book') // book | chapter | verse
  const [tempBook, setTempBook] = useState(null)
  const [tempChapter, setTempChapter] = useState(1)
  const [loadingVersesCount, setLoadingVersesCount] = useState(false)
  const [navigatorVersesCount, setNavigatorVersesCount] = useState(0)
  const [searchBooks, setSearchBooks] = useState('')
  const [testament, setTestament] = useState('NT')

  // Parallel/Multi-View Mode variables
  const [parallelLanguage, setParallelLanguage] = useState(null)
  const [parallelVerses, setParallelVerses] = useState([])
  const [showParallelPicker, setShowParallelPicker] = useState(false)
  const [showLangPicker, setShowLangPicker] = useState(false)

  const loadChapter = async () => {
    setLoading(true)
    const startTime = Date.now()
    try {
      const result = await getChapter(currentBook.id, currentChapter)
      
      let resultParallel = null
      if (parallelLanguage) {
        resultParallel = await getChapter(currentBook.id, currentChapter, parallelLanguage.code)
      }

      // Enforce a minimum display time of 2.5 seconds (2500ms) for a smooth lazy loading transition on mobile
      const elapsed = Date.now() - startTime
      const delay = Math.max(0, 2500 - elapsed)
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }

      setVerses(result.verses || [])
      setCopyright(result.copyright || '')
      if (parallelLanguage && resultParallel) {
        setParallelVerses(resultParallel.verses || [])
      } else {
        setParallelVerses([])
      }
    } catch (err) {
      setVerses([])
      setParallelVerses([])
      showToast('Failed to load chapter. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadChapter()
  }, [currentBook, currentChapter, selectedLanguage, parallelLanguage])

  // Smooth scroll to selected verse and flash highlight
  useEffect(() => {
    if (selectedVerse && !loading) {
      setTimeout(() => {
        const el = document.getElementById(`verse-${selectedVerse}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          // Flash highlight to show which verse was jumped to
          el.style.transition = 'background 0.3s'
          el.style.background = 'rgba(var(--accent-rgb), 0.18)'
          setTimeout(() => { el.style.background = '' }, 1500)
        }
      }, 200)
    }
  }, [verses, selectedVerse, loading])

  // Clear selected verse on unmount
  useEffect(() => {
    return () => {
      setSelectedVerse(null)
    }
  }, [setSelectedVerse])


  const nextChapter = () => {
    setSelectedVerse(null)
    recordChapterRead()
    if (currentChapter < currentBook.chapters) {
      setCurrentChapter(currentChapter + 1)
    } else {
      const idx = BIBLE_BOOKS.findIndex(b => b.id === currentBook.id)
      if (idx < BIBLE_BOOKS.length - 1) {
        setCurrentBook(BIBLE_BOOKS[idx + 1])
        setCurrentChapter(1)
      }
    }
  }

  const prevChapter = () => {
    setSelectedVerse(null)
    recordChapterRead()
    if (currentChapter > 1) {
      setCurrentChapter(currentChapter - 1)
    } else {
      const idx = BIBLE_BOOKS.findIndex(b => b.id === currentBook.id)
      if (idx > 0) {
        const prev = BIBLE_BOOKS[idx - 1]
        setCurrentBook(prev)
        setCurrentChapter(prev.chapters)
      }
    }
  }

  // Unified Navigator Helpers
  const openNavigator = (step = 'book') => {
    setTempBook(currentBook)
    setTempChapter(currentChapter)
    setNavigatorStep(step)
    setShowNavigator(true)
  }

  const handleNavigatorBookSelect = (book) => {
    setTempBook(book)
    setNavigatorStep('chapter')
  }

  const handleNavigatorChapterSelect = async (ch) => {
    setTempChapter(ch)
    setLoadingVersesCount(true)
    try {
      const result = await getChapter(tempBook.id, ch, selectedLanguage.code)
      const count = result.verses ? result.verses.length : 0
      setNavigatorVersesCount(count || 30)
    } catch (err) {
      setNavigatorVersesCount(30)
    } finally {
      setLoadingVersesCount(false)
      setNavigatorStep('verse')
    }
  }

  const handleNavigatorVerseSelect = (verseNum) => {
    setCurrentBook(tempBook)
    setCurrentChapter(tempChapter)
    setSelectedVerse(verseNum)
    setShowNavigator(false)
  }

  const filteredBooks = BIBLE_BOOKS.filter(b =>
    b.testament === testament &&
    b.name.toLowerCase().includes(searchBooks.toLowerCase())
  )

  return (
    <div className="content-wrapper page-enter">
      {/* Header */}
      <div className="app-header" style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '12px', height: 'auto' }}>
        <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
            <ChevronLeft size={20} />
          </button>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => openNavigator('book')}
              style={{ background: 'rgba(var(--accent-rgb), 0.06)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 600 }}
            >
              {currentBook.name}
            </button>
            <button
              onClick={() => openNavigator('chapter')}
              style={{ background: 'rgba(var(--accent-rgb),0.1)', border: '1px solid rgba(var(--accent-rgb),0.3)', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', color: 'var(--accent-gold)', fontSize: '0.9rem', fontWeight: 700, minWidth: '48px' }}
            >
              {currentChapter}
            </button>
          </div>
          
          <button onClick={() => setShowAudio(!showAudio)} style={{ background: 'none', border: 'none', color: showAudio ? 'var(--accent-gold)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '1.3rem' }}>
            🎵
          </button>
        </div>

        {/* Second Row: Language & Parallel selections */}
        <div style={{ display: 'flex', gap: '8px', width: '100%', padding: '0 4px' }}>
          <button
            onClick={() => setShowLangPicker(true)}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'rgba(var(--accent-rgb),0.06)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '0.8rem' }}
          >
            <span>{selectedLanguage.flag}</span>
            <span style={{ fontWeight: 600 }}>{selectedLanguage.version}</span>
          </button>

          <button
            onClick={() => setShowParallelPicker(true)}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: parallelLanguage ? 'rgba(var(--accent-rgb),0.12)' : 'rgba(var(--accent-rgb),0.02)', border: `1px solid ${parallelLanguage ? 'rgba(var(--accent-rgb),0.4)' : 'var(--border-subtle)'}`, borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', color: parallelLanguage ? 'var(--accent-gold)' : 'var(--text-secondary)', fontSize: '0.8rem' }}
          >
            <span>📑</span>
            <span style={{ fontWeight: 600 }}>{parallelLanguage ? `Compare: ${parallelLanguage.version}` : 'Parallel View'}</span>
          </button>
        </div>
      </div>

      {/* Audio Player */}
      {showAudio && (
        <div style={{ padding: '12px 20px 0' }}>
          <AudioPlayer book={currentBook} chapter={currentChapter} language={selectedLanguage} />
        </div>
      )}

      {/* Language badge */}
      <div style={{ padding: '10px 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '0.9rem' }}>{selectedLanguage.flag}</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {selectedLanguage.name} • {selectedLanguage.version}
          {parallelLanguage && ` / ${parallelLanguage.name} • ${parallelLanguage.version}`}
        </span>
      </div>

      {/* Verses */}
      <div style={{ padding: '16px 20px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="shimmer" style={{ height: '60px', borderRadius: '8px' }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {verses.map(verse => {
              const parallelVerse = parallelVerses.find(pv => pv.number === verse.number)
              const isVerseSelected = selectedVerse === verse.number || selectedVerse?.id === verse.id
              const bookmarked = isBookmarked(verse.id)

              return (
                <div
                  key={verse.id}
                  id={`verse-${verse.number}`}
                  onClick={() => setSelectedVerse(isVerseSelected ? null : verse.number)}
                  className={bookmarked ? 'verse-highlighted' : ''}
                  style={{
                    padding: '8px 8px',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    transition: 'background 0.15s',
                    background: isVerseSelected ? 'rgba(var(--accent-rgb), 0.08)' : ''
                  }}
                  onMouseEnter={e => !bookmarked && !isVerseSelected && (e.currentTarget.style.background = 'rgba(var(--accent-rgb), 0.02)')}
                  onMouseLeave={e => !isVerseSelected && (e.currentTarget.style.background = '')}
                >
                  <p className="verse-text" style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}>
                    <sup className="verse-number" style={{ color: 'var(--accent-gold)', marginRight: '6px', fontWeight: 600 }}>{verse.number}</sup>
                    {verse.text}
                  </p>

                  {parallelLanguage && parallelVerse && (
                    <div style={{ marginTop: '6px', borderLeft: '3px solid var(--accent-gold)', paddingLeft: '10px', opacity: 0.85 }}>
                      <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--accent-gold)', display: 'block', marginBottom: '2px', fontWeight: 600 }}>{parallelLanguage.version}</span>
                      <p className="verse-text" style={{ fontSize: `${fontSize - 1}px`, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                        {parallelVerse.text}
                      </p>
                    </div>
                  )}

                  {isVerseSelected && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                      <button
                        onClick={e => { e.stopPropagation(); addBookmark({ id: verse.id, reference: `${currentBook.name} ${currentChapter}:${verse.number}`, text: verse.text, book: currentBook.name, chapter: currentChapter, verse: verse.number }) }}
                        style={{ flex: 1, background: bookmarked ? 'rgba(var(--accent-rgb), 0.15)' : 'rgba(var(--accent-rgb), 0.04)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: bookmarked ? 'var(--accent-gold)' : 'var(--text-muted)', fontSize: '0.8rem' }}
                      >
                        {bookmarked ? '🔖 Saved' : '🕮 Save'}
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(`"${verse.text}" — ${currentBook.name} ${currentChapter}:${verse.number}`); showToast('Verse copied!') }}
                        style={{ flex: 1, background: 'rgba(var(--accent-rgb), 0.04)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.8rem' }}
                      >
                        📋 Copy
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); if (navigator.share) navigator.share({ text: `"${verse.text}" — ${currentBook.name} ${currentChapter}:${verse.number}` }) }}
                        style={{ flex: 1, background: 'rgba(var(--accent-rgb), 0.04)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.8rem' }}
                      >
                        ↗ Share
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {copyright && (
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '24px', textAlign: 'center', lineHeight: 1.5 }}>{copyright}</p>
        )}
      </div>

      {/* Chapter Navigation */}
      <div style={{ padding: '0 20px 20px', display: 'flex', gap: '12px' }}>
        <button className="btn-ghost" style={{ flex: 1, padding: '10px' }} onClick={prevChapter}>← Previous</button>
        <button className="btn-gold" style={{ flex: 1, padding: '10px' }} onClick={nextChapter}>Next →</button>
      </div>



      {/* Navigator Modal */}
      {showNavigator && (
        <div className="modal-overlay" onClick={() => setShowNavigator(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: '85vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Bible Navigator</h3>
              <button onClick={() => setShowNavigator(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
            </div>

            {/* Step Selection Tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: 'var(--bg-primary)', padding: '4px', borderRadius: '8px' }}>
              {['book', 'chapter', 'verse'].map((step) => {
                const isActive = navigatorStep === step;
                const isEnabled = step === 'book' || (step === 'chapter' && tempBook) || (step === 'verse' && tempBook && tempChapter);
                return (
                  <button
                    key={step}
                    disabled={!isEnabled}
                    onClick={() => setNavigatorStep(step)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '6px',
                      background: isActive ? 'var(--accent-gold)' : 'transparent',
                      color: isActive ? 'var(--text-on-accent)' : isEnabled ? 'var(--text-primary)' : 'var(--text-muted)',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '0.8rem',
                      cursor: isEnabled ? 'pointer' : 'not-allowed',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      border: 'none'
                    }}
                  >
                    {step}
                  </button>
                )
              })}
            </div>

            {/* Step Content */}
            {navigatorStep === 'book' && (
              <>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  <button onClick={() => setTestament('OT')} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid', borderColor: testament === 'OT' ? 'var(--accent-gold)' : 'var(--border-subtle)', background: testament === 'OT' ? 'rgba(var(--accent-rgb),0.1)' : 'transparent', color: testament === 'OT' ? 'var(--accent-gold)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>Old Testament</button>
                  <button onClick={() => setTestament('NT')} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid', borderColor: testament === 'NT' ? 'var(--accent-gold)' : 'var(--border-subtle)', background: testament === 'NT' ? 'rgba(var(--accent-rgb),0.1)' : 'transparent', color: testament === 'NT' ? 'var(--accent-gold)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>New Testament</button>
                </div>
                <input
                  className="input-field"
                  placeholder="Search books..."
                  value={searchBooks}
                  onChange={e => setSearchBooks(e.target.value)}
                  style={{ marginBottom: '12px', width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', overflowY: 'auto', maxHeight: '40vh' }}>
                  {filteredBooks.map(book => (
                    <button
                      key={book.id}
                      onClick={() => handleNavigatorBookSelect(book)}
                      style={{ padding: '10px 12px', textAlign: 'left', background: tempBook?.id === book.id ? 'rgba(var(--accent-rgb),0.1)' : 'rgba(var(--accent-rgb),0.03)', border: `1px solid ${tempBook?.id === book.id ? 'rgba(var(--accent-rgb),0.4)' : 'var(--border-subtle)'}`, borderRadius: '8px', cursor: 'pointer', color: tempBook?.id === book.id ? 'var(--accent-gold)' : 'var(--text-primary)', fontSize: '0.85rem', fontWeight: tempBook?.id === book.id ? 600 : 400 }}
                    >
                      <div>{book.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>{book.chapters} ch</div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {navigatorStep === 'chapter' && tempBook && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', maxHeight: '50vh', overflowY: 'auto' }}>
                {Array.from({ length: tempBook.chapters }, (_, i) => i + 1).map(ch => (
                  <button
                    key={ch}
                    onClick={() => handleNavigatorChapterSelect(ch)}
                    style={{ padding: '12px 4px', textAlign: 'center', background: tempChapter === ch ? 'linear-gradient(135deg, var(--accent-gold), var(--accent-amber))' : 'rgba(var(--accent-rgb),0.04)', border: '1px solid', borderColor: tempChapter === ch ? 'transparent' : 'var(--border-subtle)', borderRadius: '8px', cursor: 'pointer', color: tempChapter === ch ? 'var(--text-on-accent)' : 'var(--text-primary)', fontWeight: tempChapter === ch ? 700 : 400, fontSize: '0.9rem' }}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            )}

            {navigatorStep === 'verse' && tempBook && tempChapter && (
              <div>
                {loadingVersesCount ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', padding: '20px' }}>
                    <div className="shimmer" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Loading verses...</span>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', maxHeight: '50vh', overflowY: 'auto' }}>
                    {Array.from({ length: navigatorVersesCount }, (_, i) => i + 1).map(v => (
                      <button
                        key={v}
                        onClick={() => handleNavigatorVerseSelect(String(v))}
                        style={{ padding: '12px 4px', textAlign: 'center', background: selectedVerse === String(v) ? 'linear-gradient(135deg, var(--accent-gold), var(--accent-amber))' : 'rgba(var(--accent-rgb),0.04)', border: '1px solid', borderColor: selectedVerse === String(v) ? 'transparent' : 'var(--border-subtle)', borderRadius: '8px', cursor: 'pointer', color: selectedVerse === String(v) ? 'var(--text-on-accent)' : 'var(--text-primary)', fontWeight: selectedVerse === String(v) ? 700 : 400, fontSize: '0.9rem' }}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Primary Language Picker Modal */}
      {showLangPicker && (
        <div className="modal-overlay" onClick={() => setShowLangPicker(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontWeight: 600 }}>Choose Primary Language</h3>
              <button onClick={() => setShowLangPicker(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {BIBLE_LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => { changeLanguage(lang); setShowLangPicker(false) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '14px 16px', borderRadius: 'var(--radius)',
                    background: selectedLanguage.code === lang.code ? 'rgba(var(--accent-rgb),0.12)' : 'rgba(var(--accent-rgb),0.03)',
                    border: `1px solid ${selectedLanguage.code === lang.code ? 'rgba(var(--accent-rgb),0.4)' : 'var(--border-subtle)'}`,
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }}>{lang.flag}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.95rem' }}>{lang.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '2px' }}>{lang.version}</div>
                  </div>
                  {selectedLanguage.code === lang.code && <span style={{ color: 'var(--accent-gold)' }}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Parallel Language Picker Modal */}
      {showParallelPicker && (
        <div className="modal-overlay" onClick={() => setShowParallelPicker(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontWeight: 600 }}>Choose Parallel Translation</h3>
              <button onClick={() => setShowParallelPicker(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => { setParallelLanguage(null); setShowParallelPicker(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '14px 16px', borderRadius: 'var(--radius)',
                  background: !parallelLanguage ? 'rgba(var(--accent-rgb),0.12)' : 'rgba(var(--accent-rgb),0.03)',
                  border: `1px solid ${!parallelLanguage ? 'rgba(var(--accent-rgb),0.4)' : 'var(--border-subtle)'}`,
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>❌</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.95rem' }}>Single View (None)</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '2px' }}>Hide secondary translation</div>
                </div>
                {!parallelLanguage && <span style={{ color: 'var(--accent-gold)' }}>✓</span>}
              </button>

              {BIBLE_LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => { setParallelLanguage(lang); setShowParallelPicker(false) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '14px 16px', borderRadius: 'var(--radius)',
                    background: parallelLanguage?.code === lang.code ? 'rgba(var(--accent-rgb),0.12)' : 'rgba(var(--accent-rgb),0.03)',
                    border: `1px solid ${parallelLanguage?.code === lang.code ? 'rgba(var(--accent-rgb),0.4)' : 'var(--border-subtle)'}`,
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }}>{lang.flag}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.95rem' }}>{lang.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '2px' }}>{lang.version}</div>
                  </div>
                  {parallelLanguage?.code === lang.code && <span style={{ color: 'var(--accent-gold)' }}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
