import React, { useState, useCallback, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useBible, BIBLE_BOOKS } from '../contexts/BibleContext'
import { useBibleAPI } from '../hooks/useBibleAPI'

const POPULAR_SEARCHES = ['love', 'faith', 'hope', 'peace', 'strength', 'grace', 'forgiveness', 'salvation']

const BOOK_ABBREVIATIONS = {
  gen: 'GEN', genesis: 'GEN',
  ex: 'EXO', exo: 'EXO', exodus: 'EXO',
  lev: 'LEV', leviticus: 'LEV',
  num: 'NUM', numbers: 'NUM',
  deut: 'DEU', dt: 'DEU', deu: 'DEU', deuteronomy: 'DEU',
  josh: 'JOS', jos: 'JOS', joshua: 'JOS',
  judg: 'JDG', jdg: 'JDG', judges: 'JDG',
  ruth: 'RUT', rut: 'RUT',
  '1sam': '1SA', '1sa': '1SA', '1 samuel': '1SA',
  '2sam': '2SA', '2sa': '2SA', '2 samuel': '2SA',
  '1ki': '1KI', '1kings': '1KI', '1 kings': '1KI',
  '2ki': '2KI', '2kings': '2KI', '2 kings': '2KI',
  '1ch': '1CH', '1chron': '1CH', '1 chronicles': '1CH',
  '2ch': '2CH', '2chron': '2CH', '2 chronicles': '2CH',
  ezr: 'EZR', ezra: 'EZR',
  neh: 'NEH', nehemiah: 'NEH',
  est: 'EST', esther: 'EST',
  job: 'JOB',
  ps: 'PSA', psa: 'PSA', psalm: 'PSA', psalms: 'PSA',
  prov: 'PRO', pro: 'PRO', proverbs: 'PRO',
  eccl: 'ECC', ecc: 'ECC', ecclesiastes: 'ECC',
  song: 'SNG', sng: 'SNG', 'song of solomon': 'SNG',
  isa: 'ISA', isaiah: 'ISA',
  jer: 'JER', jeremiah: 'JER',
  blank: 'LAM', lam: 'LAM', lamentations: 'LAM',
  ezek: 'EZK', ezk: 'EZK', ezekiel: 'EZK',
  dan: 'DAN', daniel: 'DAN',
  hos: 'HOS', hosea: 'HOS',
  joel: 'JOL', jol: 'JOL',
  am: 'AMO', amo: 'AMO', amos: 'AMO',
  ob: 'OBA', oba: 'OBA', obadiah: 'OBA',
  jon: 'JON', jonah: 'JON',
  mic: 'MIC', micah: 'MIC',
  nah: 'NAM', nam: 'NAM', nahum: 'NAM',
  hab: 'HAB', habakkuk: 'HAB',
  zeph: 'ZEP', zep: 'ZEP', zephaniah: 'ZEP',
  hag: 'HAG', haggai: 'HAG',
  zech: 'ZEC', zec: 'ZEC', zechariah: 'ZEC',
  mal: 'MAL', malachi: 'MAL',
  matt: 'MAT', mat: 'MAT', matthew: 'MAT',
  mk: 'MRK', mrk: 'MRK', mark: 'MRK',
  lk: 'LUK', luk: 'LUK', luke: 'LUK',
  jn: 'JHN', jhn: 'JHN', john: 'JHN',
  act: 'ACT', acts: 'ACT',
  rom: 'ROM', romans: 'ROM',
  '1cor': '1CO', '1co': '1CO', '1 corinthians': '1CO',
  '2cor': '2CO', '2co': '2CO', '2 corinthians': '2CO',
  gal: 'GAL', galatians: 'GAL',
  eph: 'EPH', ephesians: 'EPH',
  phil: 'PHP', php: 'PHP', philippians: 'PHP',
  col: 'COL', colossians: 'COL',
  '1thess': '1TH', '1th': '1TH', '1 thessalonians': '1TH',
  '2thess': '2TH', '2th': '2TH', '2 thessalonians': '2TH',
  '1tim': '1TI', '1ti': '1TI', '1 timothy': '1TI',
  '2tim': '2TI', '2ti': '2TI', '2 timothy': '2TI',
  tit: 'TIT', titus: 'TIT',
  philem: 'PHM', phm: 'PHM', philemon: 'PHM',
  heb: 'HEB', hebrews: 'HEB',
  jas: 'JAS', james: 'JAS',
  '1pet': '1PE', '1pe': '1PE', '1 peter': '1PE',
  '2pet': '2PE', '2pe': '2PE', '2 peter': '2PE',
  '1jn': '1JN', '1 jn': '1JN', '1 john': '1JN',
  '2jn': '2JN', '2 jn': '2JN', '2 john': '2JN',
  '3jn': '3JN', '3 jn': '3JN', '3 john': '3JN',
  jud: 'JUD', jude: 'JUD',
  rev: 'REV', revelation: 'REV'
}

