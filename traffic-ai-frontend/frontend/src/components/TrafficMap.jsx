import React, { useEffect, useRef, useState } from 'react'

// ── Geoapify API key ──────────────────────────────────────────────────────────
const GEOAPIFY_KEY = "7e5f060b9af145b891b833715a821363"

// ── Traffic level colours ─────────────────────────────────────────────────────
const LEVEL_COLORS = { HIGH: '#ff4757', MEDIUM: '#ffb700', LOW: '#2ed573' }

// ─────────────────────────────────────────────────────────────────────────────
// Lazy-load Leaflet
// ─────────────────────────────────────────────────────────────────────────────
let leafletLoaded = false
let leafletLoading = false
let leafletCallbacks = []

function loadLeaflet() {
  return new Promise((resolve, reject) => {
    if (leafletLoaded) { resolve(window.L); return }
    leafletCallbacks.push(resolve)
    if (leafletLoading) return
    leafletLoading = true

    const css = document.createElement('link')
    css.rel = 'stylesheet'
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(css)

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.async = true
    script.onload = () => {
      leafletLoaded = true
      leafletCallbacks.forEach(cb => cb(window.L))
      leafletCallbacks = []
    }
    script.onerror = () => reject('Failed to load Leaflet')
    document.head.appendChild(script)
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Geoapify API helpers
// ─────────────────────────────────────────────────────────────────────────────

async function geocode(address) {
  try {
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(address)}&apiKey=${GEOAPIFY_KEY}&limit=1`
    const res = await fetch(url)
    const data = await res.json()
    if (!data.features?.length) return null
    const f = data.features[0]
    return {
      lat: f.geometry.coordinates[1],
      lon: f.geometry.coordinates[0],
      displayName: f.properties.formatted,
      country: f.properties.country,
      city: f.properties.city || f.properties.town || f.properties.village
    }
  } catch (e) {
    console.error('Geocode error:', e)
    return null
  }
}

async function autocompletePlaces(text) {
  if (!text || text.length < 3) return []
  try {
    const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(text)}&apiKey=${GEOAPIFY_KEY}&limit=5`
    const res = await fetch(url)
    const data = await res.json()
    return (data.features || []).map(f => ({
      label: f.properties.formatted,
      lat: f.geometry.coordinates[1],
      lon: f.geometry.coordinates[0]
    }))
  } catch (e) {
    return []
  }
}

async function getRoute(fromCoord, toCoord, mode = 'drive') {
  try {
    // FIX: Geoapify routing API uses lat,lon|lat,lon format
    const url = `https://api.geoapify.com/v1/routing?waypoints=${fromCoord.lat},${fromCoord.lon}|${toCoord.lat},${toCoord.lon}&mode=${mode}&details=instruction_details,route_details&apiKey=${GEOAPIFY_KEY}`
    const res = await fetch(url)
    const data = await res.json()
    if (!data.features?.length) return null
    const f = data.features[0]
    const props = f.properties || {}

    // FIX: Correctly extract steps from legs array
    const legs = props.legs || []
    const steps = legs.length > 0 ? (legs[0].steps || []) : []

    return {
      geojson: f,
      distance: props.distance || 0,
      time: props.time || 0,
      legs,
      steps
    }
  } catch (e) {
    console.error('Route error:', e)
    return null
  }
}

async function getIsoline(coord, rangeType = 'time', range = 600, mode = 'drive') {
  try {
    const url = `https://api.geoapify.com/v1/isoline?lat=${coord.lat}&lon=${coord.lon}&type=${rangeType}&mode=${mode}&range=${range}&apiKey=${GEOAPIFY_KEY}`
    const res = await fetch(url)
    return res.json()
  } catch (e) {
    console.error('Isoline error:', e)
    return null
  }
}

async function searchNearby(coord, category = 'parking', radius = 3000) {
  try {
    const url = `https://api.geoapify.com/v2/places?categories=${category}&filter=circle:${coord.lon},${coord.lat},${radius}&limit=10&apiKey=${GEOAPIFY_KEY}`
    const res = await fetch(url)
    const data = await res.json()
    return data.features || []
  } catch (e) {
    console.error('Nearby error:', e)
    return []
  }
}

// ── Traffic prediction heuristic ─────────────────────────────────────────────
function predictTraffic(hour = new Date().getHours(), day = new Date().getDay()) {
  const isWeekend = day === 0 || day === 6
  if (isWeekend) {
    if (hour >= 11 && hour <= 14) return { level: 'MEDIUM', description: 'Weekend midday — moderate activity', delayFactor: 1.2 }
    if (hour >= 18 && hour <= 21) return { level: 'MEDIUM', description: 'Weekend evening — some congestion', delayFactor: 1.15 }
    return { level: 'LOW', description: 'Weekend off-peak — roads clear', delayFactor: 1.0 }
  }
  if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20))
    return { level: 'HIGH', description: 'Rush hour — heavy congestion', delayFactor: 1.6 }
  if ((hour >= 7 && hour <= 8) || (hour >= 10 && hour <= 12) || (hour >= 16 && hour <= 17) || (hour >= 20 && hour <= 22))
    return { level: 'MEDIUM', description: 'Moderate traffic — some delays', delayFactor: 1.25 }
  return { level: 'LOW', description: 'Off-peak — roads clear', delayFactor: 1.0 }
}

