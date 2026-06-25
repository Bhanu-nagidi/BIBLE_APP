import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Menu, Home, BookOpen, Calendar, Bookmark, Edit, Settings, X } from 'lucide-react'

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isExpanded, setIsExpanded] = useState(false)

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/bible', icon: BookOpen, label: 'Bible' },
    { path: '/plans', icon: Calendar, label: 'Reading Plan' },
    { path: '/bookmarks', icon: Bookmark, label: 'Saved' },
    { path: '/notes', icon: Edit, label: 'Notes' },
    { path: '/settings', icon: Settings, label: 'Settings' }
  ]

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded)
  }

  const handleNavClick = (path) => {
    navigate(path)
    setIsExpanded(false) // Collapse on navigate
  }

  return (
    <>
      {/* Backdrop overlay on mobile screens when expanded */}
      {isExpanded && (
        <div 
          className="sidebar-backdrop" 
          onClick={() => setIsExpanded(false)} 
        />
      )}

      <aside className={`sidebar ${isExpanded ? 'expanded' : ''}`}>
        {/* Top Logo Container */}
        <div className="sidebar-logo-container">
          <img 
            src="/logo.jpg" 
            alt="Logo" 
            className="sidebar-logo" 
            onClick={() => handleNavClick('/')}
            style={{ cursor: 'pointer' }}
          />
          {isExpanded && (
            <span className="sidebar-logo-text">
              Kristhu Krupa
            </span>
          )}
        </div>

        {/* Hamburger Menu Toggle Button */}
        <button 
          className="sidebar-toggle-btn" 
          onClick={toggleSidebar}
          aria-label="Toggle navigation menu"
        >
          {isExpanded ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          {navItems.map(item => {
            const isActive = location.pathname === item.path
            const Icon = item.icon
            return (
              <button
                key={item.path}
                className={`sidebar-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.path)}
                title={!isExpanded ? item.label : undefined}
              >
                <Icon size={20} style={{ strokeWidth: isActive ? 2.5 : 2 }} />
                <span className="sidebar-item-label">{item.label}</span>
              </button>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
