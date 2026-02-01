import { ReactNode, useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import Agenda from '../pages/Agenda'
import Clients from '../pages/Clients'
import ClientSchedule from '../pages/ClientSchedule'
import ClientServices from '../pages/ClientServices'
import Login from '../pages/Login'
import MyAppointments from '../pages/MyAppointments'
import Services from '../pages/Services'
import { ensureProfile, getProfile, getSession } from '../services/auth'

type AuthState = 'loading' | 'authenticated' | 'unauthenticated'
type Role = 'professional' | 'client'

type RequireAuthProps = {
  children: ReactNode
  role?: Role
}

function RequireAuth({ children, role }: RequireAuthProps) {
  const [state, setState] = useState<AuthState>('loading')
  const [profileRole, setProfileRole] = useState<Role | null>(null)

  useEffect(() => {
    let isMounted = true

    getSession().then(async ({ data }) => {
      if (!isMounted) {
        return
      }

      if (data.session) {
        await ensureProfile()
        const profile = await getProfile()
        if (!isMounted) {
          return
        }

        setProfileRole(
          profile.data?.role === 'client' ? 'client' : 'professional'
        )
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

  if (role && profileRole && role !== profileRole) {
    return (
      <Navigate
        to={profileRole === 'client' ? '/cliente/servicos' : '/agenda'}
        replace
      />
    )
  }

  return <>{children}</>
}

function RoleRedirect() {
  const [state, setState] = useState<AuthState>('loading')
  const [profileRole, setProfileRole] = useState<Role>('professional')

  useEffect(() => {
    let isMounted = true

    getSession().then(async ({ data }) => {
      if (!isMounted) {
        return
      }

      if (!data.session) {
        setState('unauthenticated')
        return
      }

      await ensureProfile()
      const profile = await getProfile()
      if (!isMounted) {
        return
      }

      setProfileRole(
        profile.data?.role === 'client' ? 'client' : 'professional'
      )
      setState('authenticated')
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

  return (
    <Navigate
      to={profileRole === 'client' ? '/cliente/servicos' : '/agenda'}
      replace
    />
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RoleRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/agenda"
        element={
          <RequireAuth role="professional">
            <Agenda />
          </RequireAuth>
        }
      />
      <Route
        path="/services"
        element={
          <RequireAuth role="professional">
            <Services />
          </RequireAuth>
        }
      />
      <Route
        path="/clients"
        element={
          <RequireAuth role="professional">
            <Clients />
          </RequireAuth>
        }
      />
      <Route
        path="/cliente/servicos"
        element={
          <RequireAuth role="client">
            <ClientServices />
          </RequireAuth>
        }
      />
      <Route
        path="/cliente/agendar"
        element={
          <RequireAuth role="client">
            <ClientSchedule />
          </RequireAuth>
        }
      />
      <Route
        path="/cliente/meus-agendamentos"
        element={
          <RequireAuth role="client">
            <MyAppointments />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRoutes


