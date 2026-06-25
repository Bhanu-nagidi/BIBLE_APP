import React, { createContext, useContext, useState, useEffect } from 'react'
import { generateReadingPlan, READING_PLANS_LIST } from '../utils/readingPlanGenerator'
import { useAuth } from './AuthContext'

const BibleContext = createContext(null)

export const BIBLE_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸', version: 'KJV' },
  { code: 'hi', name: 'Hindi (हिन्दी)', flag: '🇮🇳', version: 'BSI' },
  { code: 'te', name: 'Telugu (తెలుగు)', flag: '🇮🇳', version: 'BSI' },
  { code: 'ta', name: 'Tamil (தமிழ்)', flag: '🇮🇳', version: 'BSI' },
  { code: 'ml', name: 'Malayalam (മലയാളം)', flag: '🇮🇳', version: 'BSI' },
  { code: 'kn', name: 'Kannada (ಕನ್ನಡ)', flag: '🇮🇳', version: 'BSI' },
  { code: 'bn', name: 'Bengali (বাংলা)', flag: '🇮🇳', version: 'BSI' },
  { code: 'gu', name: 'Gujarati (ગુજરાતી)', flag: '🇮🇳', version: 'BSI' },
  { code: 'pa', name: 'Punjabi (ਪੰਜਾਬੀ)', flag: '🇮🇳', version: 'BSI' },
  { code: 'or', name: 'Odia (ଓଡ଼ିଆ)', flag: '🇮🇳', version: 'BSI' },
]

