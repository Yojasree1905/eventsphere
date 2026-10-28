import { createContext, useCallback, useEffect, useState } from 'react'
import { getMe, login as apiLogin, register as apiRegister } from '../api/auth'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session on first load
  useEffect(() => {
    const token = localStorage.getItem('occasio_token')
    if (!token) { setLoading(false); return }
    getMe()
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem('occasio_token'))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await apiLogin(email, password)
    const { access_token, user: userData } = res.data
    localStorage.setItem('occasio_token', access_token)
    setUser(userData)
    return userData
  }, [])

  const register = useCallback(async (payload) => {
    const res = await apiRegister(payload)
    const { access_token, user: userData } = res.data
    localStorage.setItem('occasio_token', access_token)
    setUser(userData)
    return userData
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('occasio_token')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
