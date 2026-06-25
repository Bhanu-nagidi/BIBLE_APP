import { useCallback } from 'react'
import { BIBLE_BOOKS } from '../contexts/BibleContext'

// Raw JSON from godlytalias/Bible-Database (traditional BSI translations)
// Sourced from Wordproject - no API key needed
const GITHUB_RAW = 'https://raw.githubusercontent.com/godlytalias/Bible-Database/master'

const LANG_PATH_MAP = {
  en:  'English',
  hi:  'Hindi',
  te:  'Telugu',   // Traditional Telugu BSI (బైబిలు సంఘం)
  ta:  'Tamil',    // Traditional Tamil BSI
  ml:  'Malayalam',
  kn:  'Kannada',
  or:  'Oriya',
  gu:  'Gujarati',
  bn:  'Bengali',
  pa:  'Punjabi',
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

// In-memory cache per language (avoids re-downloading the full bible.json)
const bibleCache = {}

export function getPatchedVerseText(langCode, bookId, chapter, verseNumber, originalText) {
  const cleanLang = String(langCode || '').toLowerCase()
  if (cleanLang === 'te' || cleanLang.startsWith('te')) {
    if (bookId === 'REV' && Number(chapter) === 1 && Number(verseNumber) === 20) {
      return "అనగా నా కుడిచేతిలో నీవు చూచిన యేడు నక్షత్రములనుగూర్చిన మర్మమును, ఆ యేడు సువర్ణ దీపస్తంభముల సంగతియు వ్రాయుము. ఆ యేడు నక్షత్రములు ఏడు సంఘములకు దూతలు. ఆ యేడు దీపస్తంభములు ఏడు సంఘములు.";
    }
  }
  return originalText;
}

async function loadBible(langCode) {
  if (bibleCache[langCode]) return bibleCache[langCode]
  const path = LANG_PATH_MAP[langCode] || 'English'
  const res = await fetch(`${GITHUB_RAW}/${path}/bible.json`)
  if (!res.ok) throw new Error(`Failed to load Bible: HTTP ${res.status}`)
  const data = await res.json()
  bibleCache[langCode] = data
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
        copyright: `${LANG_PATH_MAP[activeTransId] || 'English'} Bible - Wordproject®`,
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
    text: `Verse ${i + 1} — could not load ${bookId} chapter ${chapter}.`,
  }))
}