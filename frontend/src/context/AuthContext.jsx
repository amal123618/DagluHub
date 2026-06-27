import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { login as apiLogin, logout as apiLogout, getMe } from '../api/user'

// ── Constants ─────────────────────────────────────────────────────────────────
const TOKEN_KEY = 'dagluhub_token'

// ── Context ───────────────────────────────────────────────────────────────────
const AuthContext = createContext(null)

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [token, setToken]     = useState(() => localStorage.getItem(TOKEN_KEY))
  const [loading, setLoading] = useState(true)   // true while restoring session on startup
  const [error, setError]     = useState(null)   // last auth error message

  /**
   * On mount: if a token exists in localStorage, validate it by calling /api/auth/me/.
   * If the token is stale/invalid, clear it automatically.
   */
  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }

    getMe()
      .then((userData) => {
        setUser(userData)
      })
      .catch(() => {
        // Token is invalid or expired — wipe it
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Login: call the API, persist the token, store the user.
   * Returns the user object on success. Throws on failure.
   */
  const login = useCallback(async (username, password) => {
    setError(null)
    try {
      const data = await apiLogin(username, password)
      localStorage.setItem(TOKEN_KEY, data.token)
      setToken(data.token)
      setUser(data.user)
      return data.user
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
      throw err
    }
  }, [])

  /**
   * Logout: invalidate token on the server, clear local state.
   */
  const logout = useCallback(async () => {
    try {
      await apiLogout()
    } catch {
      // Even if the server call fails, clear local state
    } finally {
      localStorage.removeItem(TOKEN_KEY)
      setToken(null)
      setUser(null)
    }
  }, [])

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: Boolean(token && user),
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ── Hook ──────────────────────────────────────────────────────────────────────
/**
 * useAuth — consume the auth context in any component.
 *
 * Example:
 *   const { user, isAuthenticated, login, logout } = useAuth()
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>.')
  }
  return ctx
}
