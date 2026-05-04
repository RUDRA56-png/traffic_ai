import axios from 'axios'

// 🔥 FORCE backend URL (no fallback to localhost)
const BASE_URL = 'https://traffic-ai-fpya.onrender.com'

const api = axios.create({ baseURL: BASE_URL })

console.log("BASE_URL:", BASE_URL) // debug

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