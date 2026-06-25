import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBible, BIBLE_BOOKS } from '../contexts/BibleContext'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Search, Trash2, Edit3, BookOpen, Save, X, Bookmark } from 'lucide-react'

export default function NotesScreen() {
  const navigate = useNavigate()
  const { user, isGuest } = useAuth()
  const { setCurrentBook, setCurrentChapter, setSelectedVerse, showToast } = useBible()
  
  const [notes, setNotes] = useState([])
  const [search, setSearch] = useState('')
  const [showEditor, setShowEditor] = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  
  // Editor form state
  const [form, setForm] = useState({ title: '', text: '', verseRef: '' })

  const getNotesKey = () => {
    if (user) return `bible_notes_${user.id}`
    if (isGuest) return 'bible_notes_guest'
    return null
  }

  // Load notes on mount/user switch
  useEffect(() => {
    const key = getNotesKey()
    if (key) {
      const saved = localStorage.getItem(key)
      setNotes(saved ? JSON.parse(saved) : [])
    }
  }, [user, isGuest])

  const saveNotes = (updatedNotes) => {
    const key = getNotesKey()
    if (key) {
      localStorage.setItem(key, JSON.stringify(updatedNotes))
      setNotes(updatedNotes)
    }
  }

  const handleOpenNew = () => {
    setEditingNote(null)
    setForm({ title: '', text: '', verseRef: '' })
    setShowEditor(true)
  }

  const handleOpenEdit = (note) => {
    setEditingNote(note)
    setForm({ title: note.title || '', text: note.text || '', verseRef: note.verseRef || '' })
    setShowEditor(true)
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (!form.text.trim()) {
      showToast('Note content cannot be empty!')
      return
    }

    const key = getNotesKey()
    if (!key) return

    let updated
    if (editingNote) {
      // Edit existing
      updated = notes.map(n => n.id === editingNote.id ? { 
        ...n, 
        title: form.title.trim() || 'Untitled Note', 
        text: form.text.trim(), 
        verseRef: form.verseRef.trim(),
        updatedAt: new Date().toISOString()
      } : n)
      showToast('Note updated ✓')
    } else {
      // Create new
      const newNote = {
        id: Date.now().toString(),
        title: form.title.trim() || 'Untitled Note',
        text: form.text.trim(),
        verseRef: form.verseRef.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      updated = [newNote, ...notes]
      showToast('Note saved ✓')
    }

    saveNotes(updated)
    setShowEditor(false)
    setEditingNote(null)
  }

  const handleDelete = (noteId) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      const updated = notes.filter(n => n.id !== noteId)
      saveNotes(updated)
      showToast('Note deleted')
    }
  }

  const goToVerse = (verseRef) => {
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
    } else {
      showToast('Could not resolve Bible reference.')
    }
  }

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase()) || 
    n.text.toLowerCase().includes(search.toLowerCase()) ||
    n.verseRef.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="content-wrapper page-enter">
      <div className="app-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600 }}>My Study Notes</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{notes.length} notes saved</span>
        </div>
        <button 
          onClick={handleOpenNew}
          className="btn-gold"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '20px', fontSize: '0.85rem' }}
        >
          <Plus size={16} /> New Note
        </button>
      </div>

      <div style={{ padding: '16px 20px' }}>
        {/* Search */}
        <div className="search-bar" style={{ marginBottom: '20px' }}>
          <Search size={18} style={{ color: 'var(--text-muted)' }} />
          <input 
            placeholder="Search notes, tags, or references..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>

        {/* Editor Modal Sheet */}
        {showEditor && (
          <div className="modal-overlay" onClick={() => setShowEditor(false)}>
            <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{editingNote ? 'Edit Study Note' : 'Create New Note'}</h3>
                <button onClick={() => setShowEditor(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
              </div>

              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Note Title</label>
                  <input 
                    className="input-field" 
                    placeholder="Enter a descriptive title..." 
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Attached Scripture Reference</label>
                  <input 
                    className="input-field" 
                    placeholder="E.g., John 3:16" 
                    value={form.verseRef}
                    onChange={e => setForm({ ...form, verseRef: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Note Content</label>
                  <textarea 
                    className="input-field" 
                    placeholder="Type your reflections, study points, or prayers here..." 
                    rows={8}
                    value={form.text}
                    onChange={e => setForm({ ...form, text: e.target.value })}
                    style={{ resize: 'vertical', fontFamily: 'Inter, sans-serif', lineHeight: '1.6' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button 
                    type="button" 
                    className="btn-ghost" 
                    style={{ flex: 1, padding: '10px' }} 
                    onClick={() => setShowEditor(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-gold" 
                    style={{ flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <Save size={16} /> Save Note
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Notes Grid List */}
        {filteredNotes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📝</div>
            <h3 className="serif" style={{ fontSize: '1.3rem', fontWeight: 400, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              {search ? 'No search matches' : 'Empty Notebook'}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {search ? 'Try looking for another keyword' : 'Create study notes, add comments, and log your prayers.'}
            </p>
            {!search && (
              <button className="btn-gold" style={{ marginTop: '20px' }} onClick={handleOpenNew}>
                Create Your First Note
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredNotes.map(note => (
              <div 
                key={note.id} 
                className="card" 
                style={{ 
                  border: '1px solid var(--border-subtle)', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '10px' 
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {note.title}
                    </h4>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Updated {new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '4px', marginLeft: '12px' }}>
                    {note.verseRef && (
                      <button
                        onClick={() => goToVerse(note.verseRef)}
                        title={`Go to ${note.verseRef}`}
                        style={{ background: 'rgba(var(--accent-rgb),0.08)', border: '1px solid rgba(var(--accent-rgb),0.2)', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: 'var(--accent-gold)' }}
                      >
                        <BookOpen size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenEdit(note)}
                      title="Edit Note"
                      style={{ background: 'rgba(var(--accent-rgb),0.04)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: 'var(--text-secondary)' }}
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      title="Delete Note"
                      style={{ background: 'rgba(224,85,85,0.06)', border: '1px solid rgba(224,85,85,0.15)', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: 'var(--error)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {note.verseRef && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(var(--accent-rgb), 0.05)', padding: '6px 10px', borderRadius: '6px', width: 'fit-content' }}>
                    <Bookmark size={12} style={{ color: 'var(--accent-gold)' }} />
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent-gold)' }}>{note.verseRef}</span>
                  </div>
                )}

                <p style={{ 
                  fontSize: '0.92rem', 
                  lineHeight: '1.65', 
                  color: 'var(--text-secondary)',
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word',
                  marginTop: '4px'
                }}>
                  {note.text}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
