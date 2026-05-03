import React from 'react'
import { ToastProvider } from '../components/Toast.jsx'
// Admin dashboard reuses the same DashboardContent with isAdmin=true
// We import the internal component pattern

import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'
import { trafficAPI } from '../utils/api.js'
import Sidebar from '../components/Sidebar.jsx'
import TrafficMap from '../components/TrafficMap.jsx'
import TrafficDataTable from '../components/TrafficDataTable.jsx'
import { TrafficResult, RouteResult } from '../components/TrafficResult.jsx'
import OverviewStats from '../components/OverviewStats.jsx'
import { useToast } from '../components/Toast.jsx'
import '../styles.css'

function Clock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t) }, [])
  return <span className="time-badge">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
}

const tabTitles = {
  overview: { title: 'Admin Overview', sub: 'Full system control and analytics' },
  predict: { title: 'Predict Traffic', sub: 'AI-powered congestion forecasting' },
  route: { title: 'Route Planner', sub: 'Optimal path with traffic analysis' },
  map: { title: 'Live Traffic Map', sub: 'Interactive map with real-time overlays' },
  data: { title: 'Traffic Database', sub: 'Complete dataset management' },
  add: { title: 'Add Traffic Data', sub: 'Submit new traffic observation' },
}

function AdminDashboardContent() {
  const [tab, setTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuth()
  const toast = useToast()

  const [predictLoc, setPredictLoc] = useState('')
  const [predictResult, setPredictResult] = useState(null)
  const [predictLoading, setPredictLoading] = useState(false)
  const [mapSearchLoc, setMapSearchLoc] = useState(null)

  const [routeStart, setRouteStart] = useState('')
  const [routeEnd, setRouteEnd] = useState('')
  const [routeResult, setRouteResult] = useState(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [mapRoute, setMapRoute] = useState(null)

  const [addForm, setAddForm] = useState({ location: '', vehicleCount: '', avgSpeed: '' })
  const [addLoading, setAddLoading] = useState(false)
  const [tableRefresh, setTableRefresh] = useState(0)
  const [allData, setAllData] = useState([])

  const handlePredict = async (e) => {
    e.preventDefault(); if (!predictLoc.trim()) return
    setPredictLoading(true); setPredictResult(null)
    try {
      const res = await trafficAPI.predict(predictLoc)
      setPredictResult(res.data); setMapSearchLoc(predictLoc)
      toast('Prediction complete!', 'success')
    } catch (err) { toast(err.response?.data?.message || 'Prediction failed.', 'error') }
    finally { setPredictLoading(false) }
  }

  const handleRoute = async (e) => {
    e.preventDefault(); if (!routeStart.trim() || !routeEnd.trim()) return
    setRouteLoading(true); setRouteResult(null)
    try {
      const res = await trafficAPI.route({ start: routeStart, end: routeEnd })
      setRouteResult(res.data); setMapRoute({ start: routeStart, end: routeEnd })
      toast('Route analyzed!', 'success')
    } catch (err) { toast(err.response?.data?.message || 'Route prediction failed.', 'error') }
    finally { setRouteLoading(false) }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!addForm.location || !addForm.vehicleCount || !addForm.avgSpeed) { toast('Fill all fields', 'error'); return }
    setAddLoading(true)
    try {
      await trafficAPI.add({ ...addForm, vehicleCount: Number(addForm.vehicleCount), avgSpeed: Number(addForm.avgSpeed) })
      toast('Traffic data added successfully!', 'success')
      setAddForm({ location: '', vehicleCount: '', avgSpeed: '' })
      setTableRefresh(p => p + 1)
    } catch (err) { toast(err.response?.data?.message || 'Failed to add data.', 'error') }
    finally { setAddLoading(false) }
  }

  const trafficPoints = allData.map(d => ({ location: d.location, level: d.trafficLevel || d.level }))

  return (
    <div className="dashboard-layout">
      <div className="bg-animated"><div className="grid-overlay" /></div>
      <Sidebar activeTab={tab} setActiveTab={setTab} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="main-content">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="hamburger" onClick={() => setSidebarOpen(true)}><i className="fa fa-bars" /></button>
            <div className="topbar-title">
              <h2>{tabTitles[tab]?.title}</h2>
              <p>{tabTitles[tab]?.sub}</p>
            </div>
          </div>
          <div className="topbar-actions">
            <span style={{ padding: '0.3rem 0.75rem', background: 'rgba(255,183,0,0.12)', border: '1px solid rgba(255,183,0,0.3)', borderRadius: '6px', fontSize: '0.72rem', color: 'var(--accent-amber)', fontWeight: 700, letterSpacing: '0.06em' }}>
              ⚡ ADMIN
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--accent-green)' }}>
              <span className="pulse-dot" /> Live
            </span>
            <Clock />
          </div>
        </header>

        <div className="page-content">
          {tab === 'overview' && (
            <div className="fade-in">
              <div style={{ padding: '0.875rem 1.25rem', background: 'rgba(255,183,0,0.08)', border: '1px solid rgba(255,183,0,0.2)', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <i className="fa fa-shield-halved" style={{ color: 'var(--accent-amber)' }} />
                <span style={{ fontSize: '0.85rem', color: 'var(--accent-amber)' }}>
                  <strong>Admin Mode Active</strong> — You have full access to all system features including data management and AI model updates.
                </span>
              </div>
              <OverviewStats onDataLoaded={setAllData} />
              <div className="dashboard-grid">
                <div className="card">
                  <div className="card-header">
                    <div className="card-title"><div className="card-icon icon-cyan"><i className="fa fa-brain" /></div>Quick Predict</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <div className="input-row">
                      <input className="form-input" placeholder="e.g. MG Road, Bangalore" value={predictLoc}
                        onChange={e => setPredictLoc(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handlePredict(e)} />
                      <button className="btn btn-primary" style={{ width: 'auto', padding: '0 1.25rem' }}
                        onClick={handlePredict} disabled={predictLoading}>
                        {predictLoading ? <span className="spinner" /> : <i className="fa fa-magnifying-glass" />}
                      </button>
                    </div>
                  </div>
                  {predictResult && <TrafficResult data={predictResult} location={predictLoc} />}
                </div>
                <div className="card">
                  <div className="card-header">
                    <div className="card-title"><div className="card-icon icon-amber"><i className="fa fa-circle-plus" /></div>Quick Add Data</div>
                    <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: 'rgba(255,183,0,0.15)', color: 'var(--accent-amber)', borderRadius: '4px', fontWeight: 700 }}>ADMIN</span>
                  </div>
                  <form onSubmit={handleAdd}>
                    <div className="form-group">
                      <label className="form-label">Location</label>
                      <input className="form-input" placeholder="Location name" value={addForm.location}
                        onChange={e => setAddForm(p => ({ ...p, location: e.target.value }))} />
                    </div>
                    <div className="input-row" style={{ marginBottom: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <label className="form-label">Vehicles</label>
                        <input type="number" className="form-input" placeholder="Count" value={addForm.vehicleCount}
                          onChange={e => setAddForm(p => ({ ...p, vehicleCount: e.target.value }))} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="form-label">Avg Speed</label>
                        <input type="number" className="form-input" placeholder="km/h" value={addForm.avgSpeed}
                          onChange={e => setAddForm(p => ({ ...p, avgSpeed: e.target.value }))} />
                      </div>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={addLoading} style={{ width: '100%' }}>
                      {addLoading ? <><span className="spinner" /> Submitting...</> : <><i className="fa fa-upload" /> Submit</>}
                    </button>
                  </form>
                </div>
              </div>
              <div className="card">
                <div className="card-header">
                  <div className="card-title"><div className="card-icon icon-blue"><i className="fa fa-map" /></div>Traffic Overview Map</div>
                  <div className="map-legend">
                    <span className="legend-item"><span className="legend-dot" style={{ background: '#ff4757' }} />High</span>
                    <span className="legend-item"><span className="legend-dot" style={{ background: '#ffb700' }} />Medium</span>
                    <span className="legend-item"><span className="legend-dot" style={{ background: '#00ff9d' }} />Low</span>
                  </div>
                </div>
                <TrafficMap trafficPoints={trafficPoints} />
              </div>
            </div>
          )}

          {tab === 'predict' && (
            <div className="fade-in">
              <div className="dashboard-grid">
                <div className="card">
                  <div className="card-header"><div className="card-title"><div className="card-icon icon-cyan"><i className="fa fa-brain" /></div>AI Traffic Prediction</div></div>
                  <form onSubmit={handlePredict}>
                    <div className="form-group">
                      <label className="form-label">Location Name</label>
                      <input className="form-input" placeholder="e.g. Connaught Place, Delhi" value={predictLoc} onChange={e => setPredictLoc(e.target.value)} />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={predictLoading}>
                      {predictLoading ? <><span className="spinner" /> Analyzing...</> : <><i className="fa fa-satellite-dish" /> Predict Traffic</>}
                    </button>
                  </form>
                  {predictResult && <div style={{ marginTop: '1.5rem' }}><TrafficResult data={predictResult} location={predictLoc} /></div>}
                </div>
                <div className="card">
                  <div className="card-header"><div className="card-title"><div className="card-icon icon-blue"><i className="fa fa-map-pin" /></div>Location Map</div></div>
                  <TrafficMap searchLocation={mapSearchLoc} />
                </div>
              </div>
            </div>
          )}

          {tab === 'route' && (
            <div className="fade-in">
              <div className="dashboard-grid">
                <div className="card">
                  <div className="card-header"><div className="card-title"><div className="card-icon icon-green"><i className="fa fa-route" /></div>Route Planner</div></div>
                  <form onSubmit={handleRoute}>
                    <div className="form-group">
                      <label className="form-label">Start Location</label>
                      <input className="form-input" placeholder="e.g. Bandra, Mumbai" value={routeStart} onChange={e => setRouteStart(e.target.value)} />
                    </div>
                    <div style={{ textAlign: 'center', margin: '0.5rem 0', color: 'var(--text-secondary)' }}><i className="fa fa-arrow-down" /></div>
                    <div className="form-group">
                      <label className="form-label">End Location</label>
                      <input className="form-input" placeholder="e.g. Andheri, Mumbai" value={routeEnd} onChange={e => setRouteEnd(e.target.value)} />
                    </div>
                    <button type="submit" className="btn btn-success" disabled={routeLoading} style={{ width: '100%' }}>
                      {routeLoading ? <><span className="spinner" /> Planning route...</> : <><i className="fa fa-road" /> Analyze Route</>}
                    </button>
                  </form>
                  {routeResult && <div style={{ marginTop: '1.5rem' }}><RouteResult data={routeResult} /></div>}
                </div>
                <div className="card">
                  <div className="card-header"><div className="card-title"><div className="card-icon icon-blue"><i className="fa fa-map" /></div>Route Map</div></div>
                  <TrafficMap routeData={mapRoute} />
                </div>
              </div>
            </div>
          )}

          {tab === 'map' && (
            <div className="fade-in">
              <div className="card">
                <div className="card-header">
                  <div className="card-title"><div className="card-icon icon-blue"><i className="fa fa-map" /></div>Live Traffic Map</div>
                  <div className="map-legend">
                    <span className="legend-item"><span className="legend-dot" style={{ background: '#ff4757' }} />High</span>
                    <span className="legend-item"><span className="legend-dot" style={{ background: '#ffb700' }} />Medium</span>
                    <span className="legend-item"><span className="legend-dot" style={{ background: '#00ff9d' }} />Low</span>
                  </div>
                </div>
                <TrafficMap trafficPoints={trafficPoints} showTrafficLayer={true} />
              </div>
            </div>
          )}

          {tab === 'data' && (
            <div className="fade-in">
              <div className="card">
                <div className="card-header">
                  <div className="card-title"><div className="card-icon icon-amber"><i className="fa fa-database" /></div>Traffic Database</div>
                  <button className="btn btn-secondary" style={{ padding: '0.4rem 0.875rem', fontSize: '0.8rem' }}
                    onClick={() => setTableRefresh(p => p + 1)}>
                    <i className="fa fa-rotate" /> Refresh
                  </button>
                </div>
                <TrafficDataTable refresh={tableRefresh} />
              </div>
            </div>
          )}

          {tab === 'add' && (
            <div className="fade-in">
              <div className="dashboard-grid">
                <div className="card">
                  <div className="card-header">
                    <div className="card-title"><div className="card-icon icon-amber"><i className="fa fa-circle-plus" /></div>Add Traffic Data</div>
                    <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: 'rgba(255,183,0,0.15)', color: 'var(--accent-amber)', border: '1px solid rgba(255,183,0,0.3)', borderRadius: '6px', fontWeight: 600 }}>ADMIN ONLY</span>
                  </div>
                  <form onSubmit={handleAdd}>
                    <div className="form-group">
                      <label className="form-label">Location</label>
                      <input className="form-input" placeholder="e.g. Sector 18, Noida" value={addForm.location}
                        onChange={e => setAddForm(p => ({ ...p, location: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Vehicle Count</label>
                      <input type="number" className="form-input" placeholder="e.g. 450" value={addForm.vehicleCount}
                        onChange={e => setAddForm(p => ({ ...p, vehicleCount: e.target.value }))} min="0" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Average Speed (km/h)</label>
                      <input type="number" className="form-input" placeholder="e.g. 35" value={addForm.avgSpeed}
                        onChange={e => setAddForm(p => ({ ...p, avgSpeed: e.target.value }))} min="0" max="200" />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={addLoading} style={{ marginTop: '0.5rem' }}>
                      {addLoading ? <><span className="spinner" /> Submitting...</> : <><i className="fa fa-upload" /> Submit Data</>}
                    </button>
                  </form>
                </div>
                <div className="card">
                  <div className="card-header"><div className="card-title"><div className="card-icon icon-cyan"><i className="fa fa-circle-info" /></div>Guidelines</div></div>
                  {[
                    { icon: 'fa-location-dot', color: 'var(--accent-cyan)', title: 'Location Format', desc: 'Use readable names like "MG Road, Bangalore".' },
                    { icon: 'fa-car', color: 'var(--accent-green)', title: 'Vehicle Count', desc: 'Total observed vehicles at the location.' },
                    { icon: 'fa-gauge-high', color: 'var(--accent-amber)', title: 'Average Speed', desc: 'Mean vehicle speed in km/h.' },
                    { icon: 'fa-robot', color: 'var(--accent-red)', title: 'AI Processing', desc: 'System auto-classifies level (LOW/MEDIUM/HIGH).' },
                  ].map(tip => (
                    <div key={tip.title} style={{ display: 'flex', gap: '0.875rem', marginBottom: '1.25rem' }}>
                      <div className="card-icon" style={{ background: `${tip.color}20`, color: tip.color, flexShrink: 0, width: 32, height: 32 }}>
                        <i className={`fa ${tip.icon}`} />
                      </div>
                      <div>
                        <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{tip.title}</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{tip.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <div className="card-header">
                  <div className="card-title"><div className="card-icon icon-blue"><i className="fa fa-table" /></div>Recent Entries</div>
                  <button className="btn btn-secondary" style={{ padding: '0.4rem 0.875rem', fontSize: '0.8rem' }}
                    onClick={() => setTableRefresh(p => p + 1)}>
                    <i className="fa fa-rotate" /> Refresh
                  </button>
                </div>
                <TrafficDataTable refresh={tableRefresh} />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default function AdminDashboard() {
  return (
    <ToastProvider>
      <AdminDashboardContent />
    </ToastProvider>
  )
}
