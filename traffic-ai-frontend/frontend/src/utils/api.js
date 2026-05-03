import axios from 'axios'

// Use relative path so the Vite proxy handles it in dev.
// In production, set VITE_API_URL env var to your backend URL.
const BASE_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({ baseURL: BASE_URL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      localStorage.removeItem('jwt_token')
      localStorage.removeItem('user_role')
      localStorage.removeItem('username')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const authAPI = {
  login: (data) => api.post('/api/auth/login', data),
  register: (data) => api.post('/api/auth/register', data),
  logout: () => api.post('/api/auth/logout'),
}

export const trafficAPI = {
  add: (data) => api.post('/api/traffic/add', data),
  predict: (location) => api.get(`/api/traffic/predict/${encodeURIComponent(location)}`),
  route: (data) => api.post('/api/traffic/route', data),
  all: () => api.get('/api/traffic/all'),
}

export default api