// Localized maps for Indian languages (Telugu, Hindi, Tamil)
const LOCAL_BOOK_MAP = {
  // Telugu
  'ఆదికాండము': 'GEN', 'ఆది': 'GEN',
  'నిర్గమకాండము': 'EXO', 'నిర్గమ': 'EXO',
  'లేవీయకాండము': 'LEV', 'లేవీయ': 'LEV',
  'సంఖ్యాకాండము': 'NUM', 'సంఖ్యా': 'NUM',
  'ద్వితీయోపదేశకాండము': 'DEU', 'ద్వితీయో': 'DEU',
  'యెహోషువ': 'JOS',
  'న్యాయาధిపతులు': 'JDG', 'న్యాయాధిపతులు': 'JDG', 'న్యాయా': 'JDG',
  'రూతు': 'RUT',
  '1సమూయేలు': '1SA', '1 సమూయేలు': '1SA',
  '2సమూయేలు': '2SA', '2 సమూయేలు': '2SA',
  '1రాజులు': '1KI', '1 రాజులు': '1KI',
  '2రాజులు': '2KI', '2 రాజులు': '2KI',
  '1దినవృత్తాంతములు': '1CH', '1 దినవృత్తాంతములు': '1CH',
  '2దినవృత్తాంతములు': '2CH', '2 దినవృత్తాంతములు': '2CH',
  'ఎజ్రా': 'EZR',
  'నెహెమ్యా': 'NEH',
  'ఎస్తేరు': 'EST',
  'యోబు': 'JOB',
  'కీర్తనలు': 'PSA', 'కీర్తన': 'PSA',
  'సామెతలు': 'PRO', 'సామెత': 'PRO',
  'ప్రసంగి': 'ECC',
  'పరమగీతము': 'SNG', 'పరమగీత': 'SNG',
  'యెషయా': 'ISA',
  'యిర్మియా': 'JER',
  'విలాపవాక్యములు': 'LAM', 'విలాప': 'LAM',
  'యెహెజ్కేలు': 'EZK',
  'దానియేలు': 'DAN',
  'హోషేయ': 'HOS',
  'యోవేలు': 'JOL',
  'ఆమోసు': 'AMO',
  'ఓబద్యా': 'OBA',
  'యోనా': 'JON',
  'మీకా': 'MIC',
  'నహూము': 'NAM',
  'హబక్కూకు': 'HAB',
  'జెఫన్యా': 'ZEP',
  'హగ్గయి': 'HAG',
  'జెకర్యా': 'ZEC',
  'మలాకీ': 'MAL',
  'మత్తయి': 'MAT',
  'మార్కు': 'MRK',
  'లూకా': 'LUK',
  'యోహాను': 'JHN', 'యోహా': 'JHN', 'యోహాను సువార్త': 'JHN',
  'అపొస్తలుల': 'ACT', 'అపొస్తలుల కార్యములు': 'ACT', 'కార్యములు': 'ACT',
  'రోమీయులకు': 'ROM', 'రోమా': 'ROM',
  '1కొరింథీయులకు': '1CO', '1 కొరింథీయులకు': '1CO',
  '2కొరింథీయులకు': '2CO', '2 కొరింథీయులకు': '2CO',
  'గలతీయులకు': 'GAL', 'గలతీ': 'GAL',
  'ఎఫెసీయులకు': 'EPH', 'ఎఫెసీ': 'EPH',
  'ఫిలిప్పీయులకు': 'PHP', 'ఫిలిప్పీ': 'PHP',
  'కొలొస్సయులకు': 'COL', 'కొలొస్స': 'COL',
  '1థెస్సలొనీకయులకు': '1TH', '1 థెస్సలొనీకయులకు': '1TH',
  '2థెస్సలొనీకయులకు': '2TH', '2 థెస్సలొనీకయులకు': '2TH',
  '1తిమోతికి': '1TI', '1 తిమోతికి': '1TI',
  '2తిమోతికి': '2TI', '2 తిమోతికి': '2TI',
  'తీతుకు': 'TIT', 'తీతు': 'TIT',
  'ఫిలేమోనుకు': 'PHM', 'ఫిలేమోను': 'PHM',
  'హెబ్రీయులకు': 'HEB', 'హెబ్రీ': 'HEB',
  'యాకోబు': 'JAS',
  '1పేతురు': '1PE', '1 పేతురు': '1PE',
  '2పేతురు': '2PE', '2 పేతురు': '2PE',
  '1యోహాను': '1JN', '1 యోహాను': '1JN',
  '2యోహాను': '2JN', '2 యోహాను': '2JN',
  '3యోహాను': '3JN', '3 యోహాను': '3JN',
  'యూదా': 'JUD',
  'ప్రకటన': 'REV', 'ప్రకటన గ్రంథము': 'REV',

  // Hindi
  'उत्पत्ति': 'GEN', 'निर्गमन': 'EXO', 'लेव्यव्यवस्था': 'LEV', 'गिनती': 'NUM', 'व्यवस्थाविवरण': 'DEU',
  'यहोशू': 'JOS', 'न्यायियों': 'JDG', 'रूत': 'RUT', '1 शमूएल': '1SA', '2 शमूएल': '2SA',
  '1 राजा': '1KI', '2 राजा': '2KI', '1 इतिहास': '1CH', '2 इतिहास': '2CH', 'एज्रा': 'EZR',
  'नहेम्याह': 'NEH', 'एस्तर': 'EST', 'अय्यूब': 'JOB', 'भजन संहिता': 'PSA', 'भजन': 'PSA',
  'नीतिवचन': 'PRO', 'सभोपदेशक': 'ECC', 'श्रेष्ठगीत': 'SNG', 'यशायाह': 'ISA', 'यिर्मयाह': 'JER',
  'विलापगीत': 'LAM', 'यहेजकेल': 'EZK', 'दानिय्येल': 'DAN', 'होशे': 'HOS', 'योएल': 'JOL',
  'आमोस': 'AMO', 'ओबद्याह': 'OBA', 'योना': 'JON', 'मीका': 'MIC', 'नहूम': 'NAM',
  'हबक्कूक': 'HAB', 'सपन्याह': 'ZEP', 'हाग्गै': 'HAG', 'जकर्याह': 'ZEC', 'मलाकी': 'MAL',
  'मत्ती': 'MAT', 'मरकुस': 'MRK', 'लूका': 'LUK', 'यूहन्ना': 'JHN', 'प्रेरितों के काम': 'ACT',
  'प्रेरितों': 'ACT', 'रोमियों': 'ROM', '1 कुरिन्थियों': '1CO', '2 कुरिन्थियों': '2CO',
  'गलातियों': 'GAL', 'इफिसियों': 'EPH', 'फिलिप्पियों': 'PHP', 'कुलुस्सियों': 'COL',
  '1 थिस्सलुनीकियों': '1TH', '2 थिस्सलुनीकियों': '2TH', '1 तीमुथियुस': '1TI', '2 तीमुथियुस': '2TI',
  'तीतुस': 'TIT', 'फिलेमोन': 'PHM', 'इब्रानियों': 'HEB', 'याकूब': 'JAS', '1 पतरस': '1PE',
  '2 पतरस': '2PE', '1 यूहन्ना': '1JN', '2 यूहन्ना': '2JN', '3 यूहन्ना': '3JN', 'यहूदा': 'JUD',
  'प्रकाशितवाक्य': 'REV',

  // Phonetic additions
  'yohan': 'JHN', 'yohana': 'JHN', 'yohanu': 'JHN', 'luk': 'LUK', 'luka': 'LUK', 'mark': 'MRK', 'mrk': 'MRK', 'mathew': 'MAT', 'matthew': 'MAT', 'matt': 'MAT', 'samuel': '1SA', 'sam': '1SA', 'kings': '1KI', 'chronicles': '1CH', 'revelation': 'REV', 'rev': 'REV', 'genesis': 'GEN', 'gen': 'GEN'
}

