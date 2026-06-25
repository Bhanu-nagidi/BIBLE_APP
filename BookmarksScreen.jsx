import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBible, BIBLE_BOOKS } from '../contexts/BibleContext'

export default function BookmarksScreen() {
  const navigate = useNavigate()
  const { bookmarks, addBookmark, setCurrentBook, setCurrentChapter } = useBible()
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('newest')

  const filtered = bookmarks
    .filter(b => b.reference?.toLowerCase().includes(search.toLowerCase()) || b.text?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortBy === 'newest' ? new Date(b.savedAt) - new Date(a.savedAt) : new Date(a.savedAt) - new Date(b.savedAt))

  const goToVerse = (bookmark) => {
    if (bookmark.book) {
      const book = BIBLE_BOOKS.find(b => b.name === bookmark.book)
      if (book) {
        setCurrentBook(book)
        setCurrentChapter(bookmark.chapter || 1)
      }
    }
    navigate('/bible')
  }

  return (
    <div className="content-wrapper page-enter">
      <div className="app-header">
        <h2 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Bookmarks</h2>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{bookmarks.length} saved</span>
      </div>

      <div style={{ padding: '16px 20px 0' }}>
        <div className="search-bar" style={{ marginBottom: '14px' }}>
          <span style={{ color: 'var(--text-muted)' }}>🔍</span>
          <input placeholder="Search bookmarks..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {['newest', 'oldest'].map(s => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid', fontSize: '0.8rem', cursor: 'pointer', background: sortBy === s ? 'rgba(var(--accent-rgb),0.1)' : 'transparent', borderColor: sortBy === s ? 'var(--accent-gold)' : 'var(--border-subtle)', color: sortBy === s ? 'var(--accent-gold)' : 'var(--text-muted)' }}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔖</div>
            <h3 className="serif" style={{ fontSize: '1.3rem', fontWeight: 400, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              {search ? 'No results found' : 'No bookmarks yet'}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {search ? 'Try a different search' : 'Tap any verse while reading to save it'}
            </p>
            {!search && (
              <button className="btn-gold" style={{ marginTop: '20px' }} onClick={() => navigate('/bible')}>
                Start Reading
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map(bookmark => (
              <div key={bookmark.id} className="card" style={{ border: '1px solid var(--border-subtle)', position: 'relative', overflow: 'visible' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <span style={{ color: 'var(--accent-gold)', fontWeight: 600, fontSize: '0.875rem' }}>{bookmark.reference}</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => goToVerse(bookmark)}
                      style={{ background: 'rgba(var(--accent-rgb),0.08)', border: '1px solid rgba(var(--accent-rgb),0.2)', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', color: 'var(--accent-gold)', fontSize: '0.75rem' }}
                    >
                      Read
                    </button>
                    <button
                      onClick={() => addBookmark(bookmark)}
                      style={{ background: 'rgba(224,85,85,0.08)', border: '1px solid rgba(224,85,85,0.2)', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', color: 'var(--error)', fontSize: '0.75rem' }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <p className="serif" style={{ 
                  fontSize: '1rem', lineHeight: '1.65', color: 'var(--text-secondary)', 
                  fontStyle: 'italic', wordBreak: 'break-word', overflowWrap: 'break-word',
                  whiteSpace: 'normal', overflow: 'visible', display: 'block',
                }}>
                  "{bookmark.text}"
                </p>
                {bookmark.savedAt && (
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '10px' }}>
                    Saved {new Date(bookmark.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
