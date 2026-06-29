import { useCallback } from 'react'
import { BIBLE_BOOKS } from '../contexts/BibleContext'

// Raw JSON from godlytalias/Bible-Database
const GITHUB_RAW = 'https://raw.githubusercontent.com/godlytalias/Bible-Database/master'

const LANG_PATH_MAP = {
  en:  'English',
  hi:  'Hindi',
  te:  'Telugu',
  ta:  'Tamil',
  ml:  'Malayalam',
  kn:  'Kannada',
  or:  'Oriya',
  gu:  'Gujarati',
  bn:  'Bengali',
  pa:  'Punjabi',
}

const COPYRIGHT_MAP = {
  en: 'World English Bible (WEB) - Public Domain (No Copyright).',
  hi: 'Indian Revised Version (IRV) Hindi - CC-BY-SA 4.0 (BCS/unfoldingWord).',
  te: 'Indian Revised Version (IRV) Telugu - CC-BY-SA 4.0 (BCS/unfoldingWord).',
  ta: 'Indian Revised Version (IRV) Tamil - CC-BY-SA 4.0 (BCS/unfoldingWord).',
  ml: 'Indian Revised Version (IRV) Malayalam - CC-BY-SA 4.0 (BCS/unfoldingWord).',
  kn: 'Indian Revised Version (IRV) Kannada - CC-BY-SA 4.0 (BCS/unfoldingWord).',
  or: 'Oriya Bible Translation - Public Domain.',
  gu: 'Gujarati Bible Translation - Public Domain.',
  bn: 'Bengali Bible Translation - Public Domain.',
  pa: 'Punjabi Bible Translation - Public Domain.',
}

// Book order map: bookId (e.g. 'PSA') → 1-based index in the JSON
const BOOK_ORDER = [
  'GEN','EXO','LEV','NUM','DEU','JOS','JDG','RUT','1SA','2SA',
  '1KI','2KI','1CH','2CH','EZR','NEH','EST','JOB','PSA','PRO',
  'ECC','SNG','ISA','JER','LAM','EZK','DAN','HOS','JOL','AMO',
  'OBA','JON','MIC','NAM','HAB','ZEP','HAG','ZEC','MAL',
  'MAT','MRK','LUK','JHN','ACT','ROM','1CO','2CO','GAL','EPH',
  'PHP','COL','1TH','2TH','1TI','2TI','TIT','PHM','HEB','JAS',
  '1PE','2PE','1JN','2JN','3JN','JUD','REV'
]

// In-memory cache per language (for fast lookup)
const bibleCache = {}

// ── Native IndexedDB Helper for Permanent Offline Storage ──
const DB_NAME = 'SacredWordDB'
const DB_VERSION = 1
const STORE_NAME = 'bibles'

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = (e) => resolve(e.target.result)
    request.onerror = (e) => reject(e.target.error)
  })
}

async function getLocalBible(langCode) {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(langCode)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  } catch (e) {
    console.warn('Failed to retrieve Bible from local IndexedDB cache:', e)
    return null
  }
}

async function saveLocalBible(langCode, data) {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.put(data, langCode)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (e) {
    console.warn('Failed to save Bible to local IndexedDB cache:', e)
  }
}

export function getPatchedVerseText(langCode, bookId, chapter, verseNumber, originalText) {
  const cleanLang = String(langCode || '').toLowerCase()
  if (cleanLang === 'te' || cleanLang.startsWith('te')) {
    if (bookId === 'REV' && Number(chapter) === 1 && Number(verseNumber) === 20) {
      return "అనగా నా కుడిచేతిలో నీవు చూచిన యేడు నక్షత్రములనుగూర్చిన మర్మమును, ఆ యేడు సువర్ణ దీపస్తంభములనుగూర్చిన సంగతియు వ్రాయుము. ఆ యేడు నక్షత్రములు ఏడు సంఘములకు దూతలు. ఆ యేడు దీపస్తంభములు ఏడు సంఘములు.";
    }
  }
  return originalText;
}

async function loadBible(langCode) {
  if (bibleCache[langCode]) return bibleCache[langCode]

  // 1. Check local IndexedDB cache for offline support
  const localData = await getLocalBible(langCode)
  if (localData) {
    bibleCache[langCode] = localData
    return localData
  }

  // 2. Fetch data (local prepackaged asset for English 'en', remote network for others)
  let data
  if (langCode === 'en') {
    // English is pre-packaged locally in public/bibles/en.json for 100% offline out-of-the-box support
    const res = await fetch('/bibles/en.json')
    if (!res.ok) throw new Error(`Failed to load packaged English Bible`)
    data = await res.json()
  } else {
    // Other languages are fetched over network and permanently stored locally in IndexedDB
    const path = LANG_PATH_MAP[langCode] || 'English'
    const res = await fetch(`${GITHUB_RAW}/${path}/bible.json`)
    if (!res.ok) throw new Error(`Failed to load Bible from remote CDN: HTTP ${res.status}`)
    data = await res.json()
  }

  // 3. Save to in-memory and permanent IndexedDB cache for future offline access
  bibleCache[langCode] = data
  await saveLocalBible(langCode, data)
  return data
}