export const VERSE_OF_THE_DAY_LIST = [
  { book: 'John', chapter: 3, verse: 16, reference: 'John 3:16', text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.' },
  { book: 'Psalm', chapter: 23, verse: 1, reference: 'Psalm 23:1', text: 'The Lord is my shepherd; I shall not want.' },
  { book: 'Philippians', chapter: 4, verse: 13, reference: 'Philippians 4:13', text: 'I can do all things through Christ who strengthens me.' },
  { book: 'Jeremiah', chapter: 29, verse: 11, reference: 'Jeremiah 29:11', text: 'For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.' },
  { book: 'Romans', chapter: 8, verse: 28, reference: 'Romans 8:28', text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.' },
  { book: 'Isaiah', chapter: 41, verse: 10, reference: 'Isaiah 41:10', text: 'So do not fear, for I am with you; do not be dismayed, for I am your God.' },
  { book: 'Matthew', chapter: 6, verse: 33, reference: 'Matthew 6:33', text: 'But seek first his kingdom and his righteousness, and all these things will be given to you as well.' },
]

export const BIBLE_BOOKS = [
  // Old Testament
  { id: 'GEN', name: 'Genesis', chapters: 50, testament: 'OT' },
  { id: 'EXO', name: 'Exodus', chapters: 40, testament: 'OT' },
  { id: 'LEV', name: 'Leviticus', chapters: 27, testament: 'OT' },
  { id: 'NUM', name: 'Numbers', chapters: 36, testament: 'OT' },
  { id: 'DEU', name: 'Deuteronomy', chapters: 34, testament: 'OT' },
  { id: 'JOS', name: 'Joshua', chapters: 24, testament: 'OT' },
  { id: 'JDG', name: 'Judges', chapters: 21, testament: 'OT' },
  { id: 'RUT', name: 'Ruth', chapters: 4, testament: 'OT' },
  { id: '1SA', name: '1 Samuel', chapters: 31, testament: 'OT' },
  { id: '2SA', name: '2 Samuel', chapters: 24, testament: 'OT' },
  { id: '1KI', name: '1 Kings', chapters: 22, testament: 'OT' },
  { id: '2KI', name: '2 Kings', chapters: 25, testament: 'OT' },
  { id: '1CH', name: '1 Chronicles', chapters: 29, testament: 'OT' },
  { id: '2CH', name: '2 Chronicles', chapters: 36, testament: 'OT' },
  { id: 'EZR', name: 'Ezra', chapters: 10, testament: 'OT' },
  { id: 'NEH', name: 'Nehemiah', chapters: 13, testament: 'OT' },
  { id: 'EST', name: 'Esther', chapters: 10, testament: 'OT' },
  { id: 'JOB', name: 'Job', chapters: 42, testament: 'OT' },
  { id: 'PSA', name: 'Psalms', chapters: 150, testament: 'OT' },
  { id: 'PRO', name: 'Proverbs', chapters: 31, testament: 'OT' },
  { id: 'ECC', name: 'Ecclesiastes', chapters: 12, testament: 'OT' },
  { id: 'SNG', name: 'Song of Solomon', chapters: 8, testament: 'OT' },
  { id: 'ISA', name: 'Isaiah', chapters: 66, testament: 'OT' },
  { id: 'JER', name: 'Jeremiah', chapters: 52, testament: 'OT' },
  { id: 'LAM', name: 'Lamentations', chapters: 5, testament: 'OT' },
  { id: 'EZK', name: 'Ezekiel', chapters: 48, testament: 'OT' },
  { id: 'DAN', name: 'Daniel', chapters: 12, testament: 'OT' },
  { id: 'HOS', name: 'Hosea', chapters: 14, testament: 'OT' },
  { id: 'JOL', name: 'Joel', chapters: 3, testament: 'OT' },
  { id: 'AMO', name: 'Amos', chapters: 9, testament: 'OT' },
  { id: 'OBA', name: 'Obadiah', chapters: 1, testament: 'OT' },
  { id: 'JON', name: 'Jonah', chapters: 4, testament: 'OT' },
  { id: 'MIC', name: 'Micah', chapters: 7, testament: 'OT' },
  { id: 'NAM', name: 'Nahum', chapters: 3, testament: 'OT' },
  { id: 'HAB', name: 'Habakkuk', chapters: 3, testament: 'OT' },
  { id: 'ZEP', name: 'Zephaniah', chapters: 3, testament: 'OT' },
  { id: 'HAG', name: 'Haggai', chapters: 2, testament: 'OT' },
  { id: 'ZEC', name: 'Zechariah', chapters: 14, testament: 'OT' },
  { id: 'MAL', name: 'Malachi', chapters: 4, testament: 'OT' },
  // New Testament
  { id: 'MAT', name: 'Matthew', chapters: 28, testament: 'NT' },
  { id: 'MRK', name: 'Mark', chapters: 16, testament: 'NT' },
  { id: 'LUK', name: 'Luke', chapters: 24, testament: 'NT' },
  { id: 'JHN', name: 'John', chapters: 21, testament: 'NT' },
  { id: 'ACT', name: 'Acts', chapters: 28, testament: 'NT' },
  { id: 'ROM', name: 'Romans', chapters: 16, testament: 'NT' },
  { id: '1CO', name: '1 Corinthians', chapters: 16, testament: 'NT' },
  { id: '2CO', name: '2 Corinthians', chapters: 13, testament: 'NT' },
  { id: 'GAL', name: 'Galatians', chapters: 6, testament: 'NT' },
  { id: 'EPH', name: 'Ephesians', chapters: 6, testament: 'NT' },
  { id: 'PHP', name: 'Philippians', chapters: 4, testament: 'NT' },
  { id: 'COL', name: 'Colossians', chapters: 4, testament: 'NT' },
  { id: '1TH', name: '1 Thessalonians', chapters: 5, testament: 'NT' },
  { id: '2TH', name: '2 Thessalonians', chapters: 3, testament: 'NT' },
  { id: '1TI', name: '1 Timothy', chapters: 6, testament: 'NT' },
  { id: '2TI', name: '2 Timothy', chapters: 4, testament: 'NT' },
  { id: 'TIT', name: 'Titus', chapters: 3, testament: 'NT' },
  { id: 'PHM', name: 'Philemon', chapters: 1, testament: 'NT' },
  { id: 'HEB', name: 'Hebrews', chapters: 13, testament: 'NT' },
  { id: 'JAS', name: 'James', chapters: 5, testament: 'NT' },
  { id: '1PE', name: '1 Peter', chapters: 5, testament: 'NT' },
  { id: '2PE', name: '2 Peter', chapters: 3, testament: 'NT' },
  { id: '1JN', name: '1 John', chapters: 5, testament: 'NT' },
  { id: '2JN', name: '2 John', chapters: 1, testament: 'NT' },
  { id: '3JN', name: '3 John', chapters: 1, testament: 'NT' },
  { id: 'JUD', name: 'Jude', chapters: 1, testament: 'NT' },
  { id: 'REV', name: 'Revelation', chapters: 22, testament: 'NT' },
]

function migrateBookmarks(savedBookmarks) {
  let modified = false
  const migrated = savedBookmarks.map(b => {
    let newId = b.id
    let bookName = b.book
    let chapter = b.chapter
    let verse = b.verse

    // Migrate simple number IDs (like "20") if book is present
    if (bookName && chapter && verse && (!newId || !newId.includes('_'))) {
      const bookObj = BIBLE_BOOKS.find(book => book.name === bookName)
      if (bookObj) {
        newId = `${bookObj.id}_${chapter}_${verse}`
        modified = true
      }
    }

    // Populate missing book/chapter/verse fields if ID is unique (like "REV_1_20")
    if (newId && newId.includes('_') && (!bookName || !chapter || !verse)) {
      const parts = newId.split('_')
      if (parts.length === 3) {
        const bookObj = BIBLE_BOOKS.find(book => book.id === parts[0])
        if (bookObj) {
          bookName = bookObj.name
          chapter = parseInt(parts[1], 10)
          verse = parseInt(parts[2], 10)
          modified = true
        }
      }
    }

    // Fix Telugu Revelation 1:20 verse truncation
    let text = b.text
    if (
      (newId === 'REV_1_20' || b.reference === 'Revelation 1:20' || b.reference?.includes('ప్రకటన') || b.reference?.includes('Rev')) &&
      text && text.includes('అనగా నా కుడిచేతిలో') && 
      !text.includes('ఆ యేడు దీపస్తంభములు')
    ) {
      text = "అనగా నా కుడిచేతిలో నీవు చూచిన యేడు నక్షత్రములనుగూర్చిన మర్మమును, ఆ యేడు సువర్ణ దీపస్తంభముల సంగతియు వ్రాయుము. ఆ యేడు నక్షత్రములు ఏడు సంఘములకు దూతలు. ఆ యేడు దీపస్తంభములు ఏడు సంఘములు."
      modified = true
    }

    return {
      ...b,
      id: newId,
      book: bookName,
      chapter,
      verse,
      text
    }
  })

  if (modified) {
    try {
      localStorage.setItem('bible_bookmarks', JSON.stringify(migrated))
    } catch (e) {
      console.error('Failed to save migrated bookmarks:', e)
    }
  }
  return migrated
}

export function BibleProvider({ children }) {
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    const saved = localStorage.getItem('bible_language')
    return saved ? JSON.parse(saved) : BIBLE_LANGUAGES[0]
  })
  const [bookmarks, setBookmarks] = useState(() => {
    const saved = JSON.parse(localStorage.getItem('bible_bookmarks') || '[]')
    return migrateBookmarks(saved)
  })
  const { user, isGuest } = useAuth()
  const [streak, setStreak] = useState({ count: 0, lastVisit: null, history: [], dailyDetails: {} })

  const getStreakKey = () => {
    if (user) return `bible_streak_${user.id}`
    if (isGuest) return 'bible_streak_guest'
    return null
  }

  const userRef = React.useRef(user)
  const isGuestRef = React.useRef(isGuest)

  useEffect(() => {
    userRef.current = user
    isGuestRef.current = isGuest
  }, [user, isGuest])

  // Load and update streak based on active user
  useEffect(() => {
    const key = getStreakKey()
    if (!key) return

    const saved = localStorage.getItem(key)
    let currentStreak = saved ? JSON.parse(saved) : { count: 0, lastVisit: null, history: [], dailyDetails: {} }
    if (!currentStreak.dailyDetails) currentStreak.dailyDetails = {}

    const today = new Date().toDateString()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toDateString()

    if (currentStreak.lastVisit !== today) {
      const newCount = currentStreak.lastVisit === yesterdayStr ? currentStreak.count + 1 : 1
      const history = currentStreak.history || []
      const newHistory = history.includes(today) ? history : [...history, today].slice(-60)
      const dailyDetails = currentStreak.dailyDetails || {}
      if (!dailyDetails[today]) {
        dailyDetails[today] = { timeSpent: 0, chaptersRead: 0, firstVisit: new Date().toISOString() }
      }
      currentStreak = { ...currentStreak, count: newCount, lastVisit: today, history: newHistory, dailyDetails }
      localStorage.setItem(key, JSON.stringify(currentStreak))
    }

    setStreak(currentStreak)
  }, [user, isGuest])
  const [currentBook, setCurrentBook] = useState(BIBLE_BOOKS[0])
  const [currentChapter, setCurrentChapter] = useState(1)
  const [fontSize, setFontSize] = useState(() => parseInt(localStorage.getItem('bible_fontsize') || '18'))
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const [toast, setToast] = useState(null)
  // Track session start time for time-spent calculation
  const sessionStartRef = React.useRef(Date.now())

  const [selectedVerse, setSelectedVerse] = useState(null)
  const [activePlan, setActivePlan] = useState(() => {
    const saved = localStorage.getItem('bible_active_plan')
    return saved ? JSON.parse(saved) : null
  })

  // Track session time on app open
  useEffect(() => {
    sessionStartRef.current = Date.now()

    // On page unload, save time spent
    const handleUnload = () => {
      const elapsed = Math.round((Date.now() - sessionStartRef.current) / 1000)
      const key = userRef.current ? `bible_streak_${userRef.current.id}` : isGuestRef.current ? 'bible_streak_guest' : null
      if (!key) return

      const current = JSON.parse(localStorage.getItem(key) || '{}')
      if (current.dailyDetails) {
        const todayKey = new Date().toDateString()
        if (!current.dailyDetails[todayKey]) {
          current.dailyDetails[todayKey] = { timeSpent: 0, chaptersRead: 0 }
        }
        current.dailyDetails[todayKey].timeSpent = (current.dailyDetails[todayKey].timeSpent || 0) + elapsed
        localStorage.setItem(key, JSON.stringify(current))
      }
    }
    window.addEventListener('beforeunload', handleUnload)
    window.addEventListener('visibilitychange', () => {
      if (document.hidden) handleUnload()
      else sessionStartRef.current = Date.now()
    })
    return () => {
      handleUnload()
      window.removeEventListener('beforeunload', handleUnload)
    }
  }, [])

  const changeLanguage = (lang) => {
    setSelectedLanguage(lang)
    localStorage.setItem('bible_language', JSON.stringify(lang))
    showToast(`Language changed to ${lang.name} (${lang.version})`)
  }

  const addBookmark = (bookmark) => {
    const exists = bookmarks.find(b => b.id === bookmark.id)
    let newBookmarks
    if (exists) {
      newBookmarks = bookmarks.filter(b => b.id !== bookmark.id)
      showToast('Bookmark removed')
    } else {
      newBookmarks = [{ ...bookmark, savedAt: new Date().toISOString() }, ...bookmarks]
      showToast('Verse bookmarked ✓')
    }
    setBookmarks(newBookmarks)
    localStorage.setItem('bible_bookmarks', JSON.stringify(newBookmarks))
  }

  const isBookmarked = (id) => bookmarks.some(b => b.id === id)

  const changeFontSize = (size) => {
    setFontSize(size)
    localStorage.setItem('bible_fontsize', size)
  }

  const showToast = (message, duration = 2500) => {
    setToast(message)
    setTimeout(() => setToast(null), duration)
  }

  const verseOfTheDay = () => {
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000)
    return VERSE_OF_THE_DAY_LIST[dayOfYear % VERSE_OF_THE_DAY_LIST.length]
  }

  const startPlan = (planId, durationDays) => {
    console.log('[startPlan] called with:', planId, durationDays);
    try {
      const planInfo = READING_PLANS_LIST.find(p => p.id === planId)
      if (!planInfo) {
        console.warn('[startPlan] plan info not found for:', planId);
        return
      }
      
      const readings = generateReadingPlan(planId, durationDays)
      console.log('[startPlan] generated readings count:', readings?.length);
      
      const newPlan = {
        planId,
        planName: planInfo.name,
        icon: planInfo.icon,
        badge: planInfo.badge,
        duration: planId === 'topical' ? 30 : durationDays,
        startDate: new Date().toISOString(),
        readings,
        completedReadings: {}
      }
      console.log('[startPlan] setting new active plan:', newPlan);
      setActivePlan(newPlan)
      localStorage.setItem('bible_active_plan', JSON.stringify(newPlan))
      showToast(`Started plan: ${planInfo.name}!`)
    } catch (err) {
      console.error('[startPlan] failed inside context:', err);
      showToast('Error starting plan: ' + err.message);
    }
  }

  const toggleReadingComplete = (dayNum, readingIndex) => {
    if (!activePlan) return
    
    const key = `${dayNum}-${readingIndex}`
    const updatedCompleted = { ...activePlan.completedReadings }
    const wasCompleted = !!updatedCompleted[key]
    
    if (wasCompleted) {
      delete updatedCompleted[key]
    } else {
      updatedCompleted[key] = true
      // Record a chapter read for today
      const todayKey = new Date().toDateString()
      const key = getStreakKey()
      if (key) {
        const currentStreak = JSON.parse(localStorage.getItem(key) || '{}')
        if (currentStreak.dailyDetails) {
          if (!currentStreak.dailyDetails[todayKey]) {
            currentStreak.dailyDetails[todayKey] = { timeSpent: 0, chaptersRead: 0 }
          }
          currentStreak.dailyDetails[todayKey].chaptersRead = (currentStreak.dailyDetails[todayKey].chaptersRead || 0) + 1
          localStorage.setItem(key, JSON.stringify(currentStreak))
          setStreak(currentStreak)
        }
      }
    }
    
    const updatedPlan = {
      ...activePlan,
      completedReadings: updatedCompleted
    }
    setActivePlan(updatedPlan)
    localStorage.setItem('bible_active_plan', JSON.stringify(updatedPlan))
  }

  // Record chapter read manually (called from BibleReader)
  const recordChapterRead = () => {
    const todayKey = new Date().toDateString()
    const key = getStreakKey()
    if (!key) return
    setStreak(prev => {
      const updated = { ...prev }
      if (!updated.dailyDetails) updated.dailyDetails = {}
      if (!updated.dailyDetails[todayKey]) {
        updated.dailyDetails[todayKey] = { timeSpent: 0, chaptersRead: 0 }
      }
      updated.dailyDetails[todayKey].chaptersRead = (updated.dailyDetails[todayKey].chaptersRead || 0) + 1
      localStorage.setItem(key, JSON.stringify(updated))
      return updated
    })
  }

  const quitPlan = () => {
    setActivePlan(null)
    localStorage.removeItem('bible_active_plan')
    showToast('Reading plan stopped.')
  }

  return (
    <BibleContext.Provider value={{
      selectedLanguage, changeLanguage,
      bookmarks, addBookmark, isBookmarked,
      streak,
      currentBook, setCurrentBook,
      currentChapter, setCurrentChapter,
      fontSize, changeFontSize,
      isAudioPlaying, setIsAudioPlaying,
      toast, showToast,
      verseOfTheDay,
      selectedVerse, setSelectedVerse,
      activePlan, startPlan, toggleReadingComplete, quitPlan,
      recordChapterRead,
    }}>
      {children}
    </BibleContext.Provider>
  )
}

export function useBible() {
  return useContext(BibleContext)
}