export default function SearchScreen() {
  const navigate = useNavigate()
  const { selectedLanguage, addBookmark, isBookmarked, setCurrentBook, setCurrentChapter, setSelectedVerse } = useBible()
  const { searchVerses, getBooks } = useBibleAPI(selectedLanguage.code)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [recentSearches, setRecentSearches] = useState(() => JSON.parse(localStorage.getItem('bible_searches') || '[]'))
  const location = useLocation()

  const findBookMatch = (bookQuery) => {
    const q = bookQuery.trim().toLowerCase()
    if (!q) return null

    // 1. Direct ID match
    const bookById = BIBLE_BOOKS.find(b => b.id.toLowerCase() === q)
    if (bookById) return bookById

    // 2. English name match
    const bookByName = BIBLE_BOOKS.find(b => b.name.toLowerCase() === q)
    if (bookByName) return bookByName

    // 3. Abbreviation match
    if (BOOK_ABBREVIATIONS[q]) {
      const abbrevId = BOOK_ABBREVIATIONS[q]
      const bookByAbbrev = BIBLE_BOOKS.find(b => b.id === abbrevId)
      if (bookByAbbrev) return bookByAbbrev
    }

    // 4. Localized name match
    if (LOCAL_BOOK_MAP[q]) {
      const localId = LOCAL_BOOK_MAP[q]
      const bookByLocal = BIBLE_BOOKS.find(b => b.id === localId)
      if (bookByLocal) return bookByLocal
    }

    // 5. Partial name match
    const partialByName = BIBLE_BOOKS.find(b => b.name.toLowerCase().startsWith(q) || b.name.toLowerCase().includes(q))
    if (partialByName) return partialByName

    return null
  }

  const parseBibleReference = (searchQuery) => {
    const clean = searchQuery.trim().replace(/\s+/g, ' ')
    if (!clean) return null

    // Check if it's just a book name
    const resolvedBook = findBookMatch(clean)
    if (resolvedBook) {
      return { book: resolvedBook, chapter: 1, verse: null }
    }

    // Match Book Chapter:Verse or Book Chapter
    const refMatch = clean.match(/^(.+?)\s+(\d+)(?:\s*:\s*(\d+))?$/)
    if (refMatch) {
      const bookPart = refMatch[1].trim()
      const chapterNum = parseInt(refMatch[2], 10)
      const verseNum = refMatch[3] ? parseInt(refMatch[3], 10) : null
      
      const matchedBook = findBookMatch(bookPart)
      if (matchedBook) {
        return { book: matchedBook, chapter: chapterNum, verse: verseNum }
      }
    }

    return null
  }

  const handleVerseClick = (bookId, chapter, verseNumber) => {
    const book = BIBLE_BOOKS.find(b => b.id === bookId)
    if (book) {
      setCurrentBook(book)
      setCurrentChapter(chapter)
      if (verseNumber) {
        setSelectedVerse(String(verseNumber))
      } else {
        setSelectedVerse(null)
      }
      navigate('/bible')
    }
  }

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) return
    const cleanQuery = q.trim()

    // 1. Try parsing query as reference
    const parsedRef = parseBibleReference(cleanQuery)
    if (parsedRef) {
      const { book, chapter, verse } = parsedRef
      setLoading(true)
      try {
        const resolvedChapter = Math.min(Math.max(1, chapter), book.chapters || 50)
        setCurrentBook(book)
        setCurrentChapter(resolvedChapter)
        if (verse) {
          setSelectedVerse(String(verse))
        } else {
          setSelectedVerse(null)
        }
        navigate('/bible')
        return
      } catch (err) {
        console.error('Failed to resolve reference:', err)
      } finally {
        setLoading(false)
      }
    }

    // 2. Otherwise run normal text search
    setLoading(true)
    setSearched(true)
    setRecentSearches(prev => {
      const recent = [q, ...prev.filter(r => r !== q)].slice(0, 5)
      localStorage.setItem('bible_searches', JSON.stringify(recent))
      return recent
    })
    try {
      const res = await searchVerses(q)
      setResults(res)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [searchVerses, navigate, setCurrentBook, setCurrentChapter, setSelectedVerse])

  // Move useEffect here below declaration of doSearch
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const q = params.get('q')
    if (q) {
      setQuery(q)
      doSearch(q)
    }
  }, [location.search, doSearch])

  const handleKey = (e) => {
    if (e.key === 'Enter') doSearch(query)
  }

  return (
    <div className="content-wrapper page-enter">
      <div className="app-header">
        <h2 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Search Scripture</h2>
        <span style={{ fontSize: '0.9rem' }}>{selectedLanguage.flag} {selectedLanguage.version}</span>
      </div>

      <div style={{ padding: '16px 20px' }}>
        <div className="search-bar" style={{ marginBottom: '20px' }}>
          <span style={{ color: 'var(--text-muted)' }}>🔍</span>
          <input
            placeholder="Search verses, topics, or references..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            autoFocus
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]); setSearched(false) }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>
          )}
          <button
            onClick={() => doSearch(query)}
            style={{ background: 'var(--accent-gold)', border: 'none', borderRadius: '20px', padding: '6px 14px', color: 'var(--text-on-accent)', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem', flexShrink: 0 }}
          >
            Search
          </button>
        </div>

        {!searched && (
          <>
            {recentSearches.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <h4 style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Recent</h4>
                  <button onClick={() => { setRecentSearches([]); localStorage.removeItem('bible_searches') }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem' }}>Clear</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {recentSearches.map(r => (
                    <button
                      key={r}
                      onClick={() => { setQuery(r); doSearch(r) }}
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: '20px', padding: '6px 14px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.85rem' }}
                    >
                      🕐 {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Popular Topics</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {POPULAR_SEARCHES.map(t => (
                  <button
                    key={t}
                    onClick={() => { setQuery(t); doSearch(t) }}
                    style={{ background: 'rgba(var(--accent-rgb),0.06)', border: '1px solid rgba(var(--accent-rgb),0.2)', borderRadius: '20px', padding: '7px 16px', cursor: 'pointer', color: 'var(--accent-gold)', fontSize: '0.85rem', fontWeight: 500 }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="shimmer" style={{ height: '80px', borderRadius: '12px' }} />
            ))}
          </div>
        )}

        {searched && !loading && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', alignItems: 'center' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{results.length} results for "<span style={{ color: 'var(--text-primary)' }}>{query}</span>"</p>
            </div>

            {results.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔍</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>No verses found for "{query}"</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px' }}>Try different keywords or topics</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {results.map((verse, i) => (
                  <div
                    key={verse.id || i}
                    className="card"
                    style={{ border: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'border-color 0.15s' }}
                    onClick={() => handleVerseClick(verse.bookId, verse.chapter, verse.verseNumber)}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(var(--accent-rgb),0.3)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span style={{ color: 'var(--accent-gold)', fontWeight: 600, fontSize: '0.875rem' }}>{verse.reference}</span>
                      <button
                        className={`bookmark-btn ${isBookmarked(verse.id) ? 'saved' : ''}`}
                        onClick={(e) => { e.stopPropagation(); addBookmark({ id: verse.id, reference: verse.reference, text: verse.text }) }}
                      >
                        {isBookmarked(verse.id) ? '🔖' : '🕮'}
                      </button>
                    </div>
                    <p className="serif" style={{ fontSize: '1rem', lineHeight: '1.7', color: 'var(--text-secondary)' }}>
                      {verse.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
