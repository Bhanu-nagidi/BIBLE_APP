import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Home, BookOpen, Calendar, Bookmark, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/bible', icon: BookOpen, label: 'Bible' },
  { path: '/plans', icon: Calendar, label: 'Plans' },
  { path: '/bookmarks', icon: Bookmark, label: 'Saved' },
  { path: '/settings', icon: Settings, label: 'Settings' }
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(item => {
        const isActive = location.pathname === item.path
        const Icon = item.icon
        return (
          <button
            key={item.path}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
            aria-label={item.label}
          >
            <Icon size={20} style={{ strokeWidth: isActive ? 2.5 : 2 }} />
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
