import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import '../styles.css'

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.username || !form.password) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      const role = await login(form)

      if (role === 'ADMIN') {
        navigate('/admin', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }

    } catch (err) {
      setError(err.message || "Invalid credentials. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
      <div className="auth-page" style={{ background: 'var(--bg-dark)' }}>
        <div className="bg-animated"><div className="grid-overlay" /></div>

        <div className="auth-card">
          <div className="auth-logo">
            <div className="logo-icon">🚦</div>
            <h1>TrafficAI</h1>
            <p>Intelligent Traffic Prediction System</p>
          </div>

          <form onSubmit={handleSubmit}>

            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                  type="text"
                  className="form-input"
                  placeholder="Enter your username"
                  value={form.username}
                  onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                  type="password"
                  className="form-input"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              />
            </div>

            {/* 🔥 SAFE ERROR DISPLAY */}
            {error && (
                <div className="alert alert-error">
                  <i className="fa fa-circle-exclamation" />
                  {" "}
                  {typeof error === "string" ? error : JSON.stringify(error)}
                </div>
            )}

            <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ marginTop: '1.25rem' }}
            >
              {loading
                  ? <><span className="spinner" /> Authenticating...</>
                  : <><i className="fa fa-right-to-bracket" /> Sign In</>
              }
            </button>

          </form>

          <div className="auth-footer">
            Don't have an account? <Link to="/register">Create one</Link>
          </div>

          {/* Demo Buttons */}
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: 'rgba(0,229,255,0.04)',
            borderRadius: '10px'
          }}>
            <p style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
              Demo Credentials
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setForm({ username: 'admin', password: 'admin123' })}>
                Admin
              </button>
              <button onClick={() => setForm({ username: 'user', password: 'user123' })}>
                User
              </button>
            </div>
          </div>

        </div>
      </div>
  )
}