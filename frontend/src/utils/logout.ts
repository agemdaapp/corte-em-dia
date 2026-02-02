import { signOut } from '../services/auth'
import { NavigateFunction } from 'react-router-dom'

export async function logoutAndRedirect(
  navigate: NavigateFunction
) {
  try {
    await signOut()
  } finally {
    navigate('/login', { replace: true })
  }
}
