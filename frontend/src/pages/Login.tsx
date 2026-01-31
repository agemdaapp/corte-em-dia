import { FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { getSession, signIn } from '../services/auth'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let isMounted = true

    getSession().then(({ data }) => {
      if (!isMounted) {
        return
      }

      if (data.session) {
        navigate('/agenda', { replace: true })
      }
    })

    return () => {
      isMounted = false
    }
  }, [navigate])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const { error: signInError } = await signIn(email, password)

    setLoading(false)

    if (signInError) {
      setError('Credenciais inválidas.')
      return
    }

    navigate('/agenda', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white shadow-sm rounded-xl p-8">
        <h1 className="text-2xl font-semibold text-slate-900">Corte em Dia</h1>
        <p className="text-slate-500 mt-1">Acesso do profissional</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700" htmlFor="password">
              Senha
            </label>
            <input
              id="password"
              type="password"
              className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-md bg-slate-900 text-white py-2 font-medium hover:bg-slate-800 transition disabled:opacity-60"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login


