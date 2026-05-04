import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../utils/api.js";

const AuthContext = createContext(null);

// 🔐 Decode JWT (optional but useful)
function parseJwt(token) {
  try {
    const base64 = token.split(".")[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔄 Load user from localStorage
  useEffect(() => {
    const token = localStorage.getItem("jwt");

    if (token) {
      const payload = parseJwt(token);

      if (payload) {
        setUser({
          token,
          role: (payload.role || "USER").replace("ROLE_", ""),
          username: payload.sub || "User"
        });
      }
    }

    setLoading(false);
  }, []);

  // 🔐 LOGIN
  const login = async (credentials) => {
    try {
      const res = await authAPI.login(credentials);

      console.log("LOGIN SUCCESS:", res.data);

      const token = res.data.token;
      const role = res.data.role;
      const username = res.data.username;

      if (!token) throw new Error("Invalid login");

      const cleanRole = role.replace("ROLE_", "");

      // ✅ Save token
      localStorage.setItem("jwt", token);
      localStorage.setItem("user_role", cleanRole);
      localStorage.setItem("username", username);

      // ✅ Set user
      setUser({
        token,
        role: cleanRole,
        username
      });

      return cleanRole;

    } catch (err) {
      console.error("LOGIN ERROR:", err);

      throw new Error(
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Login failed"
      );
    }
  };

  // 🔐 LOGOUT
  const logout = () => {
    localStorage.removeItem("jwt");
    localStorage.removeItem("user_role");
    localStorage.removeItem("username");
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        🚦 Loading...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);