import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export const api = axios.create({ baseURL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    if (config.headers) {
      (config.headers as any).Authorization = `Bearer ${token}`
    } else {
      config.headers = { Authorization: `Bearer ${token}` } as any
    }
  }
  return config
})

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      const publicPages = ['/login', '/register']
      const isPublicPage = publicPages.some(p => location.pathname.startsWith(p))
      if (!isPublicPage) {
        location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)
