import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../utils/api.js'

const AuthContext = createContext(null)

// 🔐 JWT PARSER
function parseJwt(token) {
  try {
    const base64 = token.split('.')[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/')

    const json = decodeURIComponent(
        atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
    )

    return JSON.parse(json)
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // 🔄 LOAD USER FROM TOKEN
  useEffect(() => {
    const token = localStorage.getItem('jwt_token')

    if (token) {
      try {
        const payload = parseJwt(token)

        if (payload) {
          const role = payload.role || payload.roles?.[0] || 'USER'
          const username = payload.sub || payload.username || 'User'

          setUser({
            token,
            role: role.replace('ROLE_', ''),
            username
          })
        } else {
          localStorage.clear()
        }
      } catch (e) {
        console.error("Token error", e)
        localStorage.clear()
      }
    }

    setLoading(false)
  }, [])

  // 🔐 LOGIN (FINAL FIXED)
  const login = async (credentials) => {
    try {
      const res = await authAPI.login(credentials)

      console.log("LOGIN RESPONSE:", res.data)

      const token = res.data.token
      const role = res.data.role
      const username = res.data.username

      if (!token) {
        throw new Error("Invalid login")
      }

      const cleanRole = role.replace("ROLE_", "")

      localStorage.setItem("jwt_token", token)
      localStorage.setItem("user_role", cleanRole)
      localStorage.setItem("username", username)

      setUser({
        token,
        role: cleanRole,
        username
      })

      return cleanRole

    } catch (err) {
      console.error("LOGIN ERROR:", err)

      const message =
          err.response?.data?.error ||
          err.response?.data?.message ||
          (typeof err.response?.data === "string" ? err.response.data : null) ||
          err.message ||
          "Login failed"

      throw new Error(message) // ✅ ALWAYS STRING
    }
  }

  // 🔐 LOGOUT
  const logout = async () => {
    try {
      await authAPI.logout()
    } catch {}

    localStorage.removeItem('jwt_token')
    localStorage.removeItem('user_role')
    localStorage.removeItem('username')

    setUser(null)
  }

  // 🔥 NO BLANK SCREEN
  if (loading) {
    return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: '#050b18',
          color: '#00e5ff',
          fontSize: '1.5rem'
        }}>
          🚦 Loading TrafficAI...
        </div>
    )
  }

  return (
      <AuthContext.Provider value={{ user, login, logout, loading }}>
        {children}
      </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)