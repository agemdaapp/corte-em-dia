import { FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  ensureProfile,
  getProfile,
  getSession,
  resetPassword,
  signIn,
} from '../services/auth'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showRecovery, setShowRecovery] = useState(false)
  const [recoveryEmail, setRecoveryEmail] = useState('')
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null)
  const [showSignupInfo, setShowSignupInfo] = useState(false)

  useEffect(() => {
    let isMounted = true

    getSession().then(async ({ data }) => {
      if (!isMounted) {
        return
      }

      if (data.session) {
        const profile = await getProfile()
        const role = profile.data?.role === 'client' ? 'client' : 'professional'
        navigate(role === 'client' ? '/cliente/servicos' : '/agenda', {
          replace: true,
        })
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

    await ensureProfile()

    const profile = await getProfile()
    const role = profile.data?.role === 'client' ? 'client' : 'professional'

    navigate(role === 'client' ? '/cliente/servicos' : '/agenda', {
      replace: true,
    })
  }

  const handleRecovery = async () => {
    setRecoveryMessage(null)
    if (!recoveryEmail) {
      setRecoveryMessage('Informe um email válido.')
      return
    }

    const { error: recoveryError } = await resetPassword(recoveryEmail)
    if (recoveryError) {
      setRecoveryMessage('Não foi possível enviar o email de recuperação.')
      return
    }

    setRecoveryMessage('Link de recuperação enviado para seu email.')
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white shadow-sm rounded-xl p-8">
        <h1 className="text-2xl font-semibold text-slate-900">Corte em Dia</h1>
        <p className="text-slate-500 mt-1">Acesso do sistema</p>

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
          <div className="flex flex-col gap-2 text-sm text-slate-500">
            <button
              type="button"
              className="w-full hover:text-slate-700"
              onClick={() => setShowRecovery(true)}
            >
              Esqueci minha senha
            </button>
            <button
              type="button"
              className="w-full hover:text-slate-700"
              onClick={() => setShowSignupInfo(true)}
            >
              Criar conta (cliente)
            </button>
          </div>
        </form>
      </div>

      {showRecovery && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Recuperação de senha
              </h2>
              <p className="text-slate-500 mt-1">
                Enviaremos um link para redefinir sua senha.
              </p>
            </div>

            {recoveryMessage && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-600 text-sm">
                {recoveryMessage}
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="recovery-email">
                Email
              </label>
              <input
                id="recovery-email"
                type="email"
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-slate-900"
                value={recoveryEmail}
                onChange={(event) => setRecoveryEmail(event.target.value)}
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className="px-4 py-2 rounded-md bg-slate-900 text-white hover:bg-slate-800"
                onClick={handleRecovery}
              >
                Enviar link
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50"
                onClick={() => setShowRecovery(false)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {showSignupInfo && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Cadastro de cliente
              </h2>
              <p className="text-slate-500 mt-1">
                O cadastro é realizado pelo profissional do salão. Solicite a criação da sua conta.
              </p>
            </div>
            <button
              type="button"
              className="px-4 py-2 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50"
              onClick={() => setShowSignupInfo(false)}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Login


