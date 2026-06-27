import axios from 'axios'
import { API_BASE } from '../services/apiBase'

export const api = axios.create({
  baseURL: API_BASE,
})

api.interceptors.response.use(
  (r) => r,
  (err: unknown) => {
    void (err as { message?: string; response?: unknown })
    return Promise.reject(err)
  },
)
