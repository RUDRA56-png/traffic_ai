import React from 'react'
import { useAuth } from '../hooks/useAuth.jsx'

const navItems = {
  common: [
    { id: 'overview', icon: 'fa-gauge-high', label: 'Overview' },
    { id: 'predict', icon: 'fa-brain', label: 'Predict Traffic' },
    { id: 'route', icon: 'fa-route', label: 'Route Planner' },
    { id: 'map', icon: 'fa-map', label: 'Live Map' },
    { id: 'data', icon: 'fa-table', label: 'Traffic Data' },
  ],
  admin: [
    { id: 'add', icon: 'fa-circle-plus', label: 'Add Traffic Data' },
  ]
}

export default function Sidebar({ activeTab, setActiveTab, open, onClose }) {
  const { user, logout } = useAuth()

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-mark">🚦</div>
          <span>TrafficAI</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Navigation</div>
          {navItems.common.map(item => (
            <div key={item.id} className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => { setActiveTab(item.id); onClose(); }}>
              <span className="nav-icon"><i className={`fa ${item.icon}`} /></span>
              {item.label}
            </div>
          ))}
          {user?.role === 'ADMIN' && (
            <>
              <div className="nav-section-label" style={{ marginTop: '1rem' }}>Admin Tools</div>
              {navItems.admin.map(item => (
                <div key={item.id} className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => { setActiveTab(item.id); onClose(); }}>
                  <span className="nav-icon"><i className={`fa ${item.icon}`} /></span>
                  {item.label}
                </div>
              ))}
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-badge">
            <div className="user-avatar">{user?.username?.[0]?.toUpperCase() || 'U'}</div>
            <div className="user-info">
              <div className="user-name">{user?.username || 'User'}</div>
              <span className={`user-role ${user?.role === 'ADMIN' ? 'role-admin' : 'role-user'}`}>
                {user?.role || 'USER'}
              </span>
            </div>
          </div>
          <button className="btn btn-danger" style={{ width: '100%', fontSize: '0.8rem', padding: '0.6rem' }}
            onClick={logout}>
            <i className="fa fa-right-from-bracket" /> Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}
