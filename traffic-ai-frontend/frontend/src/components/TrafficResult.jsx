import React from 'react'

const levelConfig = {
  HIGH: { icon: '🔴', color: 'var(--accent-red)', class: 'result-high', badge: 'badge-high' },
  MEDIUM: { icon: '🟡', color: 'var(--accent-amber)', class: 'result-medium', badge: 'badge-medium' },
  LOW: { icon: '🟢', color: 'var(--accent-green)', class: 'result-low', badge: 'badge-low' },
}

export function TrafficResult({ data, location }) {
  if (!data) return null
  const level = (data.trafficLevel || data.level || 'UNKNOWN').toUpperCase()
  const cfg = levelConfig[level] || { icon: '⚪', color: 'var(--text-secondary)', class: '', badge: '' }

  return (
    <div className={`result-panel ${cfg.class}`}>
      <div className="result-header">
        <span className="result-level-icon">{cfg.icon}</span>
        <div className="result-info">
          <h4 style={{ color: cfg.color }}>Traffic Level: {level}</h4>
          <p>📍 {location || data.location || 'Unknown location'}</p>
        </div>
      </div>
      <div className="result-details">
        {data.congestionScore !== undefined && (
          <div className="result-detail">
            <div className="label">Congestion Score</div>
            <div className="value" style={{ color: cfg.color }}>{data.congestionScore}%</div>
          </div>
        )}
        {data.duration && (
          <div className="result-detail">
            <div className="label">Est. Duration</div>
            <div className="value">{data.duration}</div>
          </div>
        )}
        {data.avgSpeed !== undefined && (
          <div className="result-detail">
            <div className="label">Avg Speed</div>
            <div className="value">{data.avgSpeed} km/h</div>
          </div>
        )}
        {data.vehicleCount !== undefined && (
          <div className="result-detail">
            <div className="label">Vehicle Count</div>
            <div className="value">{data.vehicleCount}</div>
          </div>
        )}
        {data.predictedTime && (
          <div className="result-detail">
            <div className="label">Peak Time</div>
            <div className="value">{data.predictedTime}</div>
          </div>
        )}
        {data.alert && (
          <div className="result-detail" style={{ gridColumn: '1/-1' }}>
            <div className="label">Alert</div>
            <div className="value" style={{ fontSize: '0.875rem', color: cfg.color }}>{data.alert}</div>
          </div>
        )}
        {data.recommendation && (
          <div className="result-detail" style={{ gridColumn: '1/-1' }}>
            <div className="label">Recommendation</div>
            <div className="value" style={{ fontSize: '0.875rem' }}>{data.recommendation}</div>
          </div>
        )}
      </div>
    </div>
  )
}

export function RouteResult({ data }) {
  if (!data) return null
  return (
    <div className="result-panel">
      <div className="result-header">
        <span className="result-level-icon">🛣️</span>
        <div className="result-info">
          <h4 style={{ color: 'var(--accent-cyan)' }}>Route Analysis</h4>
          <p>{data.start || data.from} → {data.end || data.to}</p>
        </div>
      </div>
      <div className="result-details">
        {data.distance && <div className="result-detail"><div className="label">Distance</div><div className="value">{data.distance}</div></div>}
        {data.estimatedTime && <div className="result-detail"><div className="label">Est. Time</div><div className="value">{data.estimatedTime}</div></div>}
        {data.trafficLevel && (
          <div className="result-detail">
            <div className="label">Traffic</div>
            <div className="value" style={{ color: levelConfig[data.trafficLevel?.toUpperCase()]?.color || 'var(--accent-cyan)' }}>{data.trafficLevel}</div>
          </div>
        )}
        {data.alternativeRoute && <div className="result-detail" style={{ gridColumn: '1/-1' }}><div className="label">Alternative</div><div className="value" style={{ fontSize: '0.875rem' }}>{data.alternativeRoute}</div></div>}
        {data.recommendation && <div className="result-detail" style={{ gridColumn: '1/-1' }}><div className="label">Tip</div><div className="value" style={{ fontSize: '0.875rem' }}>{data.recommendation}</div></div>}
      </div>
    </div>
  )
}