function formatDuration(sec) {
  if (!sec || isNaN(sec)) return '—'
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}
function formatDistance(m) {
  if (!m || isNaN(m)) return '—'
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function TrafficMap({
  searchLocation,
  routeData,
  trafficPoints = [],
  showTrafficLayer = true,
  onRouteCalculated,
  onLocationFound
}) {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const routeLayerRef = useRef(null)
  const isolineLayerRef = useRef(null)
  const nearbyLayersRef = useRef([])
  const acTimerRef = useRef(null)

  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState(null)
  const [loading, setLoading] = useState('')

  // Form state
  const [fromInput, setFromInput] = useState('')
  const [toInput, setToInput] = useState('')
  const [travelMode, setTravelMode] = useState('drive')
  const [fromSuggestions, setFromSuggestions] = useState([])
  const [toSuggestions, setToSuggestions] = useState([])

  // Results
  const [routeInfo, setRouteInfo] = useState(null)
  const [steps, setSteps] = useState([])
  const [trafficPrediction, setTrafficPrediction] = useState(null)
  const [nearbyCategory, setNearbyCategory] = useState('parking')
  const [nearbyResults, setNearbyResults] = useState([])
  const [centerCoord, setCenterCoord] = useState(null)
  const [isolineMinutes, setIsolineMinutes] = useState(10)
  const [activePanel, setActivePanel] = useState('route')

  // ── Init map ────────────────────────────────────────────────────────────────
  useEffect(() => {
    loadLeaflet().then(L => {
      if (!mapContainerRef.current || mapRef.current) return

      const map = L.map(mapContainerRef.current, {
        center: [20.5937, 78.9629],
        zoom: 5,
        zoomControl: false
      })
      L.control.zoom({ position: 'topright' }).addTo(map)

      L.tileLayer(
        `https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_KEY}`,
        {
          attribution: '© <a href="https://www.geoapify.com/">Geoapify</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 20
        }
      ).addTo(map)

      mapRef.current = map
      setMapReady(true)
      setTrafficPrediction(predictTraffic())
    }).catch(err => setMapError(String(err)))

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // ── Sync external props ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !searchLocation) return
    doSearchLocation(searchLocation)
  }, [searchLocation, mapReady])

  useEffect(() => {
    if (!mapReady || !routeData) return
    // FIX: sync inputs when routeData prop changes
    setFromInput(routeData.start || '')
    setToInput(routeData.end || '')
    doRoute(routeData.start, routeData.end)
  }, [routeData, mapReady])

  useEffect(() => {
    if (!mapReady || !trafficPoints.length) return
    // FIX: only clear traffic point markers, not ALL markers (avoid clearing route pins)
    trafficPoints.forEach(pt => {
      if (!pt.location) return
      geocode(pt.location).then(c => {
        if (!c || !mapRef.current) return
        addCircleMarker(c, LEVEL_COLORS[pt.level?.toUpperCase()] || '#00e5ff', pt.location, `Traffic: ${pt.level || 'Unknown'}`)
      })
    })
  }, [trafficPoints, mapReady])

  // ── Map helpers ──────────────────────────────────────────────────────────────
  function clearMarkers() {
    markersRef.current.forEach(m => { try { mapRef.current?.removeLayer(m) } catch (e) {} })
    markersRef.current = []
  }

  function clearRoute() {
    if (routeLayerRef.current) {
      try { mapRef.current?.removeLayer(routeLayerRef.current) } catch (e) {}
      routeLayerRef.current = null
    }
  }

  function clearIsoline() {
    if (isolineLayerRef.current) {
      try { mapRef.current?.removeLayer(isolineLayerRef.current) } catch (e) {}
      isolineLayerRef.current = null
    }
  }

  function clearNearby() {
    nearbyLayersRef.current.forEach(l => { try { mapRef.current?.removeLayer(l) } catch (e) {} })
    nearbyLayersRef.current = []
  }

  function addCircleMarker(coords, color, title, popupText) {
    if (!mapRef.current || !window.L) return null
    const m = window.L.circleMarker([coords.lat, coords.lon], {
      radius: 9, fillColor: color, color: '#fff', weight: 2, fillOpacity: 0.9
    }).bindPopup(`<b>${title}</b><br/>${popupText}`).addTo(mapRef.current)
    markersRef.current.push(m)
    return m
  }

  function addPinMarker(coords, color, popupHtml) {
    if (!mapRef.current || !window.L) return null
    const icon = window.L.divIcon({
      className: '',
      html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.6)"></div>`,
      iconSize: [16, 16], iconAnchor: [8, 8]
    })
    const m = window.L.marker([coords.lat, coords.lon], { icon })
      .bindPopup(popupHtml)
      .addTo(mapRef.current)
    markersRef.current.push(m)
    return m
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  async function doSearchLocation(address) {
    if (!address || !address.trim()) return
    setLoading('Geocoding…')
    try {
      const c = await geocode(address)
      if (!c) { setLoading('Location not found'); setTimeout(() => setLoading(''), 2000); return }
      clearMarkers()
      mapRef.current.flyTo([c.lat, c.lon], 13)
      addPinMarker(c, '#00e5ff', `<b>${c.displayName}</b><br/>${c.city || ''} ${c.country || ''}`)
      setCenterCoord(c)
      onLocationFound?.(c)
    } catch (e) {
      setLoading('Error geocoding')
      setTimeout(() => setLoading(''), 2000)
    } finally {
      setLoading('')
    }
  }

  async function doRoute(from, to) {
    if (!from || !to || !from.trim() || !to.trim()) return
    setLoading('Calculating route…')
    clearRoute()
    clearMarkers()
    try {
      const [fromC, toC] = await Promise.all([geocode(from), geocode(to)])
      if (!fromC || !toC) {
        setLoading('Location not found')
        setTimeout(() => setLoading(''), 2500)
        return
      }

      const route = await getRoute(fromC, toC, travelMode)
      if (!route || !route.geojson) {
        setLoading('Route not found — try different locations')
        setTimeout(() => setLoading(''), 2500)
        return
      }

      const traffic = predictTraffic()
      const adjustedTime = Math.round(route.time * traffic.delayFactor)

      setRouteInfo({ distance: route.distance, time: adjustedTime, rawTime: route.time, traffic })
      setSteps(route.steps)
      setTrafficPrediction(traffic)
      setCenterCoord(fromC)
      onRouteCalculated?.({ ...route, traffic, adjustedTime })

      // FIX: Draw route with correct GeoJSON structure
      const L = window.L
      routeLayerRef.current = L.geoJSON(route.geojson, {
        style: {
          color: LEVEL_COLORS[traffic.level] || '#00e5ff',
          weight: 5,
          opacity: 0.9,
          dashArray: traffic.level === 'HIGH' ? '10 5' : null
        }
      }).addTo(mapRef.current)

      // FIX: Check bounds are valid before fitting
      const bounds = routeLayerRef.current.getBounds()
      if (bounds.isValid()) {
        mapRef.current.fitBounds(bounds, { padding: [50, 50] })
      }

      addPinMarker(fromC, '#2ed573', `<b>🟢 Start</b><br/>${fromC.displayName}`)
      addPinMarker(toC, '#ff4757', `<b>🔴 End</b><br/>${toC.displayName}`)

      setActivePanel('steps')
    } catch (e) {
      console.error('Route calculation error:', e)
      setLoading('Route calculation failed')
      setTimeout(() => setLoading(''), 2500)
    } finally {
      setLoading('')
    }
  }

  async function doIsoline() {
    if (!centerCoord) { alert('Search a location or calculate a route first.'); return }
    setLoading('Generating reachability zone…')
    clearIsoline()
    try {
      const data = await getIsoline(centerCoord, 'time', isolineMinutes * 60, travelMode)
      if (!data || !data.features?.length) {
        setLoading('Isoline not available')
        setTimeout(() => setLoading(''), 2000)
        return
      }
      const L = window.L
      isolineLayerRef.current = L.geoJSON(data, {
        style: { color: '#7bed9f', fillColor: '#7bed9f', fillOpacity: 0.18, weight: 2, dashArray: '6 3' }
      }).addTo(mapRef.current)
      const bounds = isolineLayerRef.current.getBounds()
      if (bounds.isValid()) {
        mapRef.current.fitBounds(bounds, { padding: [30, 30] })
      }
    } catch (e) {
      console.error('Isoline error:', e)
    } finally {
      setLoading('')
    }
  }

  async function doNearby() {
    if (!centerCoord) { alert('Search a location first.'); return }
    setLoading(`Searching ${nearbyCategory}…`)
    clearNearby()
    try {
      const places = await searchNearby(centerCoord, nearbyCategory, 3000)
      setNearbyResults(places)
      const L = window.L
      places.forEach(f => {
        if (!f.geometry?.coordinates) return
        const [lon, lat] = f.geometry.coordinates
        const p = f.properties
        const icon = L.divIcon({
          className: '',
          html: `<div style="background:#a29bfe;color:#fff;font-size:10px;padding:2px 6px;border-radius:4px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.4);border:1.5px solid #fff;max-width:120px;overflow:hidden;text-overflow:ellipsis">${(p.name || nearbyCategory).slice(0, 20)}</div>`,
          iconAnchor: [0, 0]
        })
        const m = L.marker([lat, lon], { icon })
          .bindPopup(`<b>${p.name || 'Place'}</b><br/>${p.formatted || ''}`)
          .addTo(mapRef.current)
        nearbyLayersRef.current.push(m)
      })
    } catch (e) {
      console.error('Nearby error:', e)
    } finally {
      setLoading('')
    }
  }

  // FIX: Autocomplete with independent timers per field
  const fromTimerRef = useRef(null)
  const toTimerRef = useRef(null)

  function handleFromInput(val) {
    setFromInput(val)
    setFromSuggestions([])
    clearTimeout(fromTimerRef.current)
    if (val.length >= 3) {
      fromTimerRef.current = setTimeout(async () => {
        const suggestions = await autocompletePlaces(val)
        setFromSuggestions(suggestions)
      }, 350)
    }
  }

  function handleToInput(val) {
    setToInput(val)
    setToSuggestions([])
    clearTimeout(toTimerRef.current)
    if (val.length >= 3) {
      toTimerRef.current = setTimeout(async () => {
        const suggestions = await autocompletePlaces(val)
        setToSuggestions(suggestions)
      }, 350)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (mapError) return <div style={S.errorBox}>❌ {mapError}</div>

  const tc = trafficPrediction
  const tcColor = tc ? LEVEL_COLORS[tc.level] : '#fff'

  return (
    <div style={S.wrapper}>
      {/* Spinner keyframe injected inline */}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div ref={mapContainerRef} style={S.map} />

      {/* Loading overlay */}
      {(loading || !mapReady) && (
        <div style={S.loadingOverlay}>
          <div style={S.loadingSpinner} />
          {loading || 'Loading Map…'}
        </div>
      )}

      {/* Control panel */}
      <div style={S.panel}>

        {/* Traffic badge */}
        {tc && (
          <div style={{ ...S.badge, borderColor: tcColor }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: tcColor, boxShadow: `0 0 6px ${tcColor}` }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: tcColor }}>TRAFFIC · {tc.level}</span>
            </div>
            <span style={{ fontSize: 10.5, color: '#aaa', marginTop: 2 }}>{tc.description}</span>
          </div>
        )}

        {/* Tabs */}
        <div style={S.tabBar}>
          {[['route', '🗺', 'Route'], ['steps', '📋', 'Steps'], ['traffic', '🚦', 'Forecast'], ['nearby', '📍', 'Nearby']].map(([id, icon, label]) => (
            <button key={id} style={{ ...S.tab, ...(activePanel === id ? S.tabActive : {}) }}
              onClick={() => setActivePanel(id)}>
              <span>{icon}</span>
              <span style={{ fontSize: 10 }}>{label}</span>
            </button>
          ))}
        </div>

        <div style={S.tabContent}>

          {/* ── ROUTE TAB ── */}
          {activePanel === 'route' && <>
            {/* From input */}
            <div style={{ position: 'relative' }}>
              <div style={S.inputLabel}>FROM</div>
              <input
                value={fromInput}
                onChange={e => handleFromInput(e.target.value)}
                placeholder="Origin…"
                style={S.input}
              />
              {fromSuggestions.length > 0 && (
                <div style={S.dropdown}>
                  {fromSuggestions.map((s, i) => (
                    <div key={i} style={S.dropItem}
                      onMouseDown={() => { setFromInput(s.label); setFromSuggestions([]) }}>
                      📍 {s.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* To input */}
            <div style={{ position: 'relative' }}>
              <div style={S.inputLabel}>TO</div>
              <input
                value={toInput}
                onChange={e => handleToInput(e.target.value)}
                placeholder="Destination…"
                style={S.input}
              />
              {toSuggestions.length > 0 && (
                <div style={S.dropdown}>
                  {toSuggestions.map((s, i) => (
                    <div key={i} style={S.dropItem}
                      onMouseDown={() => { setToInput(s.label); setToSuggestions([]) }}>
                      📍 {s.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Travel mode */}
            <div style={S.inputLabel}>TRAVEL MODE</div>
            <div style={S.modeRow}>
              {[['drive', '🚗', 'Drive'], ['walk', '🚶', 'Walk'], ['bicycle', '🚴', 'Cycle'], ['transit', '🚌', 'Transit']].map(([m, icon, label]) => (
                <button key={m}
                  style={{ ...S.modeBtn, ...(travelMode === m ? S.modeBtnActive : {}) }}
                  onClick={() => setTravelMode(m)}>
                  <div style={{ fontSize: 18 }}>{icon}</div>
                  <div style={{ fontSize: 9 }}>{label}</div>
                </button>
              ))}
            </div>

            <button style={S.primaryBtn} onClick={() => doRoute(fromInput, toInput)}>
              ↗ Calculate Route
            </button>
            <button style={S.secondaryBtn} onClick={() => doSearchLocation(fromInput || toInput)}>
              🔍 Search Location
            </button>

            {/* Route summary */}
            {routeInfo && (
              <div style={S.summaryBox}>
                <div style={S.summaryTitle}>Route Summary</div>
                {[
                  ['📏 Distance', formatDistance(routeInfo.distance)],
                  ['⏱ With traffic', formatDuration(routeInfo.time)],
                  ['🛣 Free-flow', formatDuration(routeInfo.rawTime)],
                  ['🚦 Delay factor', `${routeInfo.traffic.delayFactor}×`]
                ].map(([label, val], i) => (
                  <div key={i} style={S.summaryRow}>
                    <span style={{ color: '#aaa' }}>{label}</span>
                    <b style={{ color: i === 3 ? tcColor : '#fff' }}>{val}</b>
                  </div>
                ))}
              </div>
            )}

            {/* Reachability isoline */}
            <div style={S.isolineBox}>
              <div style={S.inputLabel}>REACHABILITY ZONE</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="range" min={5} max={60} value={isolineMinutes}
                  onChange={e => setIsolineMinutes(Number(e.target.value))}
                  style={{ flex: 1, accentColor: '#7bed9f' }} />
                <span style={{ fontSize: 12, color: '#7bed9f', minWidth: 36 }}>{isolineMinutes} min</span>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <button style={S.isolineBtn} onClick={doIsoline}>Show Zone</button>
                {isolineLayerRef.current && (
                  <button style={{ ...S.isolineBtn, background: 'rgba(255,255,255,0.1)', color: '#aaa', borderColor: 'rgba(255,255,255,0.2)' }} onClick={clearIsoline}>Clear</button>
                )}
              </div>
            </div>
          </>}

          {/* ── STEPS TAB ── */}
          {activePanel === 'steps' && (
            steps.length === 0
              ? <div style={S.emptyState}>Calculate a route first to see turn-by-turn directions.</div>
              : steps.map((step, i) => (
                <div key={i} style={S.step}>
                  <div style={S.stepNum}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, color: '#ddd', lineHeight: 1.4 }}>
                      {step.instruction?.text || step.name || 'Continue'}
                    </div>
                    <div style={{ fontSize: 11, color: '#666', marginTop: 3 }}>
                      {formatDistance(step.distance)} · {formatDuration(step.time)}
                    </div>
                  </div>
                </div>
              ))
          )}

          {/* ── TRAFFIC FORECAST TAB ── */}
          {activePanel === 'traffic' && <>
            <div style={S.forecastHeader}>24-Hour Traffic Forecast</div>
            <div style={{ fontSize: 11, color: '#777', marginBottom: 10 }}>
              Based on historical patterns for {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()]}.
            </div>
            {Array.from({ length: 24 }, (_, h) => {
              const p = predictTraffic(h)
              const color = LEVEL_COLORS[p.level]
              const now = new Date().getHours() === h
              const pct = ((p.delayFactor - 1) / 0.6) * 100
              return (
                <div key={h} style={{ ...S.hourRow, background: now ? 'rgba(255,255,255,0.06)' : 'transparent' }}>
                  <span style={{ fontSize: 11, minWidth: 34, color: now ? color : '#666', fontWeight: now ? 700 : 400 }}>
                    {String(h).padStart(2, '0')}:00
                  </span>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 3, height: 7, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 10, minWidth: 46, textAlign: 'right', color, fontWeight: 600 }}>
                    {p.level}{now ? ' ◀' : ''}
                  </span>
                </div>
              )
            })}
          </>}

          {/* ── NEARBY TAB ── */}
          {activePanel === 'nearby' && <>
            <div style={S.inputLabel}>CATEGORY</div>
            <select value={nearbyCategory} onChange={e => setNearbyCategory(e.target.value)} style={S.select}>
              {['parking', 'fuel', 'restaurant', 'cafe', 'hospital', 'pharmacy', 'hotel', 'atm', 'supermarket', 'bus_station', 'police', 'bank'].map(c => (
                <option key={c} value={c}>{c.replace('_', ' ')}</option>
              ))}
            </select>
            <button style={S.primaryBtn} onClick={doNearby}>Search Nearby Places</button>
            {nearbyResults.length === 0
              ? <div style={S.emptyState}>Search or route to a location first, then find nearby places.</div>
              : nearbyResults.map((f, i) => (
                <div key={i} style={S.nearbyCard}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#eee' }}>
                    {f.properties.name || nearbyCategory}
                  </div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{f.properties.formatted}</div>
                  {f.properties.distance && (
                    <div style={{ fontSize: 11, color: '#a29bfe', marginTop: 2 }}>
                      {formatDistance(f.properties.distance)} away
                    </div>
                  )}
                </div>
              ))
            }
          </>}

        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles (unchanged — original design preserved)
// ─────────────────────────────────────────────────────────────────────────────
const S = {
  wrapper: {
    position: 'relative', width: '100%', height: 620,
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    borderRadius: 14, overflow: 'hidden', background: '#0d0d12'
  },
  map: { position: 'absolute', inset: 0, zIndex: 0 },
  loadingOverlay: {
    position: 'absolute', inset: 0, zIndex: 20,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(10,10,16,0.75)', color: '#fff', fontSize: 13, gap: 10,
    backdropFilter: 'blur(4px)'
  },
  loadingSpinner: {
    width: 28, height: 28, border: '3px solid rgba(255,255,255,0.15)',
    borderTop: '3px solid #00e5ff', borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  },
  errorBox: { padding: 20, color: '#ff4757', background: '#0d0d12', borderRadius: 10, fontSize: 14 },
  panel: {
    position: 'absolute', top: 12, left: 12, width: 295,
    maxHeight: 'calc(100% - 24px)', overflowY: 'auto',
    background: 'rgba(12,12,18,0.94)', backdropFilter: 'blur(16px)',
    borderRadius: 12, border: '1px solid rgba(255,255,255,0.07)',
    zIndex: 10, boxShadow: '0 10px 40px rgba(0,0,0,0.7)',
    display: 'flex', flexDirection: 'column'
  },
  badge: {
    margin: '12px 12px 0', padding: '8px 12px',
    border: '1px solid', borderRadius: 8,
    background: 'rgba(255,255,255,0.03)',
    display: 'flex', flexDirection: 'column', gap: 2
  },
  tabBar: {
    display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)',
    margin: '10px 0 0', flexShrink: 0
  },
  tab: {
    flex: 1, padding: '7px 4px', background: 'none', border: 'none',
    color: '#666', cursor: 'pointer', fontSize: 11,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
    transition: 'color 0.2s'
  },
  tabActive: { color: '#fff', borderBottom: '2px solid #00e5ff' },
  tabContent: { padding: 12, display: 'flex', flexDirection: 'column', gap: 9, overflowY: 'auto' },
  inputLabel: { fontSize: 9.5, letterSpacing: 1.2, color: '#555', fontWeight: 700, marginBottom: 4 },
  input: {
    width: '100%', padding: '8px 10px', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none'
  },
  dropdown: {
    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 30,
    background: '#14141f', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '0 0 8px 8px', maxHeight: 160, overflowY: 'auto',
    boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
  },
  dropItem: {
    padding: '7px 10px', fontSize: 12, color: '#bbb', cursor: 'pointer',
    borderBottom: '1px solid rgba(255,255,255,0.04)'
  },
  modeRow: { display: 'flex', gap: 6 },
  modeBtn: {
    flex: 1, padding: '7px 0', background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
    color: '#aaa', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2
  },
  modeBtnActive: { background: 'rgba(0,229,255,0.12)', borderColor: '#00e5ff', color: '#00e5ff' },
  primaryBtn: {
    width: '100%', padding: '9px 0', background: '#00e5ff', color: '#000',
    border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer'
  },
  secondaryBtn: {
    width: '100%', padding: '8px 0', background: 'rgba(255,255,255,0.06)',
    color: '#bbb', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 13, cursor: 'pointer'
  },
  summaryBox: {
    background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 12px',
    display: 'flex', flexDirection: 'column', gap: 7
  },
  summaryTitle: { fontSize: 11, fontWeight: 700, color: '#555', letterSpacing: 1, marginBottom: 2 },
  summaryRow: { display: 'flex', justifyContent: 'space-between', fontSize: 13 },
  isolineBox: {
    background: 'rgba(123,237,159,0.06)', borderRadius: 8,
    padding: '10px 12px', border: '1px solid rgba(123,237,159,0.15)'
  },
  isolineBtn: {
    padding: '6px 12px', background: 'rgba(123,237,159,0.2)',
    color: '#7bed9f', border: '1px solid rgba(123,237,159,0.3)',
    borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600
  },
  step: {
    display: 'flex', gap: 10, alignItems: 'flex-start',
    padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.05)'
  },
  stepNum: {
    minWidth: 22, height: 22, borderRadius: '50%',
    background: '#00e5ff', color: '#000',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 10, fontWeight: 700, flexShrink: 0
  },
  forecastHeader: { fontSize: 13, fontWeight: 700, color: '#eee', marginBottom: 4 },
  hourRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '3px 6px', borderRadius: 5 },
  select: {
    width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
    color: '#fff', fontSize: 13, outline: 'none'
  },
  nearbyCard: {
    padding: '9px 11px', background: 'rgba(255,255,255,0.04)',
    borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)'
  },
  emptyState: { fontSize: 12, color: '#666', padding: '12px 0', textAlign: 'center', lineHeight: 1.6 }
}
