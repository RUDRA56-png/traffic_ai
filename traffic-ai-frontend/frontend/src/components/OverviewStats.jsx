import React, { useState, useEffect } from 'react'
import { trafficAPI } from '../utils/api.js'

export default function OverviewStats({ onDataLoaded }) {
  const [stats, setStats] = useState({ total: 0, high: 0, medium: 0, low: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    trafficAPI.all().then(res => {
      const data = Array.isArray(res.data) ? res.data : []
      const s = { total: data.length, high: 0, medium: 0, low: 0 }
      data.forEach(d => {
        const l = (d.trafficLevel || d.level || '').toUpperCase()
        if (l === 'HIGH') s.high++
        else if (l === 'MEDIUM') s.medium++
        else if (l === 'LOW') s.low++
      })
      setStats(s)
      onDataLoaded?.(data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const cards = [
    { label: 'Total Entries', value: loading ? '—' : stats.total, icon: 'fa-database', grad: 'linear-gradient(135deg, var(--accent-cyan), #0099bb)', change: 'All time' },
    { label: 'High Traffic', value: loading ? '—' : stats.high, icon: 'fa-triangle-exclamation', grad: 'linear-gradient(135deg, var(--accent-red), #cc2b3a)', change: 'Congested zones' },
    { label: 'Medium Traffic', value: loading ? '—' : stats.medium, icon: 'fa-chart-line', grad: 'linear-gradient(135deg, var(--accent-amber), #cc8c00)', change: 'Moderate zones' },
    { label: 'Low Traffic', value: loading ? '—' : stats.low, icon: 'fa-circle-check', grad: 'linear-gradient(135deg, var(--accent-green), #00cc7a)', change: 'Clear zones' },
  ]

  return (
    <div className="stats-grid">
      {cards.map((c, i) => (
        <div key={c.label} className={`stat-card stagger-${i + 1} fadeInUp`} style={{ '--grad': c.grad }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div className="card-icon icon-cyan" style={{ background: `${c.grad.split(',')[1]?.trim()?.slice(0, -1)}20` || 'rgba(0,229,255,0.15)' }}>
              <i className={`fa ${c.icon}`} style={{ background: c.grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }} />
            </div>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span className="pulse-dot" style={{ background: c.grad.includes('green') ? 'var(--accent-green)' : 'var(--accent-cyan)' }} />
            </span>
          </div>
          <div className="stat-value">{c.value}</div>
          <div className="stat-label">{c.label}</div>
          <div className="stat-change" style={{ color: 'var(--text-secondary)' }}>{c.change}</div>
        </div>
      ))}
    </div>
  )
}
