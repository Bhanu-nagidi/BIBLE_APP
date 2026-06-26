import React, { createContext, useContext, useState, useEffect } from 'react'
import { generateReadingPlan, READING_PLANS_LIST } from '../utils/readingPlanGenerator'
import { useAuth } from './AuthContext'
import { VERSE_OF_THE_DAY_365 } from '../utils/dailyVerses'

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

// Kept for backward-compat — new code uses VERSE_OF_THE_DAY_365
export const VERSE_OF_THE_DAY_LIST = VERSE_OF_THE_DAY_365

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

  // Load and initialize streak settings on active user change
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

    if (isGuest) {
      // Guest: Visiting immediately completes today's streak
      if (currentStreak.lastVisit !== today) {
        const history = currentStreak.history || []
        const yesterdayWasCompleted = history.includes(yesterdayStr)
        const newCount = (currentStreak.lastVisit === yesterdayStr || yesterdayWasCompleted) ? currentStreak.count + 1 : 1
        const newHistory = history.includes(today) ? history : [...history, today].slice(-60)
        
        const dailyDetails = currentStreak.dailyDetails || {}
        if (!dailyDetails[today]) {
          dailyDetails[today] = { timeSpent: 0, chaptersRead: 0, firstVisit: new Date().toISOString() }
        }
        
        currentStreak = { ...currentStreak, count: newCount, lastVisit: today, history: newHistory, dailyDetails }
        localStorage.setItem(key, JSON.stringify(currentStreak))
      }
    } else {
      // Registered User: Initialize today but do NOT mark as completed yet
      const dailyDetails = currentStreak.dailyDetails || {}
      if (!dailyDetails[today]) {
        dailyDetails[today] = { timeSpent: 0, chaptersRead: 0, firstVisit: new Date().toISOString() }
        localStorage.setItem(key, JSON.stringify(currentStreak))
      }
      
      const history = currentStreak.history || []
      const todayCompleted = history.includes(today)
      const yesterdayCompleted = history.includes(yesterdayStr)
      
      if (!todayCompleted) {
        if (yesterdayCompleted) {
          // Keep count active at yesterday's streak (will increment when today's goal is met)
          currentStreak.count = currentStreak.count || 1
        } else {
          // Streak broken until today's goal is met
          currentStreak.count = 0
        }
      }
    }

    setStreak(currentStreak)
  }, [user, isGuest])
  const [currentBook, setCurrentBook] = useState(BIBLE_BOOKS[0])
  const [currentChapter, setCurrentChapter] = useState(1)
  const [fontSize, setFontSize] = useState(() => parseInt(localStorage.getItem('bible_fontsize') || '18'))
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const [toast, setToast] = useState(null)
  const [selectedVerse, setSelectedVerse] = useState(null)
  const [activePlan, setActivePlan] = useState(() => {
    const saved = localStorage.getItem('bible_active_plan')
    return saved ? JSON.parse(saved) : null
  })

  // ── Daily Reminder States & Schedulers ──────────────────────────────────────
  const [reminderOn, setReminderOn] = useState(false)
  const [reminderTime, setReminderTime] = useState('08:00')
  const reminderTimerRef = React.useRef(null)

  const getReminderOnKey = () => user ? `reminder_on_${user.id}` : null
  const getReminderTimeKey = () => user ? `reminder_time_${user.id}` : null

  const formatTimeAMPM = (timeStr) => {
    if (!timeStr) return ''
    const [hStr, mStr] = timeStr.split(':')
    const h = parseInt(hStr, 10)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const displayH = h % 12 === 0 ? 12 : h % 12
    return `${displayH}:${mStr} ${ampm}`
  }

  // Load reminder settings
  useEffect(() => {
    if (isGuest || !user) {
      setReminderOn(false)
      return
    }
    const onKey = getReminderOnKey()
    const timeKey = getReminderTimeKey()
    if (onKey && timeKey) {
      setReminderOn(localStorage.getItem(onKey) === 'true')
      setReminderTime(localStorage.getItem(timeKey) || '08:00')
    }
  }, [user, isGuest])

  const scheduleNextReminder = (timeStr) => {
    if (reminderTimerRef.current) clearTimeout(reminderTimerRef.current)
    if (!user || isGuest) return

    const [h, m] = timeStr.split(':').map(Number)
    const now = new Date()
    const next = new Date(now)
    next.setHours(h, m, 0, 0)
    if (next <= now) next.setDate(next.getDate() + 1)
    const ms = next - now

    console.log(`[Reminder] Scheduled daily calendar notification in ${Math.round(ms / 1000)}s at ${timeStr}`);

    reminderTimerRef.current = setTimeout(() => {
      if (Notification.permission === 'granted' && !isGuest && user) {
        new Notification('Sacred Word 📖', {
          body: `Hi ${user.user_metadata?.name || 'Beloved'}, it's time for your daily Bible reading. Keep your streak alive!`,
          icon: '/logo.jpg'
        })
      }
      scheduleNextReminder(timeStr) // reschedule for next day
    }, ms)
  }

  // Monitor changes to reminder settings and reschedule
  useEffect(() => {
    if (reminderOn && user && !isGuest) {
      scheduleNextReminder(reminderTime)
    } else {
      if (reminderTimerRef.current) {
        clearTimeout(reminderTimerRef.current)
        reminderTimerRef.current = null
      }
    }
    return () => {
      if (reminderTimerRef.current) clearTimeout(reminderTimerRef.current)
    }
  }, [reminderOn, reminderTime, user, isGuest])

  const toggleReminder = async () => {
    if (isGuest || !user) {
      showToast('Daily reminders are only available for registered accounts. Please sign in!')
      return
    }

    if (!reminderOn) {
      if (typeof Notification === 'undefined') {
        showToast('Notifications are not supported on this device')
        return
      }
      let perm = Notification.permission
      if (perm === 'default') {
        perm = await Notification.requestPermission()
      }
      if (perm !== 'granted') {
        showToast('Please allow notifications in your browser settings')
        return
      }

      const onKey = getReminderOnKey()
      if (onKey) {
        localStorage.setItem(onKey, 'true')
        setReminderOn(true)
        showToast(`⏰ Reminder set for ${formatTimeAMPM(reminderTime)} daily`)
      }
    } else {
      const onKey = getReminderOnKey()
      if (onKey) {
        localStorage.setItem(onKey, 'false')
        setReminderOn(false)
        showToast('Reminder turned off')
      }
    }
  }

  const changeReminderTime = (timeStr) => {
    const timeKey = getReminderTimeKey()
    if (timeKey) {
      localStorage.setItem(timeKey, timeStr)
      setReminderTime(timeStr)
      showToast(`⏰ Reminder time set to ${formatTimeAMPM(timeStr)}`)
    }
  }

  // Global Session Timer: Increments timeSpent and completes registered user streak goals
  useEffect(() => {
    const key = getStreakKey()
    if (!key) return

    const interval = setInterval(() => {
      const activeKey = getStreakKey()
      if (!activeKey) return

      const current = JSON.parse(localStorage.getItem(activeKey) || '{}')
      if (!current.dailyDetails) current.dailyDetails = {}
      
      const today = new Date().toDateString()
      if (!current.dailyDetails[today]) {
        current.dailyDetails[today] = { timeSpent: 0, chaptersRead: 0, firstVisit: new Date().toISOString() }
      }

      // Increment session active reading time (1s per tick)
      current.dailyDetails[today].timeSpent = (current.dailyDetails[today].timeSpent || 0) + 1
      
      // Registered user daily goal completion checks
      const history = current.history || []
      const alreadyCompleted = history.includes(today)
      
      if (!isGuest) {
        // Registered User Goal: 20 seconds time spent OR 1 chapter read
        const timeGoalMet = current.dailyDetails[today].timeSpent >= 20
        const chapterGoalMet = current.dailyDetails[today].chaptersRead >= 1
        
        if ((timeGoalMet || chapterGoalMet) && !alreadyCompleted) {
          current.history = [...history, today].slice(-60)
          
          const yesterday = new Date()
          yesterday.setDate(yesterday.getDate() - 1)
          const yesterdayStr = yesterday.toDateString()
          
          const yesterdayWasCompleted = history.includes(yesterdayStr)
          current.count = yesterdayWasCompleted ? (current.count || 0) + 1 : 1
          current.lastVisit = today
          
          showToast(`🔥 Streak milestone! Today completed (${current.count} days)`)
        }
      }

      localStorage.setItem(activeKey, JSON.stringify(current))
      setStreak(current)
    }, 1000)

    return () => clearInterval(interval)
  }, [user, isGuest])

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
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 0)
    const dayOfYear = Math.floor((now - start) / 86400000) // 1-365
    return VERSE_OF_THE_DAY_365[(dayOfYear - 1) % VERSE_OF_THE_DAY_365.length]
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
      reminderOn, reminderTime, toggleReminder, changeReminderTime, formatTimeAMPM,
    }}>
      {children}
    </BibleContext.Provider>
  )
}

export function useBible() {
  return useContext(BibleContext)
}
