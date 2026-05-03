import React, { useState, useEffect } from 'react'
import { trafficAPI } from '../utils/api.js'

const levelClass = { HIGH: 'badge-high', MEDIUM: 'badge-medium', LOW: 'badge-low' }
const levelIcon = { HIGH: '🔴', MEDIUM: '🟡', LOW: '🟢' }

export default function TrafficDataTable({ refresh }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    trafficAPI.all()
      .then(res => { setData(Array.isArray(res.data) ? res.data : []); setError('') })
      .catch(() => setError('Failed to load traffic data.'))
      .finally(() => setLoading(false))
  }, [refresh])

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
      <span className="spinner" style={{ width: 28, height: 28 }} />
      <p style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>Loading traffic data...</p>
    </div>
  )

  if (error) return <div className="alert alert-error"><i className="fa fa-circle-exclamation" /> {error}</div>

  if (!data.length) return (
    <div className="empty-state">
      <div className="empty-icon">📊</div>
      <p>No traffic data available yet.</p>
    </div>
  )

  return (
    <div className="data-table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Location</th>
            <th>Vehicle Count</th>
            <th>Avg Speed</th>
            <th>Traffic Level</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => {
            const level = (row.trafficLevel || row.level || '').toUpperCase()
            return (
              <tr key={row.id || i}>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{i + 1}</td>
                <td style={{ fontWeight: 500 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <i className="fa fa-location-dot" style={{ color: 'var(--accent-cyan)', fontSize: '0.75rem' }} />
                    {row.location}
                  </span>
                </td>
                <td>{row.vehicleCount?.toLocaleString() ?? '—'}</td>
                <td>{row.avgSpeed ? `${row.avgSpeed} km/h` : '—'}</td>
                <td>
                  <span className={`traffic-badge ${levelClass[level] || ''}`}>
                    {levelIcon[level] || '⚪'} {level || 'UNKNOWN'}
                  </span>
                </td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  {row.timestamp ? new Date(row.timestamp).toLocaleString() : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
