import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const NAV_ITEMS = [
  { path: '/', icon: '🏠', iconActive: '🏠', label: 'Home' },
  { path: '/bible', icon: '📖', iconActive: '📖', label: 'Bible' },
  { path: '/search', icon: '🔍', iconActive: '🔍', label: 'Search' },
  { path: '/bookmarks', icon: '🔖', iconActive: '🔖', label: 'Saved' },
  { path: '/settings', icon: '⚙️', iconActive: '⚙️', label: 'Settings' },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(item => {
        const isActive = location.pathname === item.path
        return (
          <button
            key={item.path}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>{isActive ? item.iconActive : item.icon}</span>
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
