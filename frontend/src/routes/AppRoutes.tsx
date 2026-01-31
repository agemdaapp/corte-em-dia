import { ReactNode, useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import Agenda from '../pages/Agenda'
import Login from '../pages/Login'
import Services from '../pages/Services'
import { ensureProfile, getSession } from '../services/auth'

type AuthState = 'loading' | 'authenticated' | 'unauthenticated'

type RequireAuthProps = {
  children: ReactNode
}

function RequireAuth({ children }: RequireAuthProps) {
  const [state, setState] = useState<AuthState>('loading')

  useEffect(() => {
    let isMounted = true

    getSession().then(async ({ data }) => {
      if (!isMounted) {
        return
      }

      if (data.session) {
        await ensureProfile()
        setState('authenticated')
        return
      }

      setState('unauthenticated')
    })

    return () => {
      isMounted = false
    }
  }, [])

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Carregando...
      </div>
    )
  }

  if (state === 'unauthenticated') {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/agenda"
        element={
          <RequireAuth>
            <Agenda />
          </RequireAuth>
        }
      />
      <Route
        path="/services"
        element={
          <RequireAuth>
            <Services />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/agenda" replace />} />
    </Routes>
  )
}

export default AppRoutes


