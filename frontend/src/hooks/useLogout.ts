import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { logoutAndRedirect } from '../utils/logout'

export function useLogout() {
  const navigate = useNavigate()

  return useCallback(async () => {
    await logoutAndRedirect(navigate)
  }, [navigate])
}
