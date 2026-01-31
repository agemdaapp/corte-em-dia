import axios from 'axios'

import { supabase } from './auth'

const apiUrl = import.meta.env.VITE_API_URL

if (!apiUrl) {
  throw new Error('API env var missing')
}

const api = axios.create({
  baseURL: apiUrl,
})

api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    }
  }

  return config
})

export default api