export function useBibleAPI(langCode = 'en') {

  const getChapter = useCallback(async (bookId, chapter, customTranslationId = null) => {
    const activeTransId = customTranslationId || langCode
    const cacheKey = `godly_${activeTransId}_${bookId}_${chapter}`
    const cached = sessionStorage.getItem(cacheKey)
    if (cached) {
      const result = JSON.parse(cached)
      if (result && result.verses) {
        result.verses = result.verses.map((v, i) => ({
          ...v,
          text: getPatchedVerseText(activeTransId, bookId, chapter, i + 1, v.text)
        }))
      }
      return result
    }

    try {
      const data = await loadBible(activeTransId)
      const bookIndex = BOOK_ORDER.indexOf(bookId)
      if (bookIndex === -1) throw new Error(`Unknown book: ${bookId}`)

      const bookData = data.Book[bookIndex]
      const chapterData = bookData?.Chapter?.[chapter - 1]
      if (!chapterData) throw new Error(`Chapter not found: ${bookId} ${chapter}`)

      const verses = chapterData.Verse.map((v, i) => ({
        id: `${bookId}_${chapter}_${i + 1}`,
        number: String(i + 1),
        text: getPatchedVerseText(activeTransId, bookId, chapter, i + 1, v.Verse),
      }))

      const result = {
        verses,
        copyright: COPYRIGHT_MAP[activeTransId] || 'Public Domain / Open License Translation.',
      }
      sessionStorage.setItem(cacheKey, JSON.stringify(result))
      return result
    } catch (err) {
      console.error('Bible load error:', err.message)
      return { verses: getDemoVerses(bookId, chapter), copyright: 'Demo Mode' }
    }
  }, [langCode])

  const getBooks = useCallback(async () => {
    try {
      const data = await loadBible(langCode)
      return data.Book.map((b, i) => ({
        id: BOOK_ORDER[i] || String(i + 1),
        name: b.BookName || BOOK_ORDER[i],
        numberOfChapters: b.Chapter?.length || 0,
      }))
    } catch (err) {
      console.error('Books fetch error:', err.message)
      return []
    }
  }, [langCode])

  const searchVerses = useCallback(async (query) => {
    if (!query) return []
    const q = query.toLowerCase()
    try {
      const data = await loadBible(langCode)
      const results = []
      for (let b = 0; b < data.Book.length; b++) {
        const book = data.Book[b]
        const bookId = BOOK_ORDER[b] || String(b + 1)
        const stdBook = BIBLE_BOOKS.find(x => x.id === bookId)
        const bookName = stdBook ? stdBook.name : (book.BookName || bookId)
        for (let c = 0; c < (book.Chapter?.length || 0); c++) {
          const chap = book.Chapter[c]
          for (let v = 0; v < (chap.Verse?.length || 0); v++) {
            const originalText = chap.Verse[v]?.Verse || ''
            const text = getPatchedVerseText(langCode, bookId, c + 1, v + 1, originalText)
            if (text.toLowerCase().includes(q)) {
              results.push({
                id: `${bookId}_${c + 1}_${v + 1}`,
                reference: `${bookName} ${c + 1}:${v + 1}`,
                text,
                bookId,
                chapter: c + 1,
                verseNumber: v + 1,
              })
              if (results.length >= 100) return results
            }
          }
        }
      }
      return results
    } catch (err) {
      console.error('Search error:', err.message)
      return []
    }
  }, [langCode])

  const getAvailableTranslations = useCallback(() => {
    return Object.keys(LANG_PATH_MAP).map(code => ({
      id: code,
      name: LANG_PATH_MAP[code],
      language: code,
    }))
  }, [])

  return { getChapter, getBooks, searchVerses, getAvailableTranslations, translationId: langCode }
}

function getDemoVerses(bookId, chapter) {
  return Array.from({ length: 5 }, (_, i) => ({
    id: String(i + 1),
    number: String(i + 1),
    text: `Verse ${i + 1} — could not load ${bookId} chapter ${chapter}. Please check your internet connection to download this translation for offline use.`,
  }))
}