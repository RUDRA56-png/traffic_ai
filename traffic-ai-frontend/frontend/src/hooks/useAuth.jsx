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
    const token = localStorage.getItem('jwt')

    if (token) {
      const payload = parseJwt(token)

      if (payload) {
        // ✅ FIXED ROLE HANDLING
        const rawRole = payload.role || payload.roles?.[0] || 'USER'

        const cleanRole = rawRole.startsWith('ROLE_')
          ? rawRole.replace('ROLE_', '')
          : rawRole

        setUser({
          token,
          role: cleanRole,
          username: payload.sub || 'User'
        })
      }
    }

    setLoading(false)
  }, [])

  // 🔐 LOGIN
  const login = async (credentials) => {
    try {
      const res = await authAPI.login(credentials)

      const token = res.data.token
      const role = res.data.role
      const username = res.data.username

      if (!token) throw new Error("Invalid login")

      // ✅ FIXED ROLE HANDLING
      const cleanRole = role.startsWith('ROLE_')
        ? role.replace('ROLE_', '')
        : role

      localStorage.setItem("jwt", token)
      localStorage.setItem("user_role", cleanRole)
      localStorage.setItem("username", username)

      setUser({
        token,
        role: cleanRole,
        username
      })

      return cleanRole

    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Login failed"

      throw new Error(message)
    }
  }

  // 🔐 LOGOUT
  const logout = async () => {
    try { await authAPI.logout() } catch {}

    localStorage.removeItem('jwt')
    localStorage.removeItem('user_role')
    localStorage.removeItem('username')

    setUser(null)
  }

  if (loading) {
    return (
      <div style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
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